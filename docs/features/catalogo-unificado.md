# Feature: Catálogo unificado (posts = catálogo del chatbot)

Roadmap de slices para **fusionar la tabla `products` del chatbot dentro de `posts`**, de modo que
lo que un usuario publica en la web sea, sin sincronización de por medio, lo que el chatbot puede
recomendar.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/catalogo-unificado-bitacora.md`.

> **Alcance cruzado.** Esta feature toca dos repositorios: este (Next.js) y el backend Python del bot
> en `C:\Users\S2G52\Desktop\jaimito\HazloSano\bot-whatsapp\backend`, que es el dueño del esquema vía
> Alembic. Cada slice indica en qué lado se trabaja.

## Problema / Savings / Why

- **Problema:** hoy existen dos catálogos del mismo vendedor en la misma base de datos, que no se
  conocen entre sí. `products` (9 filas, la lee el chatbot) y `posts` con `kind = 'producto'`
  (4 filas, las muestra la web). Lo que un usuario publica en el sitio es invisible para el bot, y
  el menú que el bot vende es invisible en el sitio.
- **Savings:** se elimina de raíz el trabajo de sincronizar dos tablas que guardan el mismo conjunto
  (doble id por producto, precio que se edita en un lado y no en el otro, cada campo nuevo decidido
  dos veces). Además la web hereda la búsqueda semántica y el bot hereda i18n y contenido largo, sin
  construir ninguna de las dos cosas.
- **Why:** la visión es que **todo usuario registrado sea vendedor** y que el catálogo sea lo que la
  comunidad publica — menú diario, proveedores locales y publicaciones de la gente. Si los dos
  conjuntos convergen, mantenerlos en tablas separadas es deuda permanente.

## Por qué ahora

El movimiento es barato hoy y caro después: **9 productos, 14 posts, 20 usuarios, 0 órdenes**. No hay
ninguna FK apuntando a `products` (`orders.items` y `product_recommendations.product_ids` son JSON),
así que la tabla no sostiene nada más que el código Python que la consulta.

## Decisión de modelado

Una publicación es una publicación; **`kind` decide qué es**. La web muestra todo; el chatbot
consulta `kind = 'producto' AND is_available`. `products` desaparece.

### Reparto de columnas

El criterio es si el dato depende del idioma:

| `posts` (independiente del idioma) | `post_translations` (se deriva del texto) |
|---|---|
| `price`, `is_available`, `kind`, `origin`, `seller_id`, `category`, `sub_category`, `external_url` | `title`, `slug`, `content`, `tags`, **`embedding vector(768)`** |

**El `embedding` va por traducción, no por post.** El vector se deriva del texto y el texto cambia con
el idioma. Ponerlo en `post_translations` no cuesta trabajo extra (la consulta de búsqueda ya se une a
esa tabla para devolver título y slug: filtrar por `locale` agrega una condición, no un JOIN) y
degrada bien: si falta la traducción del idioma pedido, se cae al `defaultLocale`, y `gemini-embedding-001`
es cross-lingual, así que una consulta en inglés sigue haciendo match contra texto en español, solo
con menos precisión.

**`category` y `sub_category` se guardan como claves de allowlist**, siguiendo el patrón que ya usa
`origin`: la clave en BD (`alimentacion`, `bebidas`), la etiqueta traducida en i18n
(igual que `src/infra/UI/labels/postOriginLabels.ts`). Guardar `'Alimentación'` como texto libre
metería español en la UI en inglés y en el texto del embedding.

### Ranking en una función SQL, no en un servicio

La búsqueda del bot no es código Python: es una consulta SQL (CTE con `embedding <=> $1` de pgvector,
JOIN a `sellers` para el boost de `has_membership` +0.15 y `has_paid_ads` +0.10, y `ST_DWithin` sobre
`branches.location` para el radio). Lo único que Python aporta es armar el vector con una llamada a
Gemini.

Por eso el ranking baja a una **función de Postgres** que ambos consumidores llaman, en vez de a un
endpoint FastAPI. Como ya comparten base de datos, compartir una función es *menos* acoplamiento que
compartir un servicio HTTP, y evita meter Cloud Run en el camino crítico de la búsqueda del sitio
(arranque en frío, o ~$65/mes por mantener una instancia despierta).

Cada app llama a Gemini directo con el mismo modelo y dimensión (`gemini-embedding-001`, 768 dims):
los vectores son compatibles. Son ~15 líneas duplicadas, más barato que un servicio del que dependa
la búsqueda.

### Alternativas descartadas

| Alternativa | Por qué no |
|---|---|
| Puente: `posts.product_id` + sincronizar ambas tablas | La sincronización sería permanente para un conjunto de datos que va a ser el mismo |
| `products` absorbe a `posts` | `products` no tiene i18n, slug, contenido largo, comentarios ni media múltiple; habría que construirlo todo |
| Vista de compatibilidad `products` sobre `posts` | Buena idea con usuarios en producción; sin usuarios, migrar ambos lados de una vez sale más limpio |
| Endpoint `/search` en FastAPI | Salto de red, arranque en frío, API key y despliegues acoplados para envolver una consulta SQL |
| Embeddings solo en el backend Python | La web necesita vectorizar la frase del usuario en cada búsqueda; dependería de Cloud Run para buscar |

## Esquema objetivo

```
posts               + category, sub_category, is_available, seller_id, external_url
post_translations   + tags, embedding vector(768)
sellers             + user_id  → users.id   (nullable: un proveedor puede existir sin cuenta)
products            → se elimina al terminar el slice 3
```

`sellers` **no** se fusiona con `users`: `users` es identidad y autenticación (de ahí cuelgan
`accounts` y `sessions`), `sellers` es el perfil comercial público (logo, teléfono, membresía,
sucursales). Separados, un proveedor local puede darse de alta sin cuenta en el sitio.

## Slices

### Slice 1 — Esquema unificado y categoría en la publicación  *(actual)*

Aditivo y reversible. `products` no se toca todavía.

- **Backend (Alembic):** migración que agrega las columnas del esquema objetivo. Sin `NOT NULL` sin
  default, sin borrar nada.
- **Web:** mirror manual del esquema Drizzle (`src/infra/dataAccess/db/schema/posts.ts`).
- **Dominio:** allowlist de `category`/`sub_category` con sus etiquetas i18n, siguiendo el patrón de
  `origin`.
- **`/publicar`:** selector de categoría para publicaciones de tipo producto; la categoría se muestra
  en la tarjeta y en el detalle.
- `is_available` se persiste con default `true`; su control en UI queda para cuando exista edición de
  publicaciones.

**Criterios de aceptación:**
1. Publicar un producto con categoría lo guarda y la categoría se ve traducida en la tarjeta y el detalle.
2. Publicar un producto sin categoría sigue funcionando (campo opcional en este slice).
3. Las publicaciones existentes siguen funcionando: `is_available = true`, resto de campos nulos.
4. La etiqueta de categoría se muestra en español o inglés según el locale, sin cadenas en BD.

### Slice 2 — Migrar los 9 productos a `posts`  *(futuro)*

- Script de migración de datos que copia cada `products` a `posts` + `post_translations` (`es`) +
  `post_media`, **conservando el `id`** (uuid → text) para no invalidar los 69 registros históricos de
  `product_recommendations`.
- Los `embedding` existentes se **reutilizan tal cual** (mismo modelo y dimensión): se mueven a
  `post_translations`, no se regeneran.
- Mapeos: `name` → `title`, `description` → `content`, `image_url` → `post_media`, `product_url` →
  `external_url`, teléfono del seller → `contact_whatsapp`, `origin = hazlo_sano_propio`.
- `products` queda intacta; el bot sigue leyéndola. Cero downtime.

**Criterios de aceptación:**
1. Los 9 productos existen como `posts` con `kind = 'producto'`, su embedding y su media.
2. Los ids se conservan; el histórico de recomendaciones sigue resolviendo.
3. El script es idempotente y tiene modo `--dry-run` y `--remove`.
4. `/productos` los lista junto a los 4 productos que ya había.

### Slice 3 — El bot lee de `posts` vía la función SQL  *(futuro)*

El slice de mayor riesgo: reescribe el dominio de producto del backend.

- Función `search_posts_semantic(query_embedding, locale, lat, lng, radius_m, pool_size, final_limit,
  threshold, exclude_ids)` que encapsula el ranking (distancia coseno + boost de membresía/anuncios +
  filtro geográfico), creada por migración Alembic.
- El repositorio del backend apunta a `posts`/`post_translations` y consume la función. El modelo de
  dominio `Product` se conserva para que `orchestrator` y `search` no cambien.
- Al quedar verde: se elimina `products`.

**Criterios de aceptación:**
1. Para las mismas consultas, el bot recomienda los mismos productos que antes de migrar (test golden).
2. Un producto publicado desde la web aparece en las recomendaciones del bot.
3. El flujo de Telegram/WhatsApp responde con nombre, precio e imagen correctos.
4. Con `locale` sin traducción disponible, cae al idioma por defecto en vez de no devolver nada.

### Slice 4 — Embedding al publicar desde la web  *(futuro)*

- Al publicar o editar, la web genera el embedding con Gemini (768 dims) y lo guarda en
  `post_translations.embedding`.
- **Fuera del camino crítico:** si Gemini falla, la publicación se guarda igual con `embedding = null`
  y queda pendiente de indexar; script de backfill para reintentar.
- El panel admin muestra cuántas publicaciones están pendientes de indexar.

**Criterios de aceptación:**
1. Publicar un producto deja su embedding guardado.
2. Con Gemini caído, la publicación se crea igual y queda marcada como pendiente.
3. El backfill indexa las pendientes y son recomendables después.

### Slice 5 — Búsqueda semántica en la web  *(futuro)*

- `/buscar` usa la misma función SQL, reemplazando el `ILIKE '%término%'` actual, que además carga
  todos los ids que hacen match a memoria y pagina con `slice()`
  (`PostgresSearchPostRepository.ts:38-57`).
- La paginación baja a SQL.

**Criterios de aceptación:**
1. Buscar por intención ("algo ligero para desayunar") devuelve productos relacionados, no solo
   coincidencias literales.
2. La búsqueda tolera acentos y variantes.
3. La paginación no carga a memoria más que la página pedida.

### Slice 6 — Vendedores y ubicación  *(futuro)*

- `sellers.user_id`; al publicar un producto, el usuario obtiene (o crea) su perfil de vendedor.
- Captura de ubicación para crear una `branch`, requisito para que el bot recomiende por cercanía:
  sin sucursal con coordenadas, un producto solo aparece en el fallback sin geo.

**Criterios de aceptación:**
1. Un usuario publica un producto y queda asociado a su perfil de vendedor.
2. Un producto con sucursal en el radio se recomienda a un usuario cercano.
3. Un vendedor puede existir sin cuenta de usuario (alta manual de proveedor local).

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El slice 3 rompe las recomendaciones del bot | Test golden capturado *antes* de migrar; `products` se elimina solo cuando el bot ya funciona contra `posts` |
| Migración sobre BD compartida | Slices 1 y 2 son puramente aditivos; nada se borra hasta el 3 |
| La calidad semántica cambia al mover el texto | El embedding se reutiliza sin regenerar; si se regenera, se compara contra el golden |
| Publicar depende de Gemini | El embedding se genera fuera del camino crítico (slice 4) |

## Costos operativos

- **Gemini embeddings:** $0.15 / 1M tokens ($0.075 en batch). ~100 tokens por producto y ~20 por
  consulta: 10,000 productos ≈ $0.15; 50,000 búsquedas ≈ $0.15.
- **Cloud Run:** sin cambios; el bot sigue despertando solo con webhooks, dentro de la capa gratuita.
- **Supabase:** pgvector y PostGIS ya activos. A esta escala no hace falta índice HNSW.
- **Vercel:** a revisar aparte — el plan Hobby es para uso no comercial, y el sitio va a vender.

## Fuera de alcance (por ahora)

Carrito, checkout y órdenes reales (`orders` existe pero está vacía). Traducción automática del
contenido al publicar: la consolidación aporta *dónde* guardar las traducciones, no las traducciones
mismas — hoy las 14 que existen son todas `es`. Se decidirá después.

## Enfoque de pruebas

- **Unit (Vitest):** allowlist y etiquetas de `category`; validación de producto; armado del texto del
  embedding.
- **Integración:** persistencia de los campos nuevos; idempotencia del script de migración.
- **Behavior (Playwright):** escenarios en `src/e2e/unifiedCatalog/unifiedCatalog.feature`. Solo los
  del slice actual están detallados y conectados; el resto va con tag `@future` y no corre en CI.
- **Backend (pytest):** test golden de recomendaciones antes/después del slice 3.
