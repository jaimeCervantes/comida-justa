# Bitácora — Taxonomía centralizada

Append-only. Roadmap en `docs/features/taxonomia-centralizada.md`.

---

## Slice 1 — La taxonomía vive en la base *(2026-07-28)*

### Objetivo

Mover la taxonomía de categorías a la base compartida, sin que ningún consumidor cambie todavía de
comportamiento. Al terminar el slice, la base es la fuente de verdad y el sitio sabe leerla, pero
`category.ts`, `postCategoryLabels.ts` y `CategoryTag` siguen intactos gobernando la UI.

### Verificación previa (lo que cambió el plan)

Antes de escribir nada se consultó la base en modo lectura, y **dos premisas resultaron falsas**:

| Se asumía | Realidad |
|---|---|
| 4 productos con claves sueltas `pan` y `cremas` | **0.** `posts` está limpio |
| Variantes con acento (`alimentación`, `"alimentación  "`) | **0** |
| 13 productos / 23 embeddings | **14 productos / 24 traducciones**, todas `es`, todas con vector |

Los commits `211f889` (untables) y `5a1f24c` (comidas→platillos) ya habían corregido esos datos. La
consecuencia es grande: **la migración no tiene que modificar ni una fila**, solo agregar
constraints, y el paso de limpieza se reduce a una red idempotente que hoy es no-op.

Segunda consecuencia: **reindexar embeddings hoy no cambia ningún vector**. El hardcode `"es"` de
`PostgresPostEmbeddingRepository.ts:52-57` es un bug real, pero como las 24 traducciones son `es`,
el texto generado es idéntico antes y después de arreglarlo. Muerde el día que exista la primera
traducción `en`, no antes — lo que de-riesga el slice 2.

### Decisiones y por qué

- **`categories`, no `catalog_categories`.** Se empezó con el prefijo `catalog_` y se renombró a
  media implementación. El esquema existente nombra con sustantivos simples y reserva el prefijo
  para pertenencia, así que la simetría queda exacta: `posts` → `post_translations`, `categories` →
  `category_translations`.
- **Se descartó `taxonomies` + `terms`** (el modelo de WordPress). Una *taxonomía* es el sistema de
  clasificación completo; aquí cada fila **es una categoría**. Permitiría meter `sellers.category` al
  mismo sistema, pero cuesta un JOIN extra en los tres repos por un beneficio que hoy no existe.
  Generalizar después es aditivo: tabla `taxonomies` + `categories.taxonomy_key` con default.
- **El FK sobre `sub_category` es compuesto** `(sub_category, category) → (key, parent_key)`. No
  basta con que la sub-categoría exista: tiene que colgar de esa categoría. Es lo único que hace
  valer una jerarquía que hasta hoy no estaba modelada en ningún lado.
- **La profundidad la impone un trigger, no un CHECK.** Un CHECK no puede consultar otra fila. Sin
  el trigger se podría insertar un tercer nivel y los tres consumidores tendrían que manejar una
  profundidad que nadie diseñó.
- **El gate de verificación aborta en vez de poner `NULL`.** Poner `NULL` sacaría un producto real
  del filtro y del texto del embedding sin dejar rastro: exactamente el modo de fallo mudo que esta
  feature existe para eliminar. Aborta listando las claves ofensivas.
- **`category_normalize` usa `translate`, no `unaccent`.** `unaccent()` es `STABLE` (depende del
  diccionario) y no puede usarse en columnas generadas ni en índices; `translate`/`lower`/`btrim`
  son `IMMUTABLE`. Es la misma función que replica `normalizeCategoryKey` en TypeScript.
- **`unstable_cache`, no `"use cache"`.** `"use cache"` exige activar `cacheComponents`, que cambia
  la semántica de renderizado de toda la app (todo acceso dinámico dentro de un `Suspense`). Eso es
  una migración aparte, no un efecto colateral de mover categorías a la base.
- **Se cachea la instantánea, no la taxonomía indexada.** El caché de datos de Next guarda **JSON**:
  un `Map` no sobrevive el viaje. El dominio separa `CategoryTaxonomySnapshot` (serializable) de
  `CategoryTaxonomy` (con índices), y `createCategoryTaxonomy` construye la segunda desde la primera.
- **El fallback no incluye alias.** Solo sirven a la búsqueda por texto, que vive en SQL y que sin
  base tampoco funcionaría. Lo que sí tiene que seguir funcionando sin base es pintar etiquetas,
  llenar el selector y validar al publicar, y para eso bastan claves y traducciones.
- **Sin clase de caso de uso para el catálogo.** `getCategoryTaxonomy` no orquesta nada: es una
  lectura cacheada. Se dejó el puerto en `src/use_cases/catalog/ports/` y la composición en el
  factory, sin una capa intermedia vacía.

### Archivos tocados

**Backend Python (`bot-whatsapp/backend`)**
- `alembic/versions/0026_2026-07-28_centralize_catalog_taxonomy.py` *(nuevo)* — 3 tablas, 1 vista,
  4 funciones, 1 trigger, el seed y los constraints sobre `posts`.

**Dominio (puro)**
- `src/domain/entities/post/taxonomy.ts` *(nuevo)*
- `src/domain/entities/post/taxonomyFallback.ts` *(nuevo)*
- `src/domain/entities/post/taxonomy.test.ts` *(nuevo)*
- `src/domain/entities/post/__fixtures__/categoryTaxonomy.ts` *(nuevo)*

**Puerto**
- `src/use_cases/catalog/ports/ICategoryTaxonomyRepository.ts` *(nuevo)*

**Infraestructura**
- `src/infra/dataAccess/db/schema/categories.ts` *(nuevo)* — espejo Drizzle + vista `.existing()`
- `src/infra/dataAccess/categories/PostgresCategoryTaxonomyRepository.ts` *(nuevo)*
- `src/infra/dataAccess/categories/PostgresCategoryTaxonomyRepository.test.ts` *(nuevo)*
- `src/infra/dataAccess/categories/factory.ts` *(nuevo)*
- `src/infra/dataAccess/categories/cachedCategoryTaxonomy.ts` *(nuevo)*

**Documentación y especificación**
- `docs/features/taxonomia-centralizada.md` *(nuevo)*
- `docs/features/taxonomia-centralizada-bitacora.md` *(nuevo)*
- `src/e2e/catalogTaxonomy/catalogTaxonomy.feature` *(nuevo)*

Nada existente fue modificado.

### Comandos clave

```bash
# Generar el SQL de la migración (fidelidad garantizada con el .py)
PYTHONIOENCODING=utf-8 alembic upgrade 0025_2026_07_25:0026_2026_07_28 --sql
PYTHONIOENCODING=utf-8 alembic downgrade 0026_2026_07_28:0025_2026_07_25 --sql

pnpm run test:run && pnpm run typecheck && pnpm run lint && pnpm run build
```

> **`PYTHONIOENCODING=utf-8` no es opcional en Windows.** Sin él, redirigir la salida de Alembic usa
> la codificación de consola y `Panadería` llega a la base como `Panader?a`. Se detectó porque el
> ensayo falló exactamente en los casos con acento y pasó en todos los ASCII. La ruta real
> (`alembic upgrade head` directo contra la base) no pasa por un archivo y no está afectada.

### Validación

**Ensayo de la migración contra la BD compartida, dentro de una transacción con `ROLLBACK`**
(PostgreSQL tiene DDL transaccional; nada persistió). Valida lo que un Postgres vacío no podría: que
los constraints entren contra los 14 productos reales. **34/34 verde.**

| Grupo | Resultado |
|---|---|
| Seed y estructura | 7 categorías, 14 traducciones, 22 alias, vista con 14 filas, `label_normalized` sin acento |
| Datos intactos | huella `md5` de `posts` idéntica antes y después: `51ba0a048975…` (24 filas) |
| Invariantes de la base | rechaza sub-categoría colgada de sub-categoría, level 2 sin padre, level 1 con padre, clave con mayúsculas, y borrar una categoría con hijas |
| FK compuesto | acepta `alimentacion/jugos`; rechaza sub-categoría inexistente, `jugos/platillos` y sub-categoría huérfana |
| Renombre | `jugos → zumos` propaga por cascada a `posts`, traducciones y los 3 alias, en un solo `UPDATE` |
| `category_keys_matching` | encuentra `panaderia` desde `panadería`, `Panaderia`, `bakery`, `pan`, `bread`; `zumo → jugos`; `Alimentación → alimentacion`; `ferreteria → 0` |
| `category_subtree_keys` | `alimentacion → 7`, `jugos → 1`, inexistente → `0` |
| Gate | aborta listando `category='ferreteria'` |
| Downgrade | tablas, funciones y constraints desaparecen; `posts` con la misma huella |

**Suite del repo:** `237 tests` en `31 archivos`, todos verdes (46 nuevos del dominio, 6 del
repositorio). `typecheck` y `lint` sin salida. `build` completo, 28 rutas.

**Degradación probada end-to-end, no solo mockeada:** con la migración sin aplicar y conexión buena,
la consulta falla con `relation "category_labels" does not exist` (SQLSTATE `42P01`), el repositorio
la captura, avisa por consola y devuelve las 7 claves con `panaderia/en → "Bakery"` y el orden
canónico `Jugos, Platillos, Bebidas, Panadería, Abarrotes, Untables`.

### Escrito en recursos compartidos

**Nada.** El único acceso de escritura a la base compartida fue el ensayo de la migración, envuelto
en `BEGIN … ROLLBACK`. Se verificó explícitamente que la huella `md5` de `posts` es idéntica antes y
después. La migración **no se ha aplicado**: `alembic head` sigue en `0025_2026_07_25`.

### Desviaciones respecto al roadmap

- Los nombres de tabla se renombraron a media implementación (`catalog_categories` → `categories`),
  a petición del usuario. El ensayo se volvió a correr completo tras el renombre.
- No se creó clase de caso de uso para el catálogo (ver decisiones).
- No se escribió spec de Playwright: los escenarios `@slice-1` son de base de datos y de dominio
  puro, no de navegador. Los cubren el ensayo de la migración y Vitest, y el `.feature` lo dice en
  el comentario de cabecera.

### Pendientes

- **Aplicar la migración** (`alembic upgrade head`). Es acción irreversible sobre la BD compartida
  según `AGENTS.md:40` y queda a la espera de aprobación explícita.
- `src/scripts/migrateProductsToPosts.ts` quedará desactualizado en el slice 2 (ver "Deuda conocida"
  en el roadmap).

### Recap

El esquema de la taxonomía está escrito y probado de punta a punta contra los datos reales, pero
todavía no aplicado: la base sigue en `0025` y `posts` intacto. Del lado del sitio existe ya la capa
completa de lectura —dominio puro, puerto, repositorio Drizzle sobre la vista, caché con
`unstable_cache` + `React.cache` y degradación a una instantánea de respaldo— con 52 pruebas
propias, y está verificado que el sitio compila y arranca **sin** las tablas. Ningún consumidor
cambió: `category.ts`, `postCategoryLabels.ts` y `CategoryTag` siguen gobernando la UI exactamente
igual que ayer, así que este slice es desplegable sin efecto visible.

### Próximos pasos (opciones)

1. **Aplicar `0026` a la BD compartida** (pendiente de tu visto bueno). Después conviene una ventana
   corta para correr los tres sets de tests contra la base ya migrada — la migración es compatible
   hacia atrás con los tres repos sin desplegar ninguno.
2. **Arrancar el slice 2** (el sitio consume la tabla): mapper con `locale`, `CategoryTag` tonto,
   selectores encadenados en `/publicar`, embedding por locale, y retiro de `category.ts` y
   `postCategoryLabels.ts`. Arregla de paso el bug de que las tarjetas salen en español en `/en`.
3. **Saltar al slice 3** (búsqueda) si interesa más el resultado visible: `?q=panadería` pasa de 0 a
   3 resultados. Requiere la migración aplicada, porque llama a las funciones SQL.

**Pendiente de tu lado:** aprobar `alembic upgrade head`, y decidir entre las opciones 2 y 3.

---

## Adenda al slice 1 — la migración aplicada, y el bug que el ensayo no vio *(2026-07-28)*

### Qué pasó

El primer `alembic upgrade head` falló:

```
asyncpg.exceptions.PostgresSyntaxError:
cannot insert multiple commands into a prepared statement
[SQL: UPDATE posts SET category = category_normalize(category) ...;
      UPDATE posts SET sub_category = category_normalize(sub_category) ...;]
```

`NORMALIZE_POSTS` metía **dos `UPDATE` en un solo `op.execute()`**.

### Por qué el ensayo no lo detectó (la lección)

El ensayo previo corrió el SQL generado a través de **node-postgres**, que usa el *protocolo de
consulta simple* y acepta varios comandos en una misma sentencia. La ruta real usa **asyncpg**, que
ejecuta por *prepared statement* y los rechaza.

Es decir: se validó el SQL, **no la ruta del driver**. Un ensayo que no atraviesa el mismo cliente
que la ejecución real puede dar verde sobre algo que no funciona. Para una migración, el ensayo
tiene que correr por el driver de producción, o directamente ser la migración.

### Contención

Ninguna. Alembic usa DDL transaccional y revirtió todo: al inspeccionar quedaba `alembic_version =
0025_2026_07_25`, cero tablas `categor*`, cero funciones, cero constraints nuevos, y `posts` con la
misma huella `51ba0a0489755edff178a4692a5092af`. **No hubo estado a medias que limpiar.** El diseño
transaccional hizo su trabajo.

### Arreglo

- `NORMALIZE_POSTS` se partió en `NORMALIZE_POSTS_CATEGORY` y `NORMALIZE_POSTS_SUB_CATEGORY`, con un
  `op.execute()` cada uno y un comentario que explica la restricción del driver.
- Se auditaron **las 16 ejecuciones** de la migración con un script que separa comandos de nivel
  superior ignorando los cuerpos `$$…$$`: **0 problemas** restantes. Solo la que falló tenía el
  defecto; ninguna otra constante ni ningún `DROP` inline lleva más de un comando.

### Migración aplicada — verificación posterior

`alembic upgrade head` con `.venv` (asyncpg), correcto a la primera tras el arreglo.

| Comprobación | Resultado |
|---|---|
| `alembic_version` | `0026_2026_07_28` |
| Seed | 7 categorías, 14 traducciones, 22 alias, vista con 14 filas |
| Constraints en `posts` | `fk_posts_category`, `fk_posts_sub_category_under_category`, `ck_posts_sub_requires_category` |
| **Datos** | huella `md5` de `posts` **idéntica**: `51ba0a0489755edff178a4692a5092af`, 24 filas — ni una fila modificada, como estaba previsto |
| `category_keys_matching('panadería')` | `{panaderia}` — el acento ya no impide encontrarla |
| `category_subtree_keys('alimentacion')` | 7 |
| Etiquetas `en` nivel 2 | `Juices, Dishes, Drinks, Bakery, Groceries, Spreads`, en orden canónico |

**Lectura desde el sitio, en vivo** (ya no por el fallback): el repositorio Drizzle devuelve 7 nodos
y 22 alias; `panaderia` → `Bakery`/`Panadería`; resolución permisiva `"PAN"` → `panaderia` y
`"Panadería"` → `panaderia` usando los alias reales de la tabla. Esto valida además el espejo
Drizzle de la vista (nombres y tipos de columna).

**Seeds de e2e:** revisados contra el FK ya activo. Todos emparejan `category: "alimentacion"` con
una sub-categoría hija válida (`jugos`, `bebidas`); no hay ninguno huérfano que
`ck_posts_sub_requires_category` fuera a rechazar.

### Escrito en recursos compartidos

**Sí, esta vez.** La migración `0026` está aplicada sobre la base compartida. Revertir:

```bash
cd bot-whatsapp/backend && alembic downgrade -1
```

El downgrade elimina las tres tablas, la vista, las cuatro funciones, el trigger y los constraints, y
deja `posts` intacto: sus claves de categoría nunca se tocaron. Los tres repos vuelven solos a su
instantánea de respaldo.

### E2E (Playwright) — y dos trampas de entorno

**Resultado: 20 de 22 verdes.** Todos los escenarios que ejercen publicar con los constraints
activos —`unifiedCatalog`, `unifiedCatalogIndexing`, `publishProduct`, `products`, `productsReport`,
`notFound`— pasan. **La migración no rompió el camino de escritura.**

Dos trampas costaron tres corridas antes de llegar a una medición válida:

1. **Playwright estaba probando otro proyecto.** `playwright.config.ts:80` usa
   `reuseExistingServer: !process.env.CI`, y otro dev server ocupaba `:3000`. La suite corrió 11.9
   minutos contra una app de "EV Sync RFID tags" y reportó 15 fallos. Se detectó por el
   `Page snapshot` del error, que mostraba contenido de otro producto. Se rehízo con una config
   temporal en el puerto 3100 y `reuseExistingServer: false`.
   → **Conviene parametrizar el puerto en `playwright.config.ts`**; hoy un dev server ajeno invalida
   la suite en silencio.
2. **`.next` contaminado por `pnpm run build`.** Correr el build de producción y después levantar
   `next dev` sobre el mismo `.next` produjo `TypeError: components.ComponentMod.handler is not a
   function` en `/api/posts/page/2/pageSize/8`, tumbando los dos escenarios de `loadMorePosts`. Con
   `rm -rf .next` ambos pasan. No es un fallo del código: es residuo de la propia validación.

**Los 2 fallos restantes son preexistentes y ajenos a esta feature.** El código de la app está
**idéntico a `HEAD`** (cero archivos rastreados modificados) y **nadie importa los módulos nuevos**
(cero consumidores), así que no pueden venir del slice:

| Escenario | Síntoma | Por qué no es de aquí |
|---|---|---|
| `about.spec.ts:7` — el menú lleva a la página de marca | tras el clic la URL es `/en`, no `/nosotros` | El propio test lo documenta: *"No seeding: the page is static content, nothing is written to the database."* Huele a detección de locale: Chromium manda `Accept-Language: en-US` y `/` redirige a `/en` |
| `createPost.spec.ts:30` — se ofrece Google como proveedor | no aparece el botón `/google/i` en la página de signin | Flujo de autenticación, sin relación con categorías |

`loadMorePosts.spec.ts:24` falló una vez y pasó al reintentar: es flaky, independiente de lo anterior.

### Recap

La taxonomía ya vive en la base compartida y el sitio la lee en vivo. La migración se aplicó sin
modificar un solo producto —huella `md5` idéntica antes y después— y quedó verificada tanto por SQL
como por la ruta TypeScript real. El bug de multi-sentencia costó un intento fallido y cero daño,
porque el DDL transaccional revirtió todo; el arreglo está acompañado de una auditoría de las 16
ejecuciones. Ningún consumidor cambió todavía: la UI se comporta exactamente igual que ayer.

### Próximos pasos (opciones)

1. **Slice 2** — el sitio consume la tabla: mapper con `locale`, `CategoryTag` tonto, selectores
   encadenados en `/publicar`, embedding por locale, y retiro de `category.ts` y
   `postCategoryLabels.ts`. Arregla el bug de que las tarjetas salen en español bajo `/en`.
2. **Slice 3** — búsqueda: `?q=panadería` pasa de 0 a 3 resultados en el miniapp y en el bot. Ya es
   ejecutable, porque las funciones SQL existen.
3. **Correr los tests de los otros dos repos** contra la base ya migrada, para confirmar que la
   migración es compatible hacia atrás sin desplegar nada (era la premisa del orden de despliegue).
4. **Higiene de e2e** (fuera de esta feature, detectado al validar): parametrizar el puerto en
   `playwright.config.ts` para que un dev server ajeno no invalide la suite en silencio, y revisar
   los 2 escenarios preexistentes en rojo (`about.spec.ts:7`, `createPost.spec.ts:30`).

**Pendiente de tu lado:** elegir entre 1, 2, 3 y 4.

---

## Slice 2 — La etiqueta se resuelve en el servidor *(2026-07-29)*

### Objetivo

Que el sitio **consuma** la tabla en vez de sus propias constantes, y que la etiqueta se resuelva en
el idioma del visitante. Al terminar, `category.ts` y `postCategoryLabels.ts` dejan de existir.

### El bug que motivaba el slice

`mapPostsToCards` nunca recibía `locale`, así que `CardForList` lo obtenía `undefined`,
`normalizeLocale` caía a `"es"` y **las tarjetas salían en español también bajo `/en`** — mientras
`PostDetail`, que sí recibía el idioma de la ruta, mostraba la etiqueta traducida. La misma
publicación se contradecía entre el listado y su detalle.

### Decisiones y por qué

- **La etiqueta se resuelve en el servidor y viaja como dato.** `CardForList` se renderiza también
  dentro de un árbol cliente (`PostsWithLoadMore` es `"use client"` y pide páginas por `fetch`),
  donde la base es inalcanzable. Por eso el mapper emite `categoryLabel` ya resuelto y `CategoryTag`
  pasó a recibir solo `label`: se volvió tonto de verdad.
- **Dos mapper, no uno.** `mapPostsToCards` sigue **puro** —recibe `{ locale, taxonomy }}`— para poder
  probarlo sin base; `mapPostsToCardsForLocale` es la envoltura que busca la taxonomía y es la que
  usan las páginas y el route handler. Meter `getCategoryTaxonomy()` dentro del mapper habría vuelto
  su test dependiente del caché de Next.
- **Las claves crudas se conservan en la tarjeta** (`category`, `subCategory`) aunque ya no se usen
  para pintar: sirven para filtros y analítica, y quitarlas sería una pérdida silenciosa.
- **Los selectores de `/publicar` se encadenan, y sin categoría no se ofrece sub-categoría.** No es
  cosmético: el FK compuesto de `posts` rechaza una sub-categoría que no cuelgue de la categoría
  elegida, y `ck_posts_sub_requires_category` rechaza la huérfana. Sin encadenar, el formulario
  podía ofrecer una combinación que la base convierte en un 500. `actions.ts` además descarta la
  combinación inválida en servidor, por si el POST no viene del formulario.
- **El embedding resuelve la etiqueta en el propio SQL**, con `LEFT JOIN category_translations` por
  `t.locale` y `COALESCE` a tres niveles (locale → es → clave cruda). Se prefirió SQL sobre la
  taxonomía cacheada porque este camino corre también desde scripts, donde no hay request scope de
  Next, y así se evita una segunda ida a la base.
- **`legacyLabelToKey` NO se movió a `taxonomy.ts`** — desviación respecto al plan. Al implementarlo
  se vio que **no** hacen lo mismo: `legacyLabelToKey` elimina espacios y signos interiores
  (`"Sub-categoría"` → `subcategoria`), mientras `normalizeCategoryKey` los conserva para coincidir
  exactamente con la función SQL `category_normalize`. Fundirlas habría roto la simetría entre el
  TypeScript y la base, que es justamente lo que la feature vino a garantizar. Se quedó en
  `legacyCatalog.ts` con un comentario que explica la diferencia.
- **`legacyCategory`/`legacySubCategory` conservan su firma y lanzan.** `migrateProductsToPosts.ts`
  **no se tocó** (la tabla `products` está fuera de alcance) pero entra al typecheck, así que las
  firmas tenían que sobrevivir. Lanzan con un mensaje que nombra el reemplazo; devolver `null`
  habría migrado los productos sin categoría y en silencio.

### Archivos tocados

**Presentación**
- `src/infra/UI/mappers/posts/mapPostsToCards.ts` — recibe contexto, emite `categoryLabel`
- `src/infra/UI/mappers/posts/mapPostsToCardsForLocale.ts` *(nuevo)* — envoltura con la taxonomía
- `src/infra/UI/components/CategoryTag/CategoryTag.tsx` — props reducidas a `{ label }`
- `src/infra/UI/components/CardForList/CardForList.tsx` — pasa `categoryLabel`

**Propagación del locale** (8 llamadores + endpoint + cliente)
- `src/app/[locale]/page.tsx`, `page/[page]/page.tsx`, `productos/{data.ts,page.tsx,page/[page]/page.tsx}`,
  `buscar/**`, `search/**`
- `src/app/api/posts/[...pagination]/route.ts` — acepta `?locale=`, validado contra `routing.locales`
- `src/app/(home)/PostsWithLoadMore.tsx` — lo manda en el `fetch`
- `src/app/[locale]/[slug]/ui/PostDetail.tsx` — pasa a `async` y resuelve la etiqueta

**Publicación**
- `src/app/[locale]/publicar/page.tsx` — calcula opciones por categoría desde la tabla
- `src/app/[locale]/publicar/PublishForm.tsx` — recibe opciones, encadena los selectores
- `src/app/[locale]/publicar/actions.ts` — `resolveKeyStrict` + descarte de combinación inválida

**Embedding**
- `src/infra/dataAccess/indexPostEmbedding/PostgresPostEmbeddingRepository.ts`

**Retirados**
- `src/domain/entities/post/category.ts` y su test *(eliminados)*
- `src/infra/UI/labels/postCategoryLabels.ts` y su test *(eliminados)*
- `src/domain/entities/post/{types.ts,legacyCatalog.ts}` y `src/e2e/testUtils/seedPost.ts` — la clave
  pasa a ser `string` validado contra la base, no un union type

**Especificación**
- `src/e2e/catalogTaxonomy/catalogTaxonomy.feature` — el slice 2 pasa de `@future` a implementado
- `src/e2e/unifiedCatalog/unifiedCatalog.feature` — el `Background` describe la tabla, no la allowlist

**Tooling** — `package.json` + `pnpm-lock.yaml`: se declaró `tsx` (ver "Hallazgos de entorno")

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run test:run` | **218 tests / 29 archivos, verde** (`EXIT=0`) |
| `pnpm run typecheck` | limpio |
| `pnpm exec eslint <los 25 archivos del slice>` | limpio (`EXIT=0`) |
| `pnpm run build` | **`BUILD_EXIT=0`** con `.next` borrado antes |
| `pnpm run verify:embedding-space` | **media 0.9940, peor caso 0.9804** — el espacio vectorial no se movió |
| `pnpm run test:e2e:run` | **NO ejecutada** (decisión del usuario; ver abajo) |

Los tests bajaron de 237 a 218 porque se eliminaron los dos archivos de las constantes retiradas; los
casos que seguían aplicando se reescribieron sobre el dominio nuevo.

**Verificación por HTTP en lugar de Playwright.** Al no correr e2e, el arreglo se comprobó levantando
`next dev` en el puerto 3100 y leyendo el HTML y el JSON reales contra la base:

```
ES  /productos      -> Bebidas, Jugos, Platillos
EN  /en/productos   -> Dishes, Drinks, Juices
ES  /               -> Bebidas, Jugos, Platillos, Untables
EN  /en             -> Dishes, Drinks, Juices, Spreads

/api/posts/page/1/pageSize/8?locale=es -> Bebidas, Jugos, Platillos, Untables
                              ?locale=en -> Dishes, Drinks, Juices, Spreads
                              ?locale=fr -> Bebidas, Jugos, Platillos, Untables   (cae a es)

detalle "…crema de almendras…"  ES -> Untables    EN -> Spreads
```

**El SQL del embedding se ejercitó contra la base** (ni typecheck ni Vitest lo cubren): el
repositorio devolvió `Alimentación`/`Untables` y compuso el texto completo, y el `COALESCE` elige
`en → Spreads`, `es → Untables`, `fr → Untables`, con una clave fuera del catálogo (`postres`)
cayendo a la clave cruda. **Ahí está el bug arreglado**: antes la fila `en` habría vectorizado
"Untables".

### Escrito en recursos compartidos

**Nada.** Todas las consultas de esta validación fueron `SELECT`. No se publicó ni se indexó nada.

### Hallazgos de entorno (ajenos al slice)

Tras reinstalar `node_modules` y regenerar `pnpm-lock.yaml` (2247 inserciones / 2038 borrados; las
versiones mayores no se movieron, pero sí hubo bumps dentro de los rangos semver):

1. **`tsx` no estaba declarado en `package.json`.** Funcionaba porque quedaba elevado como
   dependencia transitiva; con el lockfile nuevo dejó de exponerse en `node_modules/.bin` y **cuatro
   scripts del repo quedaron rotos**: `backfill-embeddings`, `seed:products`, `migrate:products` y
   `verify:embedding-space`. Se declaró con `pnpm add -Dw tsx` — es el arreglo correcto de una
   dependencia sin declarar, no un añadido nuevo. (Nota: la raíz es workspace root, así que `pnpm add`
   exige `-w`.)
2. **`pnpm run lint` falla con 1 error, en código intacto.**
   `src/infra/UI/components/SearchBar.tsx:27` — `react-hooks/set-state-in-effect`. Lo introdujo el
   bump de `eslint-plugin-react-hooks` **7.0.1 → 7.1.1**, que endureció esa regla; en el slice 1 lint
   estaba limpio. **No se corrigió**: el archivo no es de esta feature y arreglarlo implica cambiar
   el comportamiento del desplegable de búsqueda. Queda como decisión aparte.
3. **Aviso de peer dependency:** `@eslint/js@10.0.1` pide `eslint@^10`, y hay `9.39.5`. Sin efecto
   observado, pero es otro artefacto del lockfile regenerado.
4. **El puerto 3000 ya está libre**, y `next dev` arranca en ~1.7 s en un puerto limpio. El problema
   de "no carga en localhost:3000" no viene del código: el build pasa y la app responde
   correctamente en 3100. La causa más probable sigue siendo el proceso ajeno que ocupaba 3000
   (el mismo que invalidó la suite e2e del slice 1).

### Desviaciones respecto al roadmap

- `legacyLabelToKey` se quedó en `legacyCatalog.ts` en vez de mudarse a `taxonomy.ts` (ver
  decisiones): no son la misma función.
- Se añadió `mapPostsToCardsForLocale`, que el roadmap no preveía, para no acoplar el mapper puro al
  caché de Next.
- No se corrió Playwright, por decisión explícita del usuario; se sustituyó por verificación HTTP
  contra la base real, que cubre los escenarios `@slice-2` de tarjeta, endpoint y detalle. Quedan
  **sin verificar por prueba automatizada** los dos escenarios de `/publicar` (selectores encadenados
  y "sin categoría no hay sub-categoría"): están cubiertos por typecheck y por el razonamiento del
  FK, no por una ejecución.

### Recap

El sitio ya consume la tabla: la etiqueta se resuelve en el servidor, en el idioma de la ruta, y
viaja como dato hasta el árbol cliente. Con eso desaparecieron `category.ts` y
`postCategoryLabels.ts` —las dos copias que este repo mantenía a mano— y el bug de `/en` quedó
cerrado, verificado leyendo el HTML y el JSON reales: `Bakery` donde antes decía `Panadería`. El
formulario de publicar encadena sus selectores contra la jerarquía real, de modo que no puede
ofrecer una combinación que el FK compuesto rechazaría, y el texto del embedding habla el idioma de
su propia traducción sin haber movido un solo vector (media 0.9940). La deuda pendiente es
consciente y está anotada: `migrateProductsToPosts.ts` lanza si se ejecuta, y `pnpm run lint` sigue
rojo por un archivo ajeno que un bump de plugin empezó a marcar.

### Próximos pasos (opciones)

1. **Slice 3** — búsqueda y jerarquía en los otros dos repos: `?q=panadería` pasa de 0 a 3
   resultados, `?category=alimentacion` empieza a traer el subárbol, y el prompt del bot deja de
   decir `CATEGORY: ALIMENTACION`. Las funciones SQL ya existen, así que es ejecutable hoy.
2. **Cerrar la validación de este slice**: correr Playwright cuando el puerto 3000 esté sano (o
   parametrizarlo), para cubrir los dos escenarios de `/publicar` que hoy no tienen ejecución.
3. **Arreglar `SearchBar.tsx`** para devolver `pnpm run lint` a verde — decisión aparte, porque toca
   el comportamiento del desplegable de búsqueda.
4. **Correr los tests de los otros dos repos** contra la base migrada, para confirmar la
   compatibilidad hacia atrás.

**Pendiente de tu lado:** elegir entre 1, 2, 3 y 4, y decidir si `tsx` se queda declarado (lo dejé
así porque sin él cuatro scripts del repo no corren).

---

## SearchBar y la suite e2e — dos deudas que bloqueaban la validación *(2026-07-30)*

Fuera del alcance de la taxonomía, pero pedidas antes de seguir con el slice 3.

### `SearchBar.tsx` — lint en verde y, de paso, con pruebas

El bump de `eslint-plugin-react-hooks` a 7.1.1 empezó a marcar `react-hooks/set-state-in-effect` en
un archivo intacto. La causa de fondo era real: `showDropdown` y `loading` **se derivan** de la
consulta y del resultado, y calcularlos con `setState` dentro de un efecto provocaba renders en
cascada.

- El resultado pasa a guardarse junto con la consulta que lo produjo (`{ forQuery, items }`), así que
  "hay una petición en vuelo" se deduce comparando, sin bandera `loading`. `items: null` marca el
  fallo, que sigue escondiendo el desplegable como antes.
- El descarte (clic afuera, "ver todos") guarda **la consulta descartada**, no un booleano, de modo
  que caduca solo al seguir escribiendo — sin un efecto que lo reinicie.
- El efecto queda únicamente para el `fetch`, donde el `setState` va en la continuación asíncrona.

**No tenía ninguna prueba**, así que el refactor iba a ciegas. Se añadieron **14 casos** que fijan el
comportamiento: el mínimo de 3 caracteres, el espacio que cierra palabra y busca sin debounce, el
esqueleto mientras carga, "Sin resultados", el fallo que esconde el desplegable, el descarte y su
caducidad, y las dos navegaciones. Se comprobó que **no son vacuos** con dos mutaciones (quitar el
`&& !failed` y bajar el mínimo a 1 carácter): ambas ponen la suite en rojo.

### La suite e2e, de 5 verdes a 21

Tres causas encadenadas, ninguna del código de producción:

1. **Playwright adoptaba un servidor ajeno.** `reuseExistingServer: !CI` hacía que, si otro proyecto
   ya servía en el puerto, la suite corriera entera contra esa aplicación — 15 escenarios en rojo sin
   ninguna pista, porque el fallo se ve como "no encuentro el elemento". Ahora el puerto se
   parametriza con `E2E_PORT` (por defecto 3000) y `reuseExistingServer` está en `false`: la suite
   arranca siempre su propio servidor. `NEXT_PUBLIC_BASE_URL` se pasa por `env` para que siga al
   puerto, porque las páginas de búsqueda lo usan para llamarse a sí mismas desde el servidor.
2. **`.next` contaminado.** Correr `pnpm run build` y después `next dev` sobre el mismo directorio
   produce `TypeError: components.ComponentMod.handler is not a function`. Costó los dos escenarios
   de `loadMorePosts`.
3. **La suite corría en inglés.** Chromium pide `Accept-Language: en-US`, y con
   `localePrefix: 'as-needed'` el proxy redirige `/` → `/en` y `/nosotros` → `/en/nosotros`. Los
   escenarios afirman textos en español ("Nosotros", "Publicar"), así que fallaban por un idioma que
   nadie eligió. Se fija `locale: "es-MX"` en la config. **Esta era la causa de los 2 fallos que se
   venían arrastrando como "preexistentes"** desde el slice 1: `about.spec.ts:7` y
   `createPost.spec.ts:30`, ambos del mismo origen.

**Resultado: `E2E_EXIT=0` — 21 pasan, 3 saltados, 0 fallan.** Unitarias: 232 en 30 archivos.

---

## Slice 3 — Búsqueda y jerarquía en la base *(2026-07-30)*

### Objetivo

Que los dos repos lectores —el API del miniapp y el bot de WhatsApp— dejen de mantener su propia
copia de la taxonomía y empiecen a usar las funciones SQL. La ganancia visible: buscar una categoría
por su nombre pasa de devolver cero a devolver sus productos.

### Decisiones y por qué

- **Un `EXISTS` sobre la función, no una comparación por columna.** Tanto el filtro como la búsqueda
  usan `EXISTS (SELECT 1 FROM category_...(...) k WHERE k.key IN (p.category, p.sub_category))`. Una
  sola llamada cubre los dos niveles, y el `IN` evita repetirla por columna.
- **Filtrar por categoría ahora significa filtrar por rama.** Antes se comparaba solo contra
  `p.category`, así que pedir `jugos` devolvía **cero**: ninguna publicación guarda esa clave en esa
  columna, la guarda en `sub_category`. Con el subárbol, un mismo parámetro sirve para los dos
  niveles y el miniapp podrá pintar chips de ambos sin inventar un `?subCategory=`.
- **En NestJS, caché en memoria; en Python, `LEFT JOIN`.** Desviación deliberada del roadmap, que
  pedía caché en los dos. En Nest la etiqueta se resuelve en TypeScript (el presenter), así que hace
  falta la taxonomía en memoria: `CatalogService` es singleton, con TTL de 15 min, promesa `inFlight`
  contra la estampida y warm-up en `onModuleInit`. En Python, en cambio, lo que consume la etiqueta
  es el prompt y el texto del embedding, ambos aguas abajo del repositorio: resolverla en la
  proyección con cuatro `LEFT JOIN` sobre una tabla de 14 filas indexada por PK sale más barato que
  mantener un TTL coherente entre procesos, y arregla los dos sitios de una vez. **Menos código y sin
  desfase posible.**
- **El `.transform()` sale de zod.** `productSchema` valida la fila cruda y `presentProduct` pone la
  etiqueta. No cabía en zod: la taxonomía se lee de la base (asíncrono) y depende del idioma. El
  contrato `Product` no cambia —`category` sigue siendo `string | null`— así que el miniapp no se
  entera.
- **El fallback permisivo se conserva en el repo C.** Una clave fuera del catálogo se devuelve
  normalizada, no `null`: son datos que ya existen en la base y borrarlos de la tarjeta esconde
  información real. Es la diferencia deliberada con `comida-justa`, donde la clave la escribe el
  formulario contra la misma tabla y sí conviene `null`. El contrato está fijado clave por clave en
  `CategoryTaxonomy.test.ts`.
- **Se quitó `@Global` de `CatalogModule`.** Se probó primero con él y `app.module.spec.ts` —que
  arranca el grafo completo— falló: la dependencia resolvía "por magia" en un sitio y no en otro. Con
  dos consumidores, importarlo explícitamente cuesta una línea y se ve en el módulo que lo usa.

### Archivos tocados

**`HazloSano/dev` (NestJS + miniapp)**
- `packages/domain/src/catalog/entities/CategoryTaxonomy.ts` *(nuevo)* + `categoryTaxonomyFallback.ts`
  *(nuevo)* + `CategoryTaxonomy.test.ts` *(nuevo, 37 casos)*
- `packages/domain/src/products/entities/categories.ts` y su test *(eliminados: eran el espejo manual)*
- `packages/domain/src/index.ts` — exporta el catálogo, retira el espejo
- `apps/api/src/modules/catalog/{catalog.module.ts,catalog.service.ts,catalog.testing.ts}` *(nuevos)*
  y `infra/catalog.repository.ts` *(nuevo)*
- `apps/api/src/modules/products/infra/product.presenter.ts` *(nuevo)* + su spec *(nuevo)*
- `apps/api/src/modules/products/infra/product.schema.ts` — sin `.transform()`, valida la fila cruda
- `apps/api/src/modules/products/infra/products.repository.ts` — subárbol, búsqueda por etiqueta y
  `present()`
- `apps/api/src/{app.module.ts,modules/products/products.module.ts}` — cableado
- Los tres specs de producto — constructor nuevo y criterios del slice

**`bot-whatsapp/backend` (Python)**
- `app/infrastructure/db/repositories/post_product.py` — `PROJECTION` con las etiquetas por locale,
  `get_by_category` por subárbol y `search_by_text` por etiqueta/alias
- `app/infrastructure/clients/prompts/hazlo_sano.py` — `CATEGORÍA: Alimentación` en vez de
  `CATEGORY: ALIMENTACION`

**`comida-justa`** — solo especificación: los escenarios `@slice-3` pasan de `@future` a implementados.

### Validación

| Comando | Resultado |
|---|---|
| `tsc -p tsconfig.json` (domain) | `DOMAIN_BUILD=0` |
| `vitest --run` (domain) | **37 tests, verde** |
| `tsc --noEmit` (apps/api) | `API_TYPECHECK=0` |
| `vitest --run` (apps/api) | **57 tests / 6 archivos, verde** — incluye el wiring de Nest y las de integración contra la base |
| `pytest -q` (backend) | **92 tests, verde**, con el golden de búsqueda semántica recolectado |

**Los criterios del slice se fijaron como pruebas de integración contra la base real**, no como
afirmaciones en la bitácora (`products.repository.spec.ts`, 21 casos verdes).

**Comprobación end-to-end del lado Python**, que sus pruebas unitarias no cubren porque usan dobles:

```
get_all: 14 productos
  categorías     -> ['Alimentación']            (etiqueta, no clave)
  sub-categorías -> ['Bebidas','Jugos','Panadería','Platillos','Untables']

get_by_category('alimentacion') -> 14      get_by_category('jugos') -> 1
get_by_category('ferreteria')   -> 0       (sin error)

search_by_text('panadería')          -> 3 panes    <- antes 0
search_by_text('bakery')             -> 3 panes
search_by_text('pan')                -> 10 (3 panes + coincidencias de texto)
search_by_text('zumo')               -> 1 jugo
search_by_text('tornillos y clavos') -> 0

locale=en -> ['Bakery','Dishes','Drinks','Juices','Spreads']
```

### Escrito en recursos compartidos

**Nada.** Todas las consultas de esta validación fueron `SELECT`; los dos repos son de solo lectura
sobre `posts` (sus `create`/`update` lanzan `NotImplementedError`).

### Desviaciones respecto al roadmap

- **Sin caché en Python** (ver decisiones): se sustituyó por `LEFT JOIN` en la proyección. Menos
  código, sin TTL que pueda quedar desfasado, y cubre a la vez el prompt y el texto del embedding.
- `_build_embedding_text` no se tocó: al resolver la etiqueta en la proyección ya recibe
  `Alimentación` y queda alineado con `comida-justa` sin cambiar una línea. De todos modos ese camino
  está dormido — `create`/`update` lanzan `NotImplementedError`.
- Se añadió `catalog.testing.ts` (no previsto) para que las pruebas de integración construyan el
  servicio sin pasar por el contenedor de Nest, usando la base de verdad.

### Recap

Los tres repos leen ya la misma taxonomía de la misma tabla, y ninguno conserva su copia: el espejo
manual del miniapp —el que provocó el commit que originó toda esta feature— está borrado. Buscar
"panadería" devuelve los tres panes en los dos consumidores, cuando antes el acento bastaba para
devolver cero; pedir `jugos` ya trae el jugo en vez de una lista vacía; y el prompt del bot lee
`CATEGORÍA: Alimentación` en lugar de gritar una clave. La etiqueta se resuelve donde toca en cada
stack —caché en memoria en Nest, `LEFT JOIN` en Python— y todo quedó fijado con pruebas que corren
contra la base real, no con afirmaciones.

### Próximos pasos (opciones)

1. **Slice 4** — el miniapp habla el idioma del usuario: propagar `locale` por el tramo controller →
   use-case → puerto (el repositorio ya lo acepta), añadir `GET /v1/catalog/categories?locale=` y los
   chips de filtro. Con las etiquetas ya en la tabla, un usuario con Telegram en inglés vería
   `Bakery / Juices / Spreads` el día del despliegue, sin traducir una sola publicación.
2. **Desplegar lo hecho.** El orden del roadmap se cumple solo: la migración ya está aplicada y los
   tres repos funcionan con ella.
3. **Slice 5** — `/admin/catalogo` para editar la taxonomía sin migración.

**Pendiente de tu lado:** elegir entre 1, 2 y 3.

---

## Ramas y commits semánticos *(2026-07-30)*

El trabajo se dividió en tres ramas `feat/taxonomia-centralizada`, una por repo, cada una desde la
rama en curso de ese repo.

**Hallazgo que hubo que resolver antes:** `dev` en este repo tenía un `commit (amend)` que había
absorbido **14 archivos del slice 1** dentro de un commit titulado *"docs: update docs format"*.
`origin/dev` seguía en `a433053`, así que se devolvió `dev` a su estado publicado y la rama recogió
todo el trabajo en commits propios. El commit de documentación del usuario quedó intacto — el amend
solo había añadido archivos, sin tocar su contenido.

**Sobre el hook `pre-commit`:** corre `pnpm run validate` completo —lint, typecheck, unitarias y la
suite e2e— en **cada** commit. Con nueve commits eso son nueve suites e2e seguidas, y aparecieron dos
fallos que no eran del código:

1. `.next/dev/types/routes.d.ts` a medio escribir. Lo genera el dev server que Playwright arranca
   dentro del hook, y `tsconfig` lo incluye. Borrar `.next` **entero** antes de cada commit lo
   arregló pero introdujo otro: compilación en frío, y el primer escenario navegaba antes de que la
   ruta estuviera lista. Se borra solo `.next/dev/types`.
2. Un escenario de autenticación flaky bajo la carga de repetir la suite. Se resolvió corriendo los
   commits con `CI=1`, que activa los `retries: 2` que el propio `playwright.config.ts` ya define
   para CI — no se saltó el hook.

---

## Deuda de pruebas y slice 4 *(2026-07-30)*

### Lo que faltaba por cubrir

Revisando qué protegía realmente los cambios ya hechos, aparecieron cinco huecos. **Dos eran deuda
propia del slice 3:**

| Hueco | Origen |
|---|---|
| `CatalogService` — TTL, dedup `inFlight`, warm-up | **deuda del slice 3** |
| `CatalogRepository` — plegado por locale, fallback | **deuda del slice 3** |
| `products.controller.ts` — sin spec, y el slice 4 lo modifica | preexistente |
| Los tres use-cases de producto — sin spec | preexistente |
| `apps/telegram` — 9 archivos, cero pruebas y cero tooling | preexistente |

`CatalogService` y `CatalogRepository` se habían escrito apoyándose en las pruebas de integración,
que los ejercitan de refilón. Eso no cubre ni el TTL ni la estampida del arranque, que son la razón
de que existan.

**Todas las suites nuevas se comprobaron con mutaciones**, para no dejar pruebas que pasan siempre:
TTL infinito, quitar el dedup `inFlight` y degradar a vacío en vez de al respaldo — las tres ponen la
suite en rojo, la del dedup con la señal exacta (`expected 4 to be 1`).

### El miniapp pasó de cero a 72 pruebas

`apps/telegram` es lo que el usuario ve y era la única parte del monorepo sin ninguna red; su script
de pruebas era literalmente `echo 'no tests yet'`. Se montó Vitest + Testing Library + jsdom, con
config separada de `vite.config.ts` —esa carga Tailwind y el proxy de desarrollo, que no aportan nada
al correr pruebas— y se cubrió la línea base **antes** de tocar nada.

### Slice 4, con las pruebas primero

Cada capa se escribió en rojo y luego se implementó: `categoryTree` en el dominio, `resolveLocale` y
los dos controllers en el API, la propagación por los use-cases y el puerto, y el idioma más los
chips en el miniapp.

**Decisiones que no son obvias:**

- **El chip filtra por la búsqueda, no por `GET /v1/products?category=`.** Ese endpoint no pagina ni
  calcula distancia; filtrar por él haría que el usuario perdiera la vitrina como la venía navegando.
- **`resolveLocale` ordena `Accept-Language` por su factor `q`.** Sin eso,
  `en;q=0.8,es;q=0.9` daría inglés por venir primero, cuando el navegador está pidiendo español.
- **Lo explícito manda sobre la cabecera:** el miniapp sí sabe el idioma del usuario —Telegram le da
  su `language_code`— y ahí el navegador no debería contradecirlo.
- **Los chips no se pintan si el catálogo no se puede leer.** Es un filtro, no el contenido: una
  barra vacía ocuparía espacio prometiendo algo que no hay. `fetchCategories` no lanza.
- **El texto y la rama vigentes viven en una referencia** dentro de `useProducts`: tomarlos como
  dependencias de `loadMore` lo recrearía en cada tecla y el efecto del scroll se reengancharía.

### Dos hallazgos que no eran lo que parecían

1. **`vitest 4` pareció romper una prueba de integración** (`16` productos contra `14`). No era
   vitest: la suite e2e de `comida-justa` corría en paralelo **sembrando productos en la misma
   base**. Tres repos la comparten, así que cualquier aserción de conteo absoluto falla por el
   trabajo de otro. Se reescribió como propiedad del subárbol —la rama contiene a la hoja— que es lo
   que se quería comprobar y no depende de que la base esté quieta.
2. **El choque de tipos Vite 7 vs 8** que rompió el typecheck de `apps/api` no lo introdujo el
   miniapp: `vite@^8.0.1` ya estaba declarado ahí. Montar Vitest cambió el hoisting de pnpm y
   `unplugin-swc` empezó a resolver contra la 8. Se resolvió **subiendo** vitest a 4.1.10 en los
   cuatro workspaces, no fijando hacia atrás.

### Validación

| Workspace | typecheck | pruebas |
|---|---|---|
| `packages/domain` | 0 | **46** |
| `packages/use-cases` | 0 | **31** |
| `apps/api` | 0 | **152** (incluye integración contra la base) |
| `apps/telegram` | 0 | **72** (antes: 0) |
| `comida-justa` | 0 | **232** + e2e **21/21** |
| `bot-whatsapp` | — | **92** |

Lint de `apps/telegram`: de **7 errores preexistentes a 2**. Los dos que quedan son de
`react-hooks/set-state-in-effect` en `useTelegram` y `SearchBar`, hooks ajenos a este slice cuyo
arreglo cambia comportamiento —como el de `SearchBar` en comida-justa— y merece su propio paso.

### Escrito en recursos compartidos

**Nada.** Todas las consultas fueron `SELECT`; los dos repos lectores siguen sin escribir en `posts`.

### Lo que queda sin verificar

- **No hay e2e en `HazloSano/dev`**: el repo no tiene Playwright. Los escenarios `@slice-4` están
  cubiertos por pruebas de componente y de integración contra la base, pero **nadie ejercita el
  miniapp en un navegador de verdad**. Montar Playwright ahí es infraestructura nueva y queda como
  siguiente paso.
- Los dos escenarios de `/publicar` del slice 2 siguen sin ejecución automatizada.

### Próximos pasos (opciones)

1. **Montar Playwright en `HazloSano/dev`** y cubrir el miniapp en navegador: es el único tipo de
   prueba que le falta al monorepo.
2. **Arreglar los 2 errores de lint** de `useTelegram` y `SearchBar` en el miniapp.
3. **Slice 5** — `/admin/catalogo` para editar la taxonomía sin migración.
4. **Desplegar**: la migración está aplicada y los tres repos funcionan con ella.

---

## Slice 5 — Administrar el catálogo sin migración *(2026-07-30)*

### Objetivo

Que agregar una categoría deje de ser una migración. Es el primer slice en el que **el sitio escribe
en la taxonomía**.

### Alcance: agregar y (des)activar

Se descartaron dos operaciones, y el motivo no es de esfuerzo:

- **Renombrar** cascadea a `posts` por el `ON UPDATE CASCADE` y, sobre todo, **cambia el texto que
  alimenta el embedding** — cada renombre exigiría reindexar. Es la operación que motivó toda la
  feature, pero desde una UI, sin ese reindexado, dejaría el espacio vectorial desalineado en
  silencio.
- **Borrar** solo funciona en categorías vacías: el FK con `ON DELETE RESTRICT` lo impide en cuanto
  haya un producto o una hija. Es la mayor superficie por el menor beneficio.

**Desactivar es la operación reversible que cubre la necesidad real**: saca la categoría del
selector y de los filtros sin tocar las publicaciones que ya la usan, que siguen mostrando su
etiqueta.

### Decisiones

- **La validación vive en el dominio y devuelve todos los errores a la vez.** La base ya rechaza lo
  imposible —el CHECK del formato, el trigger de profundidad, el FK del padre—, pero esos errores
  llegan como un 500 sin explicación. Arreglar un formulario error por error es una forma lenta de
  perder a quien lo está llenando.
- **La categoría y sus etiquetas van en una sola transacción.** Una categoría a medio crear se
  vería por su clave en toda la vitrina, y arreglarlo exigiría entrar a la base. Comprobado: un
  fallo a mitad deja **cero** categorías huérfanas.
- **`updateTag`, no `revalidateTag`.** El primero está pensado para llamarse desde una Server Action
  y garantiza *read-your-own-writes*: quien acaba de crear la categoría la ve de inmediato. Con
  `revalidateTag` habría que esperar —y en Next 16 exige además un perfil de caducidad.
- **El `level` se deduce del padre** en vez de pedirlo al formulario: es información redundante que
  el formulario podría contradecir, y el trigger la rechazaría con un mensaje que nadie espera.
- **`sort_order` deja la nueva al final de sus hermanas.** Aparecer en medio del catálogo sin
  haberlo pedido sería una sorpresa; el orden se ajusta después.
- **La Server Action revalida el permiso.** Es un endpoint: se puede invocar sin pasar por la
  página, así que el gate de la página no basta.
- **Un fallo de la base se traduce a un mensaje.** Dos administradores a la vez pasan la validación
  con la misma clave y solo uno gana; el otro merece una frase, no una pantalla de error.

### Validación

| | |
|---|---|
| Dominio (`newCategory`) | **19** casos |
| Acciones (`actions.test.ts`) | **11** casos, incluido el gate de admin y la carrera entre dos altas |
| Escritura contra la base | verificada con una categoría desechable, **0 restantes tras limpiar** |

Lo comprobado contra la base de verdad, que ni el typecheck ni Vitest cubren:

```
creada: level=2, sort_order=70, 2 etiquetas       (transacción completa)
en la vista `category_labels`: es=Prueba, en=Test  (la ven los tres repos)
desactivar -> fuera de category_subtree_keys       (0)
reactivar  -> de vuelta                            (1)
clave repetida -> rechazada por la base            (la base es la última palabra)
fallo a mitad -> 0 categorías a medias             (la transacción hace su trabajo)
```

### Escrito en recursos compartidos

**Una categoría de prueba, creada y borrada en la misma corrida** (`zzz_prueba_claude`). Se verificó
explícitamente que no quedó ninguna: `categorías de prueba restantes: 0`. Ninguna categoría real se
tocó.

**Y una limpieza de datos filtrados por la propia suite e2e.** Al validar, el golden del backend
empezó a fallar con *"2 productos siguen sin indexar"*. No era código: tres publicaciones sembradas
por `products.spec.ts` —con el sufijo de timestamp `1785417725068`— habían sobrevivido a una corrida
que falló hoy antes de llegar a su `afterEach`. Se borraron; `posts` volvió de 16 a 14 productos y
las traducciones sin embedding a 0. Tras eso, `pytest` 92/92 y `apps/api` 152/152.

**Corrige un diagnóstico anterior de esta misma bitácora:** el `16 contra 14` que se atribuyó a "la
suite e2e corriendo en paralelo" era en realidad **este dato filtrado**, no concurrencia. La
conclusión —no usar conteos absolutos en una base compartida— se sostiene igual, y la reescritura de
esas aserciones como propiedades del subárbol sigue siendo lo correcto; lo que estaba mal era la
causa que se les atribuyó.

**Deuda que esto deja al descubierto:** una corrida de e2e que falle a mitad puede dejar
publicaciones sembradas en la base que los tres repos comparten. `afterEach` no basta cuando el
proceso muere. Valdría un barrido previo por el patrón de sufijo, o un `globalTeardown`.

### Los escenarios de UI, ya recorridos en navegador

`src/e2e/adminCatalog/adminCatalog.spec.ts`, con sesión de administrador — **6 escenarios, verdes**:

1. Una sub-categoría nueva aparece en `/publicar` **sin desplegar**.
2. Desactivarla la saca del selector, **pero la publicación que ya la usa conserva su etiqueta** —
   se siembra un producto con esa categoría y se comprueba en su página de detalle.
3. Se puede volver a activar desde la misma pantalla.
4. Una clave con mayúsculas se explica antes de guardar, en vez de reventar contra el CHECK.
5. Una clave que ya existe se rechaza.
6. Quien no es administrador recibe **404**, no 403.

**Comprobado que no son vacuas:** quitar la invalidación de caché rompe 3 de las 6 — que es
exactamente lo que esos escenarios existen para proteger.

**La limpieza aprendió del incidente anterior.** Las categorías de prueba llevan el prefijo `e2e_`,
hay un **barrido en `beforeAll`** —no solo en `afterEach`, que no corre si el proceso muere— y un
`afterAll` que **afirma que quedan cero**. El orden importa: el FK es `ON DELETE RESTRICT`, así que
primero se van las publicaciones y después la categoría.

Estado de la base tras las corridas: 0 categorías `e2e_`, 0 publicaciones con sufijo de timestamp,
14 productos, 0 traducciones sin embedding, y las 7 categorías reales intactas.

### Recap

Agregar una categoría dejó de necesitar una migración: se da de alta desde `/admin/catalogo`, el
caché se invalida en el acto y aparece en `/publicar` sin desplegar. Desactivar la retira del
selector y de los filtros sin tocar lo ya publicado, y se puede revertir desde la misma pantalla.
Renombrar y borrar quedaron fuera con motivo escrito, no por olvido. Con esto los cinco slices del
roadmap están entregados.

### Próximos pasos (opciones)

1. **Cubrir los dos escenarios de UI con Playwright** (necesita sesión de administrador), que es lo
   único de este slice sin ejecución automatizada.
2. **Renombrar desde la UI**, si se acepta encadenarlo con el reindexado de embeddings.
3. **Desplegar**: la migración está aplicada y los tres repos funcionan con ella.
