# Bitácora — Catálogo unificado

Registro append-only por slice. El roadmap vive en `docs/features/catalogo-unificado.md`.

---

## Slice 1 — Esquema unificado y categoría en la publicación (2026-07-25)

### Objetivo

Preparar `posts` para que pueda contener todo lo que hoy vive en `products` (la tabla que lee el
chatbot), y entregar de paso el primer pedazo visible: publicar un producto con categoría y verla
traducida. Todo aditivo: `products` no se toca y nada se borra.

### Decisiones y por qué

- **El `embedding` va en `post_translations`, no en `posts`.** El vector se deriva del texto y el
  texto cambia con el idioma. Como la consulta de búsqueda ya se une a esa tabla para devolver
  título y slug, filtrar por `locale` agrega una condición, no un JOIN. Cambiarlo hoy cuesta una
  migración de un minuto (14 filas); con 5,000 posts sería regenerar todos los vectores.
- **`category`/`sub_category` guardan la clave de una allowlist, no la etiqueta.** Guardar
  `"Alimentación"` metería español en la UI en inglés y en el texto que alimenta el embedding.
  Mismo patrón que ya usaba `origin`.
- **Las etiquetas se resuelven por idioma en un módulo de labels, no con next-intl.** El repo no
  tiene `NextIntlClientProvider` montado y `CardForList` se renderiza también dentro de un
  componente cliente; usar `useLocale()` habría reventado en runtime. Un mapa por locale es
  testeable, no necesita provider y sigue la convención de `postOriginLabels.ts`.
- **Una categoría inválida se ignora (queda `null`), no rompe la publicación.** Es la misma
  defensa en servidor que `resolveOriginForUser`: la forma del dato se normaliza antes de validar.
- **Los selectores de categoría solo aparecen cuando el tipo es "producto".** En un anuncio serían
  ruido; obligó a volver el `<select>` de `kind` un input controlado.

### Archivos tocados

**Backend Python (Alembic — dueño del esquema)**
- `alembic/versions/0023_2026-07-25_unify_catalog_into_posts.py` (nuevo)

**Dominio**
- `src/domain/entities/post/category.ts` (nuevo) + `category.test.ts`
- `src/domain/entities/post/types.ts`

**Infra**
- `src/infra/dataAccess/db/schema/posts.ts` (espejo manual del esquema)
- `src/infra/dataAccess/createOnePost/PostgresPostRepository.ts`
- `src/infra/dataAccess/getOnePostWithPaginatedComments/PostgresGetOnePost.ts`
- `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`
- `src/infra/UI/labels/postCategoryLabels.ts` (nuevo) + test
- `src/infra/UI/components/CategoryTag/CategoryTag.tsx` (nuevo) + test
- `src/infra/UI/components/CardForList/CardForList.tsx`
- `src/infra/UI/mappers/posts/mapPostsToCards.ts`

**App**
- `src/app/[locale]/publicar/actions.ts`
- `src/app/[locale]/publicar/PublishForm.tsx`
- `src/app/[locale]/[slug]/page.tsx`
- `src/app/[locale]/[slug]/ui/PostDetail.tsx`

**Pruebas**
- `src/e2e/unifiedCatalog/unifiedCatalog.feature`, `unifiedCatalog.spec.ts`, `UnifiedCatalogPage.ts`
- `src/e2e/testUtils/seedPost.ts`, `readPostRow.ts` (nuevo)

### Comandos

```
pnpm run typecheck          # limpio
pnpm run lint               # limpio
pnpm run test:run           # 22 archivos, 127 pruebas en verde
venv/Scripts/python -m alembic heads   # una sola cabeza: 0023_2026_07_25
```

### Validación

- **Typecheck:** sin errores.
- **Lint:** sin errores.
- **Vitest:** 127 pruebas en verde (22 archivos). Nuevas: 12 de la allowlist de categorías,
  8 de etiquetas por idioma, 5 del componente `CategoryTag`.
- **Alembic:** la migración carga y deja una sola cabeza (`0022 → 0023`), sin ramas.
- **Playwright: NO ejecutado.** Depende de que la migración esté aplicada; queda pendiente.

### Desviaciones respecto al roadmap

- El roadmap decía "etiquetas traducidas en los archivos i18n". Se hizo con un módulo de labels
  por locale (ver decisiones). El comportamiento observable es el mismo.
- Se agregó `readPostRow.ts` como utilidad de e2e, no previsto: los escenarios con tabla
  campo/valor necesitan leer el estado guardado sin pasar por la UI.

### Pendiente sobre recursos compartidos

Nada escrito todavía en la BD compartida. La migración **no está aplicada**: mientras no se
aplique, cualquier consulta que lea `p.category` falla, es decir la home, `/productos` y el detalle
responden error. Aplicarla es el siguiente paso y requiere aprobación explícita.

### Recap

El código del slice 1 está completo y verde en todo lo que no toca la base de datos: dominio,
infra, UI y pruebas unitarias. La migración de Alembic está escrita, carga bien y no genera ramas,
pero sigue sin aplicarse, así que la aplicación no puede correr contra la BD hasta que se ejecute
`alembic upgrade head`. Los escenarios de Playwright están escritos y esperando esa aplicación.

### Próximos pasos (opciones)

1. **Aplicar la migración** (`alembic upgrade head` en el backend) y correr `pnpm run test:e2e:run`
   para cerrar el slice 1 con los escenarios en verde. **Pendiente del usuario:** autorizarlo.
2. Retro-ajustar `publishProduct.feature` a la convención nueva (bloque `Context:` y tablas de
   ejemplos), que quedó fuera de este slice.
3. Arrancar el slice 2 (migrar los 9 productos a `posts`) una vez que el 1 esté verde.

---

## Slice 2 — Migrar los 9 productos del chatbot a `posts` (2026-07-25)

### Objetivo

Traer el catálogo que hoy lee el chatbot (`products`) a `posts`, sin tocar `products`: el bot lo
sigue leyendo hasta el slice 3, así que la migración es aditiva y no hay ventana de caída.

### Decisiones y por qué

- **Se conserva el id.** `posts.id` es `text` y `products.id` es `uuid`, pero el valor es el mismo.
  Los 69 registros de `product_recommendations` guardan ids en JSON (no hay FK), así que
  conservarlos es lo único que mantiene vivo ese histórico. Por eso el script **no** usa
  `PostgresPostRepository`, que genera su propio `crypto.randomUUID()`.
- **El embedding se copia dentro de PostgreSQL**, con un `INSERT ... SELECT` que lo lee de
  `products` en el mismo statement. Nunca pasa por JavaScript: se evita serializar 768 floats y se
  garantiza que el vector es idéntico, no uno regenerado con otro texto.
- **Las reglas de mapeo viven en el dominio** (`legacyCatalog.ts`), no en el script: qué origen se
  asigna, cómo se traduce la etiqueta heredada a la clave de la allowlist y cómo se arma el
  WhatsApp son decisiones de negocio, y así se prueban sin base de datos.
- **`storage.googleapis.com` se agregó a `next.config`.** Las imágenes de los 9 productos viven
  ahí; sin el host, `next/image` lanza "hostname not configured" y la tarjeta no renderiza. Sin
  esto, el criterio de aceptación 4 no se cumplía.
- **Idempotencia por id, no por slug.** Si el post ya existe se omite; así una segunda corrida no
  duplica ni cambia nada.

### Archivos tocados

- `src/domain/entities/post/legacyCatalog.ts` (nuevo) + `legacyCatalog.test.ts`
- `src/scripts/migrateProductsToPosts.ts` (nuevo)
- `package.json` (script `migrate:products`)
- `next.config.mjs` (host de imágenes del catálogo)
- `src/e2e/unifiedCatalog/unifiedCatalog.feature` (slice 2 detallado, sin `@future`)
- `docs/features/catalogo-unificado.md` (estados de slices)

### Comandos

```
pnpm run typecheck                        # limpio
pnpm run lint                             # limpio
pnpm run migrate:products -- --dry-run    # 9 productos mapeados, sin escribir
pnpm run migrate:products                 # migrados 9, omitidos 0
pnpm run migrate:products                 # 2ª corrida: migrados 0, omitidos 9
```

### Validación (con números)

- **Mapeo (Vitest):** 12 pruebas nuevas en `legacyCatalog.test.ts`, en verde.
- **Migración:** 9 de 9 productos migrados. `posts` con `kind='producto'` pasó de 4 a **13**.
- **Ids conservados:** 9 de 9 (`join products pr on pr.id::text = p.id`).
- **Embeddings:** 9 de 9 presentes y **9 de 9 idénticos** al vector original
  (`count(*) filter (where t.embedding = pr.embedding)` = 9).
- **Media:** 9 de 9 con imagen; 0 posts con media duplicada tras la segunda corrida.
- **Idempotencia:** segunda corrida → 0 migrados, 9 omitidos, totales sin cambio.
- **Lectura de `/productos`:** la consulta del listado devuelve **13** items (los 9 migrados con
  su sub-categoría + los 4 previos).
- **Playwright:** no ejecutado en esta sesión (el hook de pre-commit lo corre completo).

### Escrito en recursos compartidos

Se insertaron **9 posts** (más sus 9 traducciones y 9 medios) en la BD compartida. `products`,
`sellers`, `orders` y `product_recommendations` **no se tocaron**. Para deshacer:

```
pnpm run migrate:products -- --remove
```

que borra exactamente los posts cuyo id existe en `products` (translations y media caen por
cascada).

### Desviaciones respecto al roadmap

- El roadmap no contemplaba tocar `next.config.mjs`; fue necesario para que las imágenes del
  catálogo rendericen.
- El roadmap decía mapear "teléfono del seller → `contact_whatsapp`". Se guardan ambos:
  `contact_phone` con el número tal cual y `contact_whatsapp` con la lada de país.

### Recap

Los 9 productos del chatbot ya son publicaciones de comida-justa, con su id original, su embedding
intacto, su imagen y su categoría, y `/productos` los lista junto a los 4 que ya existían: 13 en
total. `products` sigue en pie e intacta, así que el bot no se enteró de nada — sigue leyendo su
tabla. El script es idempotente y reversible.

### Próximos pasos (opciones)

1. **Slice 3:** crear la función SQL `search_posts_semantic` y apuntar el repositorio del backend a
   `posts`, con test golden de recomendaciones antes/después. Es el slice de mayor riesgo y el que
   permite finalmente eliminar `products`.
2. Adelantar el slice 4 (embedding al publicar) para que lo que se publique desde la web ya nazca
   indexado; no depende del slice 3.
3. Retro-ajustar `publishProduct.feature` a la convención nueva del skill.

---

## Slice 3 — El bot lee de `posts` vía funciones SQL (2026-07-25)

### Objetivo

Que el chatbot deje de leer `products` y recomiende desde `posts`, sin que cambien sus
respuestas. Es el slice de mayor riesgo: toca el dominio de producto del backend Python.

### Decisiones y por qué

- **Golden del *candidate pool*, no de la selección final.** El ranking final aplica
  `membership*0.15 + ads*0.10 + RANDOM()`: compararlo sería una prueba intermitente. El pool
  (los más cercanos por distancia coseno) es determinista y es donde vive el riesgo real.
- **Cada producto es su propia consulta.** Se usa su embedding ya guardado como vector de
  búsqueda en vez de pedir uno nuevo a Gemini: sin API key, sin costo, reproducible bit a bit.
- **Dos funciones, no una.** `search_posts_semantic` devuelve el pool (determinista, es lo que
  compara el golden); `recommend_posts` aplica encima el boost comercial y `RANDOM()`. La parte
  no determinista queda aislada en una capa delgada.
- **SQL en crudo en el repositorio nuevo, no ORM.** La proyección necesita traducción con
  respaldo de idioma, primera imagen y vendedor; con relaciones ORM habría que declarar un modelo
  `Post` completo para un caso de solo lectura.
- **El repositorio viejo se conserva.** `PostgresProductRepository` sigue en el árbol hasta que
  se elimine `products`: revertir es cambiar una línea de `dependencies.py`.
- **`create`/`update` lanzan `NotImplementedError`.** El catálogo se publica desde el sitio, que
  es dueño de `posts`; el bot solo lee. Ningún endpoint los llamaba.

### Hallazgo que corrigió el diseño

`search_posts_semantic` unía `sellers` con INNER JOIN (herencia de cuando el catálogo era solo
del restaurante). Eso dejaba fuera **las 4 publicaciones hechas desde el sitio**, que no tienen
`seller_id` — justo lo contrario de lo que persigue la feature. Migración `0025`: LEFT JOIN con
`COALESCE(..., false)` en los boosts. Verificado antes y después con una publicación de prueba
sin vendedor: con INNER JOIN no aparecía; con LEFT JOIN aparece empatada en distancia 0.0.

### Archivos tocados (backend Python)

- `alembic/versions/0024_2026-07-25_add_search_posts_semantic.py` (nuevo)
- `alembic/versions/0025_2026-07-25_recommend_posts_without_seller.py` (nuevo)
- `app/infrastructure/db/repositories/post_product.py` (nuevo)
- `app/api/dependencies.py` (cableado al repositorio nuevo)
- `scripts/capture_search_golden.py` (nuevo)
- `tests/golden/search_golden.json` (nuevo, 81 filas / 9 consultas)
- `tests/test_search_golden.py` (nuevo)

### Validación (con números)

- **Golden:** las 9 consultas devuelven el mismo pool, en el mismo orden, leyendo de `posts` a
  través de la función SQL. Verificado antes y después de la `0025`.
- **pytest:** 73 pruebas en verde, incluidas las 2 nuevas del golden.
- **Repositorio nuevo contra la base real:** `get_all` → 13; `get_by_id` resuelve con el id del
  catálogo viejo; `search_by_text("jugo")` → `['Jugo Verde']`; `search_semantic` → 3 resultados;
  `locale='en'` sin traducción cae al español.
- **Publicación sin vendedor:** aparece en el pool tras la `0025` (distancia 0.0), comprobado con
  un registro de prueba creado y borrado en la misma corrida.

### Escrito en recursos compartidos

Dos migraciones aplicadas (`0024`, `0025`), ambas solo `CREATE OR REPLACE FUNCTION`: no tocan
datos ni estructura de tablas. Se revierten con `alembic downgrade 0023_2026_07_25`. Se creó y
borró una publicación de prueba (`00000000-dead-beef-0000-000000000001`); no quedó nada.

### Lo que NO quedó cubierto

- **Criterio 2 solo a medias.** El mecanismo ya permite recomendar lo publicado desde el sitio,
  pero esas 4 publicaciones **no tienen embedding**, así que siguen invisibles para el bot hasta
  el slice 4. Es la única pieza que falta para cerrarlo.
- **Criterio 3 sin probar en vivo.** El flujo de Telegram/WhatsApp no se ejercitó contra un
  webhook real; las 73 pruebas usan dobles.
- **`products` sigue en pie**, intacta. Eliminarla es la última acción del slice y va con su
  propia aprobación.
- **Ruff no está instalado** en el venv del backend, así que los archivos nuevos no se lintearon.

### Recap

El bot ya recomienda leyendo de `posts` a través de dos funciones SQL que el sitio también podrá
consumir, y lo hace devolviendo exactamente los mismos resultados que antes: el golden capturado
contra `products` pasa sin una sola diferencia. El repositorio viejo y la tabla `products` siguen
ahí, así que revertir cuesta una línea. Falta darle embedding a lo que se publica desde el sitio
para que el círculo se cierre.

### Próximos pasos (opciones)

1. **Slice 4 — embedding al publicar.** Cierra el criterio 2 y es lo que hace que la feature
   entera signifique algo: publicar en el sitio y que el bot lo recomiende.
2. **Probar el bot en vivo** (Telegram) antes de eliminar `products`, para cerrar el criterio 3.
3. **Eliminar `products`** una vez lo anterior esté verde. Pendiente de tu aprobación.

---

## Estado al pausar por reinicio (2026-07-25)

Corte para reiniciar la máquina. Esto es lo que sobrevive solo, lo que está en riesgo y por dónde
se retoma.

### Lo que ya está aplicado en la base compartida (sobrevive al reinicio)

| Migración | Qué hizo | Cómo se revierte |
|---|---|---|
| `0023_2026_07_25` | Columnas nuevas en `posts`, `post_translations`, `sellers` | `alembic downgrade 0022_2026_07_23` |
| `0024_2026_07_25` | Funciones `search_posts_semantic` y `recommend_posts` | `alembic downgrade 0023_2026_07_25` |
| `0025_2026_07_25` | LEFT JOIN a `sellers` para recomendar sin vendedor | `alembic downgrade 0024_2026_07_25` |

Datos: los 9 productos migrados siguen en `posts` (13 con `kind='producto'` en total).
Se deshace con `pnpm run migrate:products -- --remove` desde el repo del sitio.
`products` sigue intacta y el repositorio viejo del bot sigue en el árbol.

### ⚠️ Sin commitear — lo que sí está en riesgo

**Backend del bot** (`bot-whatsapp/backend`, rama `main`): **31 archivos sin commitear**. Entre
ellos, y esto es lo delicado, **las migraciones 0020 a 0025 están aplicadas en la base pero
ninguna está versionada**: si se pierde el directorio, la base queda en un estado que ningún
repositorio sabe reproducir. Archivos de esta feature:

- `alembic/versions/0024_2026-07-25_add_search_posts_semantic.py`
- `alembic/versions/0025_2026-07-25_recommend_posts_without_seller.py`
- `app/infrastructure/db/repositories/post_product.py`
- `app/api/dependencies.py` (modificado: cableado al repositorio nuevo)
- `scripts/capture_search_golden.py`
- `tests/golden/search_golden.json`, `tests/test_search_golden.py`

El resto de los 31 son trabajo previo, ajeno a esta feature (modelos de dominio, repos, pruebas).

**Sitio** (`comida-justa`, rama `dev`): solo esta bitácora y los settings locales de Claude.
Los slices 1 y 2 ya están commiteados y mergeados.

### Acciones pendientes, en orden

1. **Commitear el backend.** Es lo primero al volver: hay migraciones aplicadas sin versionar.
2. **Slice 4 — embedding al publicar.** Cierra el criterio 2 del slice 3: hoy las 4
   publicaciones hechas desde el sitio no tienen embedding, así que el bot no las ve. Es la pieza
   que hace que la feature signifique algo.
3. **Probar el bot en vivo** (Telegram) para cerrar el criterio 3, que no se ejercitó contra un
   webhook real.
4. **Eliminar `products`**, solo después de lo anterior y con aprobación explícita.
5. Menores: instalar `ruff` en el venv del backend (los archivos nuevos no se lintearon); los
   `tags` con comillas dobles heredados de `products` ensuciarán el texto cuando el slice 4
   regenere embeddings.

### Cómo retomar

```
# 1. Verificar que la base sigue donde la dejamos
cd C:/Users/S2G52/Desktop/jaimito/HazloSano/bot-whatsapp/backend
./venv/Scripts/python -m alembic current        # debe decir 0025_2026_07_25
./venv/Scripts/python -m pytest tests/test_search_golden.py -q   # 2 passed

# 2. Sitio
cd C:/Users/S2G52/personal/DEV/salud-justa/comida-justa
pnpm run dev
```

El servidor de desarrollo que quedó corriendo en el puerto 3000 muere con el reinicio; no hay
que hacer nada con él.

---

## Slice 4 — Embedding al publicar desde el sitio (2026-07-25)

### Objetivo

Cerrar el círculo: que publicar en comida-justa baste para que el chatbot pueda recomendarlo.
Hasta ahora el bot ya leía de `posts` (slice 3), pero las publicaciones hechas desde el sitio
nacían sin vector y por eso eran invisibles para él. Este slice les da el vector.

### El hallazgo que definió el slice

El repositorio **ya tenía** un `VertexEmbeddingService` apuntando a
`text-multilingual-embedding-002` (Vertex AI). Reutilizarlo habría sido lo natural y habría sido
el peor error posible de esta feature: el catálogo del bot está indexado con
`gemini-embedding-001` a 768 dims, y **dos modelos distintos producen espacios vectoriales
distintos**. Los vectores habrían medido 768 igual, `search_posts_semantic` habría seguido
devolviendo resultados, y esos resultados habrían sido ruido. Un índice envenenado no lanza
excepciones: es la forma más cara de romperse porque nadie se entera.

De ahí sale casi todo lo demás del slice: un `GeminiEmbeddingService` nuevo que replica exacto
lo que hace `app/infrastructure/clients/embeddings.py`, y un script que **demuestra con números**
que ambos lados comparten espacio en vez de asumirlo.

### Decisiones y por qué

- **El texto que se vectoriza se replica campo por campo del backend Python.** `buildEmbeddingText`
  reproduce `_build_embedding_text`: mismas etiquetas en español, mismo orden, mismo separador. No
  es cosmético — el texto es la entrada del modelo. Por eso el repositorio traduce la clave guardada
  a su etiqueta (`alimentacion` → "Alimentación"): es lo que leyó el modelo cuando indexó el
  catálogo del bot.
- **REST en vez del SDK de Gemini.** Son ~20 líneas contra una dependencia más en el bundle del
  servidor. El contrato de `:embedContent` es estable y se probó contra la API real antes de
  escribir el cliente.
- **`after()` de Next, no una llamada en línea.** El redirect al detalle no espera a Gemini: la
  publicación se guarda, se responde, y el vector llega después. Esto es lo que hace literal el
  "fuera del camino crítico" del roadmap — publicar no puede ponerse lento ni fallar por un
  proveedor externo. Con timeout de 10 s por si el proveedor cuelga la conexión.
- **El caso de uso nunca lanza; devuelve un resultado con motivo.** Corre en dos contextos donde
  una excepción sería dañina (`after()` y el backfill en bucle). Un fallo solo significa "sigue
  pendiente", y la fila se reintenta en la siguiente corrida.
- **Se valida la dimensión antes de escribir.** La columna es `vector(768)`; un vector de otro
  tamaño reventaría el INSERT dentro de `after()`, donde el error no tiene a quién avisarle.
- **Se indexan también los `anuncios`.** `search_posts_semantic` filtra `kind = 'producto'`, así
  que no contaminan al bot, y el slice 5 (búsqueda semántica en el sitio) los necesita. Indexarlos
  cuesta centavos.
- **El backfill procesa en serie a propósito.** Son decenas de filas y el proveedor tiene límite
  por minuto: paralelizar cambiaría un backfill lento por uno que se rechaza a sí mismo.
- **Se reescribió `backfillEmbeddings.ts` en vez de crear otro script.** El que existía era código
  muerto de la era Firestore (`db.collection("posts")`, `FieldValue.vector`) y su comando apuntaba
  a `ts-node`, que ni siquiera está instalado. Dejarlo al lado del nuevo era dejar una trampa.

### El golden del bot: por qué cambió su aserción

Al indexar las 4 publicaciones del sitio, el test golden del backend falló — y falló **exactamente
como la feature pretende**: los 9 productos heredados seguían en el pool en el mismo orden, y
aparecían 4 candidatos nuevos detrás. Exigir igualdad exacta convertía el éxito de la feature en un
fallo de la prueba.

La aserción pasó a comparar el pool **filtrado a los ids del golden**: protege contra la regresión
real (que mover el catálogo altere el ranking heredado) sin prohibir lo que se persigue. Y como esa
relajación por sí sola dejaría pasar un borrado de los embeddings nuevos, se agregó una segunda
prueba que exige lo contrario: que algo publicado desde el sitio entre efectivamente al pool.

### Archivos tocados

**Dominio**
- `src/domain/entities/post/embedding.ts` (nuevo) + `embedding.test.ts`
- `src/domain/entities/post/indexingReport.ts` (nuevo) + `indexingReport.test.ts`
- `src/domain/errors/EmbeddingProviderError.ts` (nuevo)

**Casos de uso**
- `src/use_cases/indexPostEmbedding/indexPostEmbeddingUseCase.ts` (nuevo) + test
- `src/use_cases/indexPostEmbedding/backfillPostEmbeddingsUseCase.ts` (nuevo) + test
- `src/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository.ts` (nuevo)
- `src/use_cases/indexPostEmbedding/testDoubles.ts` (nuevo)

**Infra**
- `src/infra/services/GeminiEmbeddingService.ts` (nuevo) + test
- `src/infra/services/factory.ts` (nuevo)
- `src/infra/dataAccess/indexPostEmbedding/PostgresPostEmbeddingRepository.ts` (nuevo)
- `src/infra/dataAccess/indexPostEmbedding/factory.ts` (nuevo)
- `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts` + `IPostQueryRepository.ts`

**App**
- `src/app/[locale]/publicar/actions.ts` (indexado en `after()`)
- `src/app/[locale]/admin/productos/page.tsx`
- `src/app/[locale]/admin/productos/ui/IndexingStatusPanel.tsx` (nuevo) + test

**Scripts y config**
- `src/scripts/backfillEmbeddings.ts` (reescrito: Firestore → Postgres)
- `src/scripts/verifyEmbeddingSpace.ts` (nuevo)
- `package.json` (`backfill-embeddings` a `tsx`, `verify:embedding-space`)
- `.env.development` / `.env.production`: `GEMINI_API_KEY` (mismo valor que el bot)

**Pruebas**
- `src/e2e/unifiedCatalog/unifiedCatalog.feature` (slice 4 detallado, sin `@future`)
- `src/e2e/unifiedCatalog/unifiedCatalogIndexing.spec.ts` (nuevo)
- `src/e2e/testUtils/readEmbedding.ts` (nuevo)

**Backend Python**
- `tests/test_search_golden.py` (aserción del golden + prueba nueva)

### Comandos

```
pnpm run typecheck                        # limpio
pnpm run lint                             # limpio
pnpm run test:run                         # 29 archivos, 181 pruebas en verde
pnpm run verify:embedding-space           # 9/9 por encima del piso de 0.95
pnpm run backfill-embeddings -- --dry-run # 14 pendientes
pnpm run backfill-embeddings              # 14 indexadas, 0 fallidas
pnpm run test:e2e:run                     # 21 pasan, 3 skipped, 0 fallan
./venv/Scripts/python -m pytest -q        # backend: 74 pruebas en verde
```

### Validación (con números)

- **Vitest:** 181 pruebas en verde (29 archivos). Nuevas: 17 del texto del embedding, 6 del caso
  de uso de indexado, 4 del backfill, 7 del cliente de Gemini, 5 del reporte de indexación, 3 del
  panel admin — **42 nuevas**.
- **Mismo espacio vectorial (lo importante):** se regeneró desde el sitio el vector de las 9
  publicaciones que había indexado el bot y se comparó por coseno contra el original.
  **Similitud media 0.9953, peor caso 0.9804** (Jugo Verde), 9 de 9 por encima del piso de 0.95.
  Confirma mismo modelo y misma composición de texto.
- **Backfill:** 14 traducciones pendientes → **14 indexadas, 0 fallidas**. Estado final:
  13 de 13 productos y 10 de 10 anuncios con vector, **0 pendientes**. Todos a 768 dimensiones
  (`SELECT DISTINCT vector_dims(embedding)` → una sola fila: 768).
- **Criterio 2 del slice 3, cerrado:** las 4 publicaciones hechas desde el sitio
  (Crema de Cacahuate Natural y los 3 panes de masa madre) ahora son devueltas por
  `search_posts_semantic`. Antes de este slice ninguna lo era.
- **Backend (pytest):** 74 en verde (73 antes + 1 nueva). El golden confirma que los 9 productos
  heredados conservan orden en las 9 consultas.
- **Playwright:** 21 pasan, 3 skipped, 0 fallan. Los 3 escenarios nuevos del slice 4 en verde,
  incluido el que publica desde el navegador y espera a que el vector aparezca.
- **Nota sobre las corridas de Playwright:** la primera pasada tuvo 4 fallos (`about`,
  `createPost`, `loadMorePosts` ×2) y una quinta (`unifiedCatalog` slice 1) en una corrida previa.
  Todas fueron **timeouts de compilación en frío de Turbopack**, no regresiones: con el servidor
  ya caliente las mismas pruebas pasan sin tocar una línea. Verificado re-ejecutándolas.

### Escrito en recursos compartidos

- **14 `UPDATE` sobre `post_translations.embedding`**, de `NULL` a un vector. No se creó ni borró
  ninguna fila, no se tocó ninguna otra columna. Para deshacer:
  ```sql
  UPDATE post_translations SET embedding = NULL
  WHERE post_id NOT IN (SELECT id::text FROM products);
  ```
  (los 9 vectores que venían de `products` no los tocó el backfill).
- Las pruebas e2e crearon y borraron sus propias publicaciones; se verificó que **no quedó ningún
  residuo** (`slug ~ '-17[0-9]{11}$'` → 0 filas).
- **`products` sigue intacta con sus 9 filas**, como pediste. No se eliminó nada.
- **Ninguna migración de esquema.** El slice no necesitó Alembic: las columnas ya existían desde
  la `0023`.

### Desviaciones respecto al roadmap

- El roadmap decía "la web genera el embedding con Gemini". No decía **cuál** Gemini, y el repo ya
  tenía un servicio de embeddings de otro modelo: la parte cara del slice fue detectar que no
  servía y demostrar que el nuevo sí. De ahí sale `verifyEmbeddingSpace.ts`, no previsto.
- No se contemplaba tocar el backend. Hubo que ajustar el golden porque el slice 4 cambia
  legítimamente lo que devuelve la función SQL (ver arriba).
- Se indexan también los anuncios, no solo los productos. El roadmap hablaba de publicaciones en
  general; se deja explícito porque tiene consecuencia de costo (mínima) y habilita el slice 5.
- Queda pendiente el "o editar" del roadmap: hoy no existe edición de publicaciones en el sitio,
  así que no hay dónde enganchar la re-indexación. Cuando exista, es una línea más en su acción.

### Lo que NO quedó cubierto

- **El bot no se probó en vivo** contra un webhook real de Telegram/WhatsApp. Sigue siendo el
  criterio 3 del slice 3, pendiente desde entonces.
- **`GEMINI_API_KEY` no está en el entorno de Vercel**, solo en los `.env` locales. Sin ella, en
  producción las publicaciones se guardan bien pero quedan todas pendientes de indexar (que es
  justo el degradado que se diseñó, pero conviene no descubrirlo en producción).
- **Sin índice HNSW.** A 23 vectores el escaneo secuencial sobra; el roadmap ya lo anticipa.
- **Ruff sigue sin instalarse** en el venv del backend, así que el test modificado no se linteó.

### Recap

Publicar en el sitio ahora es suficiente para que el chatbot pueda recomendarlo: la publicación se
guarda, se responde al usuario, y el vector se genera después con el mismo modelo y el mismo texto
que usó el bot para indexar su catálogo — comprobado con una similitud coseno media de 0.9953
contra los vectores originales. Las 14 traducciones que estaban ciegas para el bot quedaron
indexadas, incluidas las 4 publicaciones del sitio que el slice 3 había dejado a medias, y el panel
admin ahora nombra ese hueco cuando existe. Si Gemini se cae, publicar sigue funcionando y la fila
queda pendiente hasta el siguiente backfill. `products` sigue en pie con sus 9 filas.

### Próximos pasos (opciones)

1. **Probar el bot en vivo** (Telegram) preguntándole por algo que solo exista como publicación del
   sitio — por ejemplo "quiero pan de masa madre". Es la única forma de cerrar el criterio 3 del
   slice 3 y la prueba de fuego de toda la feature. **Pendiente tuyo.**
2. **Cargar `GEMINI_API_KEY` en Vercel** antes del próximo despliegue, para que lo que se publique
   en producción nazca indexado. **Pendiente tuyo** (es un secreto, no lo toco).
3. **Slice 5 — búsqueda semántica en el sitio**: reemplazar el `ILIKE '%término%'` de
   `PostgresSearchPostRepository` por la misma función SQL. Todo lo que necesita ya existe: los 23
   vectores están puestos y el cliente de embeddings está escrito y probado.
4. **Eliminar `products`** cuando quieras — dijiste que prefieres esperar y hacerlo a mano. Nada en
   el sitio ni en el bot la lee ya; solo la usan `verifyEmbeddingSpace.ts` y el golden para
   identificar qué es "heredado". Avísame y ajusto esos dos antes de que la borres.
5. Menores: instalar `ruff` en el venv del backend; enganchar la re-indexación cuando exista
   edición de publicaciones.
