# Bitácora — Productos de Hazlo Sano

Registro append-only por slice. Narra el porqué y las decisiones; el `git log` guarda el diff.

## Slice 1 — Marcar y mostrar un producto de Hazlo Sano  (2026-07-23)

**Objetivo:** distinguir y mostrar productos de Hazlo Sano dentro de las publicaciones, con dos
campos ortogonales en `Post` (`kind`, `origin`), marcado solo-admin y badge en el detalle.

**Decisiones y porqué:**
- **Dos ejes en vez de un `kind` plano.** `kind` (anuncio|producto) responde "qué es"; `origin`
  responde "de dónde/quién viene". Así "todos los productos" es una sola condición y el `origin`
  es reutilizable. "Producto de Hazlo Sano" = `kind=producto` + `origin` `hazlo_sano_*`.
- **`origin` como `text` + allowlist de dominio** (`src/domain/entities/post/origin.ts`), no enum de
  BD: agregar un valor futuro = editar la constante, sin migración.
- **Admin gate en la capa de aplicación, no en el dominio.** El validador solo valida forma del dato
  (allowlist, `producto`⇒`price`); la autorización de `hazlo_sano_*` vive en la action vía
  `resolveOriginForUser(raw, isAdmin)` (defensa en servidor) + `isAdmin(email)` contra env
  `HAZLO_SANO_ADMIN_EMAILS`. No se introdujo un sistema de roles.
- **Migraciones por Alembic, no Drizzle (hallazgo importante).** La BD es compartida con el backend
  de Python (`bot-whatsapp/backend`), que administra el schema con Alembic. `drizzle-kit generate`
  entrelazó drift de `users` administrado por Alembic (`external_id NOT NULL`, potencialmente
  destructivo). Se descartó la migración Drizzle; el cambio va como migración Alembic
  `0022_2026-07-23_add_kind_and_origin_to_posts.py` (encadenada desde el head `f1e2d3c4b5a6`). El
  schema Drizzle queda solo como espejo de tipos/consulta. Documentado en `docs/data/001-2026-06-19-database.md` + memory.
- **Fix colateral:** el use case `createOnePost` no reenviaba `price` a `save` (se perdía antes de la
  BD). Al hacer fluir `kind`/`origin` se corrigió también `price`.
- **Badge solo en el detalle en este slice.** El badge en tarjeta se movió al Slice 2 (donde ya se
  toca el read model de listado), para no ampliar la superficie ahora.

**Archivos tocados (agrupados):**
- Dominio: `entities/post/{types,kind,origin}.ts`, `schemas/PostValidator.ts`.
- Use case: `createOnePost/createOnePostUseCase.ts` (+ test).
- Infra: `db/schema/posts.ts` (espejo), `createOnePost/PostgresPostRepository.ts`,
  `getOnePostWithPaginatedComments/PostgresGetOnePost.ts`, `types/Posts.d.ts`, `auth/isAdmin.ts`,
  `UI/components/ProvenanceBadge/`.
- App: `publicar/{page,PublishForm,actions}.tsx/ts`, `[slug]/ui/PostDetail.tsx`.
- Backend (Alembic): `0022_2026-07-23_add_kind_and_origin_to_posts.py`.
- Tests: `origin.test.ts`, `PostValidator.test.ts`, `isAdmin.test.ts`, `ProvenanceBadge.test.tsx`,
  `createOnePostUseCase.test.ts` (actualizado), e2e `publishProduct/`.

**Comandos clave:**
- `pnpm run db:generate` → **descartado** (entrelazaba drift de `users`); artefactos `0004` borrados.
- Migración BD: `cd .../bot-whatsapp/backend && alembic upgrade head`  ← **pendiente de correr por el usuario**.

**Validaciones:** `test:run` ✅ 80/80 (14 archivos) · `typecheck` ✅ · `lint` ✅.
El e2e (`publishProduct.spec.ts`) requiere el stack + usuario admin en `HAZLO_SANO_ADMIN_EMAILS`; no se
ejecutó en este entorno (igual que el resto de e2e del repo).

**Desviaciones del roadmap:** migración por Alembic (no Drizzle) — hallazgo durante el slice; badge de
tarjeta diferido al Slice 2.

**Pendientes / follow-ups:**
- Ejecutar el e2e (necesita stack + usuario admin) — aún no corrido.
- Slice 2: página de productos (solo Hazlo Sano por ahora) + badge en tarjeta.
- Evaluar a futuro la relación con el dominio de comercio del backend (`products`, `sellers`, `ads`).

**Recap:** Slice 1 entregado y verificado — `test:run` 80/80, `typecheck` y `lint` en verde. Falta
aplicar la migración Alembic `0022_2026-07-23` y configurar admin para validarlo en el app real. Se
estableció que las migraciones de la BD compartida van por **Alembic** (convención de `revision`:
`NNNN_YYYY-MM-DD`); Drizzle queda como espejo de tipos/consulta.

**Acciones pendientes del usuario:**
- `alembic upgrade head` (idealmente BD local con docker, NO la Supabase compartida).
- Añadir el/los correo(s) admin a `HAZLO_SANO_ADMIN_EMAILS`.

**Próximos pasos (opciones):**
1. Armar el setup local de e2e (docker postgres + `alembic upgrade head` local + usuario admin) y
   correr `pnpm run test:e2e:run`.
2. Continuar con el **Slice 2** (página de productos solo-Hazlo-Sano + badge en tarjeta).
3. Ajustes al Slice 1 antes de seguir.

## Slice 1 — Estabilización del e2e `publishProduct` (2026-07-24)

**Objetivo:** dejar `publishProduct.spec.ts` corriendo verde y de forma determinista contra el stack.

**Bugs encontrados (encadenados) y fix:**
1. **El `<select>` de Procedencia no se renderizaba** → `isAdmin()` devolvía `false`. Causa raíz:
   `simulateLogin` tomaba `SELECT id FROM users LIMIT 1`, y ese primer usuario tiene **`email: null`**,
   así que el gate de admin lo rechazaba. Fix: `simulateLogin(page, browser, { email })` opcional que
   busca un usuario por email (error claro si no existe); sin `email` el comportamiento previo queda
   intacto, así que los otros 3 specs no cambian. El spec loguea con el primer correo de
   `HAZLO_SANO_ADMIN_EMAILS` (`test.skip` si no está configurado).
2. **Tres botones "Publicar"** en la página (header, submit del form, footer) → strict-mode violation.
   Fix: acotar el locator al `<form>` (`getByRole("form").first()`), igual que hace `createPost`.
3. **El upload se colgaba en 0%** (subida real a GCS: signed-url + PUT, lenta y no determinista; en
   frío nunca completaba; además `setInputFiles` iba tan temprano que a veces disparaba el `change`
   antes de la hidratación de React). Fix: `stubStorageUpload()` en el page object intercepta las 3
   llamadas (`/api/storage/signed-url`, el PUT, `/api/storage/read-url`) con `page.route`. El
   `publicUrl` mock **debe** usar un host permitido por `next.config` `images.remotePatterns`
   (`firebasestorage.googleapis.com`), si no `next/image` lanza "hostname not configured" y el detalle
   no renderiza. `setInputFiles` se movió al final del `fill`.
4. **Posts huérfanos** en la BD compartida con el mismo slug fijo, de corridas que fallaban antes de
   limpiar → el detalle mostraba el registro viejo (con la URL mock anterior). Fix: la limpieza
   (`deleteOnePostBySlug`) se movió a `afterEach` para que un fallo a mitad no deje basura. Se borraron
   3 huérfanos manualmente (`crema-de-cacahuate-artesanal`).

**Archivos tocados:** `e2e/testUtils/simulateLogin.ts`, `e2e/publishProduct/{PublishProductPage.ts,
publishProduct.spec.ts}`.

**Validaciones:** `typecheck` ✅ · suite e2e completa ✅ **4 passed, 3 skipped** (los skipped son los
preexistentes que dependen de recursos externos/AI). El `404 upstream image response failed` en el log
es benigno (next/image intenta optimizar la imagen mock inexistente; no afecta render ni test).

**Hallazgo aparte (pendiente de decisión del usuario):** dos correos de `HAZLO_SANO_ADMIN_EMAILS` en
`.env.development` **no coinciden con ningún usuario real** en la BD:
- `rorchach.cevj87@gmail.com` → la BD tiene `rorschach.cevj87@live.com` (con `s` y otro dominio).
- `hazlo.sano.comunidad@gmail.com` → la BD tiene `salud.justa.comunidad@gmail.com`.
No afectan al test (usa el primero, `jaime.cervantes.ve@gmail.com`, que sí existe), pero esas personas
hoy **no tienen acceso de admin** en la app real. Falta decidir si corregir los correos en el env.

## Slice 2 — Listado de productos de Hazlo Sano (2026-07-24)

**Objetivo:** una página `/productos` que muestre **solo** lo que vende Hazlo Sano (`kind = producto`
+ `origin` `hazlo_sano_*`), reutilizando la consulta/paginación existente, y el badge en tarjeta que
quedó diferido del Slice 1.

**Decisiones y porqué:**
- **La definición "producto de Hazlo Sano" vive en el dominio** (`entities/post/hazloSanoProduct.ts`,
  `isHazloSanoProduct` + `PRODUCT_KIND`). Es la intersección de los dos ejes; si viviera en el SQL o
  en la UI, cada capa la reinventaría y se desincronizarían.
- **Un `WHERE` compuesto, no una segunda consulta.** `PostgresPostQueryRepository` se refactorizó a un
  privado `getPaginatedPosts(where, page, pageSize)`; `getMultiplePosts` pasa `TRUE` y el nuevo
  `getHazloSanoProducts` pasa `kind = 'producto' AND origin LIKE 'hazlo_sano_%'`. Misma proyección,
  misma paginación, cero duplicación de las 60 líneas de SQL (traducciones + media + `COUNT(*) OVER()`).
- **`kind`/`origin` ahora viajan en el read model** (`PostData` → `mapPostsToCards` → tarjeta). Era el
  requisito para el badge en tarjeta y evita una consulta extra por post.
- **Método explícito en el puerto en vez de un filtro genérico.** `getHazloSanoProducts(page, size)`
  dice lo que hace; un `filter: {kind?, origin?}` genérico sería especular sobre el Slice 3 (reportes),
  que probablemente necesita agregados, no este filtro.
- **Dos rutas, una UI.** `/productos` (página 1) y `/productos/page/[page]`, que es el patrón que ya
  usa el repo (`/page/[page]`, `/buscar/[term]/page/[page]`) y reutiliza el componente `Pagination`.
  La lista, el estado vacío y el grid viven en `ui/ProductsList.tsx` para que ambas rutas compartan
  comportamiento y se pueda probar con Vitest sin levantar la app.
- **El link "Productos" del header apunta ahora a `/productos`** (antes `/info`). `/info` sigue
  existiendo y sigue enlazada desde el footer ("Productos Naturales"): es la página informativa
  escrita a mano, no el listado.
- **Seed del e2e por el repositorio de escritura, no por la UI.** El escenario es sobre el read model;
  publicar 3 posts por formulario sería lento y arrastraría el admin gate. `testUtils/seedPost.ts`
  usa `PostgresPostRepository.save` (misma ruta de escritura de producción) con un `url` de media en
  un host permitido por `next.config` (aprendizaje del Slice 1).

**Archivos tocados (agrupados):**
- Dominio: `entities/post/hazloSanoProduct.ts` (+ test).
- Infra (datos): `dataAccess/posts/{IPostQueryRepository,PostgresPostQueryRepository}.ts`.
- Infra (UI): `mappers/posts/mapPostsToCards.ts` (+ test), `components/CardForList/CardForList.tsx`
  (+ test), `components/Header/{Nav,MobileNav}.tsx`.
- App: `[locale]/productos/{page.tsx,data.ts,metadata.ts,ui/ProductsList.tsx}` (+ test),
  `[locale]/productos/page/[page]/page.tsx`.
- Tests e2e: `e2e/products/{ProductsPage.ts,products.spec.ts}`, `e2e/testUtils/seedPost.ts`,
  `e2e/publishProduct/publishProduct.feature` (escenarios del Slice 2 detallados).

**Comandos clave:** `pnpm run test:run`, `pnpm run typecheck`, `pnpm run lint`. Verificación de render
con lecturas contra la BD (`GET /productos`, `/`, `/productos/page/2`) sobre el dev server ya corriendo.

**Validaciones:** `test:run` ✅ **93/93** (17 archivos, +13 tests) · `typecheck` ✅ · `lint` ✅.
`GET /productos` → 200 con el h1 y el **estado vacío** (hoy no hay productos `hazlo_sano_*` en la BD:
el del Slice 1 se borró al limpiar el e2e) · `GET /` → 200 con 8 tarjetas (sin regresión tras
refactorizar la consulta). El e2e `products.spec.ts` **no se ejecutó**: siembra posts y por tanto
**escribe en la BD compartida (Supabase)**; queda pendiente de decisión del usuario.

**Hallazgos:**
- La migración Alembic `0022` **ya está aplicada** en la BD compartida: la consulta con `p.kind` /
  `p.origin` responde sin error. Se cierra ese pendiente del Slice 1.
- `notFound()` responde **200** en toda la app (comprobado en `/page/9999`, `/productores-locales` y
  una ruta inexistente), no solo en las rutas nuevas. Es comportamiento preexistente (probablemente el
  middleware de next-intl); no se tocó aquí.

**Desviaciones del roadmap:** ninguna en alcance. El badge en tarjeta, diferido del Slice 1, entró aquí
como estaba previsto.

**Pendientes / follow-ups:**
- Ejecutar `products.spec.ts` (decidir dónde: BD local vs. compartida).
- Revisar el 200 de `notFound()` en toda la app (SEO: los 404 no se están señalando como tales).
- Slice 3: reportes por `origin`.
- Sigue pendiente decidir los correos de `HAZLO_SANO_ADMIN_EMAILS` que no existen en la BD.

**Recap:** `/productos` ya lista únicamente productos de Hazlo Sano, con paginación reutilizada y badge
de procedencia en cada tarjeta; el header apunta al listado nuevo y `/info` queda como página
informativa enlazada desde el footer. La definición del producto de Hazlo Sano quedó en el dominio y el
listado general no cambió de comportamiento. Todo verde en unit/typecheck/lint (93 tests); lo único sin
correr es el e2e del slice, porque siembra datos en la BD compartida.

**Acciones pendientes del usuario:**
- Ejecutar el e2e manualmente (decisión del usuario, por ser escritura en la BD compartida):
  `pnpm exec playwright test src/e2e/products` (o `pnpm run test:e2e:run` para la suite completa).

**Próximos pasos (opciones):**
1. Correr el e2e del Slice 2 (contra la BD compartida o contra una local).
2. Publicar un producto real de Hazlo Sano desde `/publicar` para ver el listado con contenido.
3. Continuar con el **Slice 3** (reportes por `origin`).

### Adenda — corrida e2e del usuario y estabilización de `createPost` (2026-07-24)

El usuario corrió la suite: **`products.spec.ts` ✅ y `publishProduct.spec.ts` ✅**; el único fallo fue
`createPost.spec.ts` (`getByText(/subido/i)` nunca apareció, 45s de timeout). No es regresión del Slice
2: ese spec arrastraba **los dos problemas que el Slice 1 arregló solo en `PublishProductPage`** —
subida real a GCS y `setInputFiles` antes de la hidratación (en el snapshot del fallo el selector de
imagen sigue en su estado inicial, sin progreso ni preview: el `change` se perdió).

**Fix (aplicado):** se extrajo el stub a `e2e/testUtils/stubStorageUpload.ts` (una sola definición del
host permitido por `next.config` y de las 3 llamadas interceptadas); `PublishProductPage` y `PublishPage`
lo delegan, `createPost.spec.ts` y `publishTestPost.ts` lo activan, y `fillFields` mueve el
`setInputFiles` al final. **Trade-off consciente:** ya ningún test toca GCS de verdad; esa ruta queda
para validación manual (o para un test opt-in si algún día se quiere cubrir).

**Validaciones:** `typecheck` ✅ · `lint` ✅. La suite e2e vuelve a correrla el usuario (escribe en la
BD compartida). **Resultado: el usuario la corrió y pasó completa.**

### Adenda — productos dummy para poblar `/productos` (2026-07-24)

**Objetivo:** ver el listado con contenido real-ish, tomando como referencia los productos de `/info`.

**Decisiones:**
- **Script, no inserción a mano.** `src/scripts/seedHazloSanoProducts.ts` + `pnpm run seed:products`
  (convención ya existente en `src/scripts/seed*.ts`). Es repetible, idempotente por `slug` (omite lo
  que ya existe) y **reversible**: `pnpm run seed:products -- --remove`. Tiene `--dry-run` para
  revisar qué se va a escribir sin tocar la BD.
- **Escribe por `PostgresPostRepository.save`**, la misma ruta de escritura de producción, así el seed
  no puede divergir del formato real (posts + translations + media + `kind`/`origin`).
- **`origin` según la realidad de `/info`:** el pan de masa madre es de **MMNaturalmente** y Hazlo Sano
  es punto de venta oficial → `hazlo_sano_reventa`; la crema de cacahuate la hace Hazlo Sano →
  `hazlo_sano_propio`. Precios del pan tomados tal cual de `/info` ($96 / $125 / $136); **el de la
  crema ($120) es inventado**, porque `/info` no lo publica.
- **Imagen:** `/logo.webp` (local). `next.config` solo permite dos hosts remotos, así que una foto real
  debe subirse desde `/publicar`; el seed no puede inventar una URL remota válida.

**Validaciones:** `seed:products --dry-run` ✅ → `seed:products` ✅ (4 creados, 0 omitidos) ·
`GET /productos` → 200 con el grid, los 4 productos y sus badges, precios $96/$125/$136/$120 ·
detalle de 2 de ellos → 200 con badge · `typecheck` ✅ · `lint` ✅.

**Ojo (visibilidad):** los 4 productos viven en la BD compartida, así que también salen en el feed del
home y son públicos. Para quitarlos: `pnpm run seed:products -- --remove`.

## Slice 3 — Reportes por `origin` (2026-07-24)

**Objetivo:** que un admin vea cuántos productos hay de cada procedencia, para saber qué parte del
catálogo es propio, cuál reventa y cuánto viene de la comunidad.

**Decisiones y porqué:**
- **El armado del reporte es dominio, no SQL.** `entities/post/originReport.ts` (`buildOriginReport`)
  toma conteos crudos y devuelve **todas** las filas de la allowlist —incluidas las de cero— más una
  de "sin especificar". Si el `GROUP BY` mandara las filas, el reporte cambiaría de forma según los
  datos (aparecen y desaparecen filas) y los huecos, que es justo lo que interesa ver, quedarían
  invisibles. Los `origin` fuera de la allowlist (datos viejos) se pliegan a "sin especificar" en vez
  de romper el reporte.
- **`share` calculado en dominio, formateado en UI.** El dominio devuelve una proporción 0–1; la tabla
  la formatea con `Intl.NumberFormat`. Nada de porcentajes como string en la capa de datos.
- **Solo productos.** El reporte cuenta `kind = 'producto'`; los anuncios no entran. Es la pregunta que
  el slice responde ("cuántos propios, reventa, locales…") y mantiene una sola condición en el `WHERE`.
- **404 y no 403 para el no-admin.** Una página interna no revela que existe. Se reutiliza `isAdmin`
  del Slice 1: no se introdujo ningún sistema de roles.
- **Etiquetas de `origin` extraídas a un módulo compartido.** Estaban embebidas en `PublishForm`;
  ahora `infra/UI/labels/postOriginLabels.ts` es la única lista (`ORIGIN_LABELS`, `ORIGIN_OPTIONS`,
  `originLabel`), derivada del orden canónico del dominio. El formulario y el reporte ya no pueden
  desincronizarse.
- **El e2e asegura deltas, no números absolutos.** La BD contra la que corre la suite ya tiene
  publicaciones reales (y los 4 dummies), así que el test lee el conteo, siembra un producto y verifica
  `+1` en esa fila y `+0` en otra. Es determinista sin depender del estado previo.

**Archivos tocados (agrupados):**
- Dominio: `entities/post/originReport.ts` (+ test).
- Infra (datos): `dataAccess/posts/{IPostQueryRepository,PostgresPostQueryRepository}.ts`
  (`getProductCountsByOrigin`).
- Infra (UI): `UI/labels/postOriginLabels.ts` (nuevo, extraído de `PublishForm`).
- App: `[locale]/admin/productos/page.tsx`, `ui/OriginReportTable.tsx` (+ test);
  `[locale]/publicar/PublishForm.tsx` (usa las etiquetas compartidas).
- Tests e2e: `e2e/productsReport/{ProductsReportPage.ts,productsReport.spec.ts}`;
  `publishProduct.feature` (escenarios del Slice 3 detallados).

**Comandos clave:** `pnpm run test:run`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run test:e2e:run`.

**Validaciones:** `test:run` ✅ **102/102** (19 archivos, +9 tests) · `typecheck` ✅ · `lint` ✅ ·
**suite e2e completa ✅ 7 passed, 3 skipped** (los skipped son los preexistentes que dependen de
AI/recursos externos). Los dos escenarios nuevos —conteo con delta y el no-admin sin reporte— pasan.
La corrida sembró y borró un producto de prueba en la BD compartida (limpieza en `afterEach`).

**Desviaciones del roadmap:** ninguna. Se sumó la extracción de las etiquetas de `origin` (no estaba
planeada) porque el reporte las necesitaba y duplicarlas habría dejado dos listas que se desincronizan.

**Pendientes / follow-ups:**
- `/admin/productos` **no está enlazada** en ninguna navegación: se llega por URL. Falta decidir si el
  header muestra un acceso solo a admins.
- Sigue pendiente el 200 de `notFound()` en toda la app (afecta también a esta página cuando rechaza a
  un no-admin: el contenido correcto, el status no).
- Sigue pendiente decidir los correos de `HAZLO_SANO_ADMIN_EMAILS` que no existen en la BD.

**Recap:** la feature queda completa de punta a punta: se marca la procedencia al publicar (Slice 1),
`/productos` lista solo lo de Hazlo Sano con su badge (Slice 2) y `/admin/productos` responde cuánto
hay de cada procedencia con total y participación (Slice 3). Todo verde: 102 unit tests, typecheck,
lint y la suite e2e completa. El reporte se alimenta de la misma allowlist del dominio, así que agregar
una procedencia nueva sigue siendo editar una constante —sin migración— y aparece sola en el formulario
y en el reporte.

**Acciones pendientes del usuario:** ninguna para cerrar el slice.

**Próximos pasos (opciones):**
1. Enlazar `/admin/productos` desde el header solo para admins (o dejarlo por URL a propósito).
2. Arreglar el 200 de `notFound()` en toda la app (SEO + semántica de los 404).
3. Ampliar el reporte: agregados por precio (valor del catálogo por procedencia) o rango de fechas.
4. Abrir `/productos` al listado general con filtro por `origin` (hoy es solo Hazlo Sano, por diseño).

### Adenda — navegación admin y 404 reales (2026-07-24)

Se cerraron los dos follow-ups abiertos del Slice 3 (opciones 1 y 2 de arriba).

**Navegación:** `Header` (server component, ya tenía la sesión) calcula `isAdmin(session?.user?.email)`
y lo pasa a `Nav` y `MobileNav`, que muestran una entrada **"Reporte"** → `/admin/productos` solo para
admins. Es únicamente visibilidad: el gate real sigue siendo el de la página (mismo criterio que el
selector de procedencia del Slice 1). El e2e lo verifica en ambos sentidos: el admin ve el enlace, el
no-admin no.

**El 404 que respondía 200 — causa raíz.** No era next-intl: era **streaming**. Dos boundaries hacían
que la respuesta se enviara (con status 200) antes de que `notFound()` decidiera:
1. `src/app/loading.tsx` y `src/app/[locale]/loading.tsx` — un `loading.tsx` envuelve todo el segmento
   en `<Suspense>`, así que el shell se manda de inmediato y el status ya no se puede cambiar. Afectaba
   a **todas** las rutas (`/page/9999`, `/productores-locales`, `/admin/productos`…).
2. El `<Suspense>` de `[locale]/[slug]/page.tsx`: el `notFound()` del post inexistente vivía dentro de
   `PostDetail`, o sea dentro del boundary.

**Fix:**
- Se eliminaron los dos `loading.tsx` globales (eran un `<h2>Cargando...</h2>`, poco valor a cambio de
  romper el status de toda la app). **Trade-off:** ya no hay feedback global de navegación; si se
  quiere de vuelta, debe ir en segmentos que no decidan 404.
- `[locale]/[slug]`: la búsqueda se movió a `data.ts` (`getPostDetails` → `Post | null`) y el
  `notFound()` a la página, **fuera** del `<Suspense>`. `PostDetail` pasó a recibir el post ya cargado
  y dejó de ser async (UI más tonta, que además es lo que pedían las reglas del repo). Se perdió el
  `PostDetailSkeleton` de esa ruta: el precio de un status correcto.
- Regresión cubierta por `e2e/notFound/notFound.spec.ts`: publicación inexistente → **404**, página
  fuera de rango → **404**, y no-admin en `/admin/productos` → **404** sin reporte.

**Validaciones:** `test:run` ✅ 102/102 · `typecheck` ✅ · `lint` ✅ · **e2e ✅ 10 passed, 3 skipped**
(antes 7 passed: +3 escenarios de 404). Verificado además contra el dev server: `/productos`, `/` y los
detalles siguen en 200.
