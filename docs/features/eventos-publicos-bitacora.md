# Bitacora - Eventos publicos

## 2026-08-18 - Slice 1: `/eventos` como agenda publica

### Objective

Darles a los eventos una ruta publica propia, separada del catalogo comercial, para que quien visita
pueda encontrar lo que ocurre por fecha sin mezclarlo con productos o servicios.

### Decisions + rationale

- `/eventos` lista solo `kind = evento`. Los productos y servicios quedan fuera porque responden a
  otra intencion: comprar o agendar.
- El orden vive en `PostgresPostQueryRepository.getEvents()`, no en la pagina. La paginacion y el
  orden deben salir de la misma consulta para no mover elementos entre paginas.
- Los eventos vigentes van antes que los pasados. `ends_at` extiende la vigencia cuando existe; sin
  `ends_at`, el evento caduca en `starts_at`, igual que la regla de dominio.
- Se reutilizo `CardForList`. Ya pinta `EventDate` y ya evita carrito en eventos, asi que crear una
  card nueva habria duplicado decisiones.
- El estado vacio se cubrio como componente porque la base compartida puede tener eventos reales; el
  e2e no debe borrar contenido ajeno para fabricar una pagina vacia.
- `/eventos` se agrego a `pathnames`, sitemap, alternates y `llms.txt`. Si la ruta es publica y
  estable, tambien debe ser descubrible.
- El enlace entro al menu de Comunidad en desktop y movil, junto a publicaciones y productos.

### Files touched

- Roadmap y specs:
  - `docs/features/eventos-publicos.md`
  - `docs/features/eventos-publicos-bitacora.md`
  - `src/e2e/eventos/eventos-publicos.feature`
  - `src/e2e/eventos/eventos-publicos.spec.ts`
- Ruta `/eventos`:
  - `src/app/[locale]/eventos/page.tsx`
  - `src/app/[locale]/eventos/page/[page]/page.tsx`
  - `src/app/[locale]/eventos/data.ts`
  - `src/app/[locale]/eventos/metadata.ts`
  - `src/app/[locale]/eventos/ui/EventsList.tsx`
  - `src/app/[locale]/eventos/ui/EventsList.test.tsx`
- Infra y routing:
  - `src/infra/dataAccess/posts/IPostQueryRepository.ts`
  - `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`
  - `src/i18n/routing.ts`
- Navegacion, SEO e i18n:
  - `src/presentation/chrome/Header/Nav.tsx`
  - `src/presentation/chrome/Header/MobileNav.tsx`
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
  - `src/domain/seo/sitemap.ts`
  - `src/domain/seo/sitemap.test.ts`
  - `src/infra/UI/metadata/alternates.test.ts`
  - `src/app/llms.txt/route.ts`

### Key commands

- `pnpm exec vitest --run src/app/[locale]/eventos/ui/EventsList.test.tsx`
- `pnpm exec vitest --run src/app/[locale]/eventos/ui/EventsList.test.tsx src/domain/seo/sitemap.test.ts src/infra/UI/metadata/alternates.test.ts`
- `pnpm exec biome check src/app/[locale]/eventos src/e2e/eventos/eventos-publicos.spec.ts src/e2e/eventos/eventos-publicos.feature src/infra/dataAccess/posts/IPostQueryRepository.ts src/infra/dataAccess/posts/PostgresPostQueryRepository.ts src/i18n/routing.ts src/domain/seo/sitemap.ts src/domain/seo/sitemap.test.ts src/app/llms.txt/route.ts src/infra/UI/metadata/alternates.test.ts src/presentation/chrome/Header/Nav.tsx src/presentation/chrome/Header/MobileNav.tsx src/i18n/messages/es.json src/i18n/messages/en.json`
- `pnpm run typecheck`
- `pnpm exec playwright test src/e2e/eventos/eventos-publicos.spec.ts --reporter=line`
- `pnpm run test:run`
- `pnpm run lint`

### Validation results

- Componente/SEO focal: 3 files, 38 tests passed.
- Typecheck: passed.
- E2E focal de eventos publicos: 2 tests passed. Escribio 4 publicaciones de prueba con prefijo de
  suite y las borro en `afterEach`.
- Vitest completo: 181 files, 1910 tests passed.
- Lint: 911 files checked.

### Deviations from roadmap

- El primer intento de Playwright dentro del sandbox no fue diagnostico funcional: hizo timeout con
  `EACCES`/`ETIMEDOUT` contra PostgreSQL. Se repitio fuera del sandbox y paso.
- Despues de esa corrida, el usuario aclaro la regla operativa: e2e focales si; suite e2e completa
  solo cuando la pida explicitamente.
- El estado vacio se movio a `@component` por seguridad contra la base compartida.

### Follow-ups

- Slice 2: convertir `/productos` en "Productos y servicios" manteniendo la URL y listando
  `producto + servicio`.
- Decidir si el home debe destacar proximos eventos o si `/eventos` basta como superficie publica.
- Mantener e2e focales para los cambios siguientes y no correr la suite e2e completa hasta que el
  usuario lo indique.

### Recap

`/eventos` ya existe como agenda publica localizada (`/eventos` y `/en/events`), usa una consulta
propia de eventos ordenada por fecha, reutiliza las cards existentes y esta enlazada desde Comunidad.
La ruta tambien quedo declarada para metadata, sitemap, alternates y `llms.txt`.

### Próximos pasos (opciones)

- Opcion A: implementar el slice 2 para que `/productos` liste productos y servicios.
- Opcion B: revisar visualmente `/eventos` en local antes de tocar `/productos`.
- Opcion C: dejar `/eventos` como esta y abrir otro ajuste de navegacion/SEO si aparece una ruta
  mejor para promocionarla.

## 2026-08-18 - Slice 2: `/productos` lista productos y servicios

### Objective

Hacer que la superficie comercial del sitio diga la verdad completa: no solo productos que se
entregan, tambien servicios que se agendan.

### Decisions + rationale

- La URL `/productos` se conserva. Cambiarla rompería enlaces y posicionamiento; lo que cambia es
  el significado visible de la pagina a "Productos y servicios".
- La consulta de `getProducts()` ahora usa `SELLABLE_KINDS`, no un `IN` escrito a mano. El dominio
  ya habia decidido que `producto` y `servicio` son vendibles; la base de lectura solo refleja esa
  regla.
- Los eventos siguen fuera de `/productos`. Tienen `/eventos`, ordenado por fecha, porque asistir a
  algo no es comprar inventario ni agendar un servicio personal.
- No se creo una card nueva. `CardForList` ya separa producto/carrito y servicio/agenda, asi que el
  listado solo tenia que dejar entrar servicios.
- Los textos de navegacion, titulo, descripcion y vacio pasan a "Productos y servicios" para no
  prometer solo mercancía.

### Files touched

- Specs:
  - `src/e2e/eventos/eventos-publicos.feature`
  - `src/e2e/products/products.spec.ts`
  - `src/e2e/products/ProductsPage.ts`
  - `src/app/[locale]/productos/ui/ProductsList.test.tsx`
- Infra:
  - `src/infra/dataAccess/posts/IPostQueryRepository.ts`
  - `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`
- Textos y roadmap:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
  - `docs/features/eventos-publicos.md`
  - `docs/features/eventos-publicos-bitacora.md`

### Key commands

- `pnpm exec vitest --run src/app/[locale]/productos/ui/ProductsList.test.tsx`
- `pnpm exec vitest --run src/app/[locale]/productos/ui/ProductsList.test.tsx src/presentation/post/CardForList/CardForList.test.tsx`
- `pnpm exec biome check src/e2e/products/ProductsPage.ts src/e2e/products/products.spec.ts src/e2e/eventos/eventos-publicos.feature src/app/[locale]/productos/ui/ProductsList.test.tsx src/infra/dataAccess/posts/IPostQueryRepository.ts src/infra/dataAccess/posts/PostgresPostQueryRepository.ts src/i18n/messages/es.json src/i18n/messages/en.json`
- `pnpm run typecheck`
- `pnpm exec playwright test src/e2e/products/products.spec.ts --config playwright.reuse.config.ts --reporter=line`
- `pnpm run test:run`
- `pnpm run lint`

### Validation results

- Componente focal inicial: fallo esperado por texto vacio todavia antiguo.
- Componentes focales finales: 2 files, 31 tests passed.
- Typecheck: passed.
- E2E focal de `/productos`: 2 tests passed. El spec siembra producto, servicio, evento y anuncio
  con prefijo de suite; los borra en `afterEach`.
- Vitest completo: 181 files, 1910 tests passed.
- Lint: 911 files checked.

### Deviations from roadmap

- El primer intento de e2e focal no arranco porque `localhost:3000` ya estaba ocupado por un
  `next dev` de este mismo repo. No se mato el proceso; se uso un config temporal con
  `reuseExistingServer: true`, se corrio el spec focal y luego se borro el archivo temporal.
- No se corrio la suite e2e completa por instruccion del usuario. Solo se corrio el spec focal de
  productos.

### Follow-ups

- Revisar si el reporte admin `/admin/productos` debe seguir siendo estrictamente de productos por
  procedencia o si necesita una lectura separada para servicios.
- Evaluar si conviene cambiar nombres internos (`getProducts`, `ProductsList`) a "commercial" en un
  refactor sin comportamiento, para no mezclar ese ruido con el cambio funcional.
- Cuando el usuario lo indique, correr la suite e2e completa.

### Recap

`/productos` conserva su URL, pero ya funciona como catalogo comercial: lista productos y servicios,
mantiene fuera anuncios y eventos, y deja que la card haga lo correcto en cada caso: carrito para
producto, agenda para servicio. Los textos publicos ahora dicen "Productos y servicios".

### Próximos pasos (opciones)

- Opcion A: revisar manualmente `/productos` y `/eventos` con el servidor local que ya esta
  levantado.
- Opcion B: hacer un refactor de nombres internos de productos a catalogo comercial.
- Opcion C: correr la suite e2e completa cuando el usuario lo pida.

---

## 2026-08-18 - Slice 3: Fechas por zona del publicador al publicar y editar eventos

### Objective

Corregir que las fechas de inicio y fin de un evento se guardaran o se mostraran corridas por
depender de `new Date(datetime-local)`. Ese valor del navegador no trae zona horaria; el formulario
ahora manda la zona IANA del navegador y la Server Action la usa para convertir a UTC antes de
persistir.

### Decisions + rationale

- La conversion quedo en `domain/schedule/localDateTime`. Es logica pura, reutilizable y probada sin
  depender del timezone de la maquina.
- `PublishForm` y `EditPostForm` mandan un `timeZone` oculto tomado de
  `Intl.DateTimeFormat().resolvedOptions().timeZone`. Si no existe o es invalido, se cae a
  `America/Mexico_City`.
- Publicar y editar llaman el mismo parser por zona IANA. La edicion tambien usa el formateador
  inverso para que el input vuelva a mostrar la hora local que corresponde al navegador.
- La base sigue guardando UTC. El cambio no guarda la zona como columna; solo evita que el servidor
  interprete el texto local como UTC o como su propia zona.
- El e2e de tipos de publicacion dejo de convertir con la zona local del runner y ahora compara con
  la misma regla de formato, evitando falsos verdes o falsos rojos segun donde corra Playwright.

### Files touched

- Dominio:
  - `src/domain/schedule/localDateTime.ts`
  - `src/domain/schedule/localDateTime.test.ts`
  - `src/domain/schedule/timezone.ts`
- Publicar y editar:
  - `src/app/[locale]/publicar/actions.ts`
  - `src/app/[locale]/publicar/PublishForm.tsx`
  - `src/app/[locale]/publicar/PublishForm.test.tsx`
  - `src/app/[locale]/editar/[slug]/actions.ts`
  - `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
  - `src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- Presentacion compartida:
  - `src/presentation/post/EventTimeZone/EventTimeZoneField.tsx`
- E2E y docs:
  - `src/e2e/editPublicationTypes/editPublicationTypes.spec.ts`
  - `docs/features/eventos-publicos.md`
  - `docs/features/eventos-publicos-bitacora.md`

### Key commands

- `pnpm exec vitest --run src/domain/schedule/localDateTime.test.ts src/app/[locale]/publicar/PublishForm.test.tsx src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- `pnpm exec biome check src/domain/schedule/timezone.ts src/domain/schedule/localDateTime.ts src/domain/schedule/localDateTime.test.ts src/presentation/post/EventTimeZone/EventTimeZoneField.tsx src/app/[locale]/publicar/PublishForm.tsx src/app/[locale]/publicar/PublishForm.test.tsx src/app/[locale]/publicar/actions.ts src/app/[locale]/editar/[slug]/actions.ts src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`

### Validation results

- Vitest focal: 3 files, 24 tests passed.
- Vitest completo: 190 files, 1961 tests passed.
- Typecheck: passed.
- Lint: 935 files checked.
- E2E completo: no corrido por instruccion previa del usuario; queda para el cierre de todos los
  slices o en shards cuando se pida.

### Deviations from roadmap

- Este fue un slice correctivo detectado despues de la entrega de eventos publicos y asistencia.
- La primera version asumio zona comunitaria fija. Se corrigio en el mismo slice a zona del
  publicador porque el `datetime-local` expresa la hora elegida por la persona en su navegador.
- No agrego migraciones ni cambia el contrato de base de datos.

### Follow-ups

- Si despues se necesita mostrar siempre la hora original del publicador a cualquier visitante,
  persistir `event_time_zone` en `posts`. Hoy solo se usa para convertir al guardar/editar.
- Correr el shard e2e de edicion de tipos cuando se habilite la validacion e2e por shards.

### Recap

Publicar y editar eventos ya leen `datetime-local` con la zona del navegador y guardan el instante
UTC correcto. Un evento publicado desde `America/Mexico_City` para viernes 22 a las 05:59 queda como
viernes 22 a las 11:59Z en la base, no como jueves 21 a las 23:59 al mostrarse en Mexico.

### Próximos pasos (opciones)

- Opcion A: correr el shard e2e de `editPublicationTypes` cuando quieras validar en navegador.
- Opcion B: seguir con el siguiente slice funcional de eventos.
- Opcion C: revisar manualmente publicar/editar un evento en local y confirmar la hora en la ficha.
