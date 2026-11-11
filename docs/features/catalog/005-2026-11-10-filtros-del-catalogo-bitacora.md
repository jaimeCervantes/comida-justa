# Bitácora — Un solo conjunto de filtros para todos los listados

## 2026-11-10 — Slice 1: la barra única, con existencias, en categoría y búsqueda

### Objetivo

Que una categoría deje esconder lo agotado, como ya hacía la búsqueda, y que eso salga de una
barra de filtros compartida y no de una cuarta copia.

### Decisiones

- **Una barra, no un chip más.** El usuario pidió primero el filtro en categoría y, al ver la tabla
  de qué tenía cada listado, «un solo conjunto de filtros para todo». Por eso el slice 1 ya entrega
  `ListingFilterBar` (pilares + interruptores) y no solo el chip: los slices 2–4 la montan en el
  resto de las pantallas.
- **Cambiar un filtro no suelta otro.** `listingQuery` parte de la dirección completa y pisa solo
  lo que cambia; `page` se cae siempre. `PublicationPillarFilter` usa ahora esa misma función en
  lugar de su `queryForPillar` privado.
- **Una regla SQL** (`inStockWhere`) para el listado común, la tienda y la búsqueda: sale el
  producto agotado; lo que no se vende por piezas se queda. La búsqueda usaba `is_available IS
  TRUE` a secas; con los datos de hoy da lo mismo (los 22 `is_available = false` son todos
  productos), pero la regla nueva lo dice a propósito y no por casualidad, y es la que necesitarán
  el home y el perfil, que mezclan anuncios y eventos.
- **El parámetro sigue siendo `disponibles`** —el que estrenó la búsqueda—, ahora en el dominio
  (`catalogFilters.ts`), para que un enlace copiado signifique lo mismo en cualquier listado.
- **La búsqueda conserva su contrato de pruebas**: `search-facets`, `facet-only-available`,
  `facet-pillar-*` siguen existiendo vía `testIdPrefix`/`testId`. `SearchFacets.tsx` desaparece.
- **«En promoción» de `/productos` ya usa `ToggleFilterChip`**, así que gana la casilla ✓ que tenía
  el de la búsqueda. Mudarlo a la barra es el slice 4.
- **Vacío por filtro ≠ categoría vacía**: con el filtro y sin resultados se dice que no hay nada
  con existencia y se ofrece la misma categoría sin el filtro, no el catálogo completo.
- **Datos del e2e**: `salsas_y_aderezos`, la única categoría útil vacía en la base compartida
  (consultado en lectura el 2026-11-10). El listado pagina de 4 en 4 y ordena por cercanía; en una
  categoría poblada lo sembrado caería en otra página.

### Archivos

- Dominio: `domain/entities/post/catalogFilters.ts` (+ test).
- Infra: `infra/dataAccess/posts/inStockWhere.ts` (nuevo), `IPostQueryRepository.ts`,
  `PostgresPostQueryRepository.ts`, `searchPosts/PostgresSearchPostRepository.ts`.
- Presentación: `presentation/post/ListingFilters/` (nuevo: `ListingFilterBar`, `ToggleFilterChip`,
  `filterChip`, `listingQuery`, test), `PublicationPillarFilter.tsx`.
- Rutas: `categoria/[key]/{data.ts,page.tsx,page/[page]/page.tsx,ui/CategoryPosts.tsx}`,
  `buscar/{page.tsx,ui/SearchSummary.tsx}` (y se borra `ui/SearchFacets.tsx`),
  `productos/ui/ProductsList.tsx`.
- i18n: namespace `listingFilters`; `category.emptyOnlyAvailable*` y `seeAllCategory`; se quitan
  `search.facetPillar|facetAvailability|facetOnlyAvailable`.
- E2E: `e2e/filtrosDelCatalogo/filtrosDelCatalogo.{feature,spec.ts}`.

### Comandos y resultados

- `pnpm run test:run` → 352 archivos, **3726/3726**.
- `pnpm run typecheck` → limpio. `pnpm run lint` → 1511 archivos, sin cambios.
- `pnpm exec playwright test src/e2e/filtrosDelCatalogo src/e2e/busquedaFacetada
  src/e2e/listadosCompactos src/e2e/promociones src/e2e/publicationPillarFilter` en 3 tramos (41
  escenarios): **40 verdes, 1 rojo**. Los 4 del slice, los 8 de búsqueda facetada, los de
  promociones y los de pilares, verdes.
- El rojo es `listadosCompactos/tarjetaCompacta.spec.ts:37` y **no lo causa este slice**: toma la
  primera tarjeta de buscar «proteína» y espera su botón de carrito; hoy esa primera tarjeta en la
  base compartida es «Falcon Protein – Proteína Vegana en Polvo – Chocolate 1.8 kg», que está
  agotada y por eso no tiene botón. Se reprodujo aislado. La búsqueda sin filtro no cambió de
  regla ni de orden.

### Desviaciones

- El roadmap original tenía solo la categoría; se amplió a la barra única el mismo día, a pedido
  del usuario.
- Primera corrida: el tramo 2 no arrancó porque el servidor del tramo 1 aún ocupaba el 3000; se
  repitieron los tramos 2 y 3 esperando a que se liberara.

### Recap

`/categoria/[key]` tiene «Solo con existencia» (`?disponibles=1`) dentro de `ListingFilterBar`,
que también pinta las facetas de `/buscar`. Pilar, existencia y paginación se conservan entre sí. La
regla de existencia vive en `inStockWhere` y la comparten listados, tienda y búsqueda. `/productos`
usa el mismo chip para «En promoción», pero todavía no la barra.

### Próximos pasos (opciones)

1. **Slice 2**: tienda (enseñar lo agotado a quien visita + barra) y perfil.
2. **Slice 3**: home y productos vía la barra del chrome; arregla que elegir pilar en `/productos`
   suelte `promocion`.
3. **Slice 4**: «En promoción» en la barra para todos.
4. Pendiente aparte (decide el usuario): volver robusto `tarjetaCompacta.spec.ts:37`, que hoy
   depende de que la primera proteína de la base compartida tenga existencia — por ejemplo,
   sembrando su propio producto con piezas.

## 2026-11-11 — Slice 2: tienda y perfil

### Objetivo

Que la tienda enseñe todo su catálogo a quien visita —lo agotado con su insignia— y deje decidir
con la misma barra; y que el perfil tenga esa barra también.

### Decisiones

- **La tienda ya no decide por quien mira.** `getPostsBySeller` cambia `includeSoldOut` (que valía
  `true` solo para el dueño) por `onlyAvailable`, que viene de la dirección. Con eso
  `getStoreByHandle` deja de necesitar `viewerId`, y `tienda/[slug]/page.tsx` deja de llamar a
  `auth()` solo para eso.
- **Tienda y perfil pasan el filtro a `getPaginatedPosts`**, la misma vía que la categoría, en vez
  de pegar `inStockWhere` a su `WHERE`: una sola entrada para la regla.
- **Búsqueda por palabras y filtros viajan juntos.** La barra recibe `query={{ q: term }}`;
  `StoreSearchField` arma su dirección con `listingQuery` y manda `disponibles` oculto para el envío
  con Enter; la paginación lleva pilar, filtro y término.
- **Vacío por filtro**: tienda y perfil dicen `listingFilters.nothingInStock` («Apaga «Solo con
  existencia» para ver también lo agotado»). Sin botón propio, a diferencia de la categoría: el chip
  de la barra, justo encima, ya es el camino de vuelta. Si hay término, gana «no hay nada que
  coincida».
- **E2E con dueño ajeno**: la tienda es de otra cuenta, así que quien la abre sin sesión es un
  visitante de verdad. El perfil es el de la cuenta de la suite con una dirección prestada y
  devuelta en `afterEach`.

### Archivos

- Infra: `IPostQueryRepository.ts`, `PostgresPostQueryRepository.ts`.
- Tienda: `tienda/[slug]/{data.ts,page.tsx,page/[page]/page.tsx,ui/StoreCatalog.tsx,ui/StoreSearchField.tsx}`.
- Perfil: `u/[username]/{data.ts,page.tsx,page/[page]/page.tsx,ui/ProfilePublications.tsx}`.
- i18n: `listingFilters.nothingInStock` (es/en).
- E2E: `filtrosDelCatalogo.feature` (escenarios del slice 2 detallados) y
  `filtrosDelCatalogo/tiendaYPerfil.spec.ts` (nuevo).

### Comandos y resultados

- `pnpm run test:run` → 352 archivos, **3726/3726**.
- `pnpm run typecheck` → limpio. `pnpm run lint` → 1512 archivos, sin cambios.
- `pnpm exec playwright test src/e2e/filtrosDelCatalogo src/e2e/busquedaEnTienda
  src/e2e/inventory/busquedaEnListas.spec.ts src/e2e/inventory/existenciasEnLaTarjeta.spec.ts
  src/e2e/publicationPillarFilter` en 2 tramos, limpiando `.next` antes de cada uno: **29/29**
  (15 + 14), incluidos los 3 nuevos.

### Desviaciones

- La primera vez el 3000 estaba ocupado por el `next dev` del usuario; no se tocó `.next` ni se
  levantó Playwright hasta que lo detuvo.

### Recap

`ListingFilterBar` ya está en categoría, búsqueda, tienda y perfil. La tienda enseña lo agotado a
todos y «Solo con existencia» (`?disponibles=1`) lo esconde; en la tienda se combina con la búsqueda
por palabras y con el pilar, también al paginar y al buscar con Enter. Faltan home y `/productos`
(barra del chrome) y «En promoción» en la barra.

### Próximos pasos (opciones)

1. **Slice 3**: home y productos vía la barra del chrome (`NearbyPillarFilter`), con el filtro en
   «Cargar más»; arregla que elegir pilar en `/productos` suelte `promocion`.
2. **Slice 4**: «En promoción» en la barra para todos.
3. Pendiente aparte (decide el usuario): volver robusto `tarjetaCompacta.spec.ts:37`.

## 2026-11-11 — Slice 3: home y productos (la barra del chrome)

### Objetivo

Que `/` y `/productos` tengan «Solo con existencia» donde ya tenían el pilar —la barra de cercanía
del chrome— y que elegir un pilar en `/productos` deje de soltar `promocion`.

### Decisiones

- **La barra se parte en chips y superficie.** `ListingFilterChips` (rótulos, pilares, separador,
  interruptor) es lo compartido; `ListingFilterBar` lo envuelve en su tarjeta para las pantallas que
  lo montan bajo su título, y `NearbyPillarFilter` lo monta tal cual en la fila del chrome, que ya
  tiene su propio `overflow-x`. Las pruebas de «una sola fila» de `nearbyBar.spec.ts` siguen verdes.
- **El chrome parte de toda la dirección** (`Object.fromEntries(searchParams)`), no solo de
  `pillar`: así elegir un pilar en `/productos` conserva `promocion`, `marca` y `tienda`.
- **El feed del home lleva el filtro a todas partes**: a `getMultiplePosts`, a `/api/posts/…`
  («Cargar más»), a los enlaces SEO de paginación y a `/page/[page]`, que cambia su filtro de
  pilares suelto por `ListingFilterBar`. `homeFeedKey` incluye el filtro: otro filtro, otra lista,
  sin tarjetas del anterior. Los filtros del fetch salen de una función fuera del componente para no
  recrear el observador del scroll en cada render.
- **`/productos`**: `CatalogFilters.onlyAvailable` llega a `getProducts`; la lista lo conserva al
  paginar y al cambiar sus chips, y su `listingQuery` local ahora usa el compartido. Vacío solo por
  existencia → `listingFilters.nothingInStock`.
- **E2E por forma, no por contenido**: home y productos enseñan lo que publique la comunidad, así
  que se afirma que ninguna tarjeta lleva la insignia de agotado; en el home, además, que un
  producto agotado recién sembrado desaparece y que la petición de la página 2 lleva
  `disponibles=1`.
- **Nuevo slice 5** en el roadmap, a pedido del usuario: búsqueda por palabras en el perfil
  («Mis publicaciones» es el mismo `/u/[username]`).

### Archivos

- Presentación: `ListingFilters/ListingFilterChips.tsx` (nuevo), `ListingFilterBar.tsx`,
  `location/NearbyPillarFilter.tsx` (+ test).
- Infra: `PostgresPostQueryRepository.ts` (`getMultiplePosts`, `getProducts`).
- Home: `[locale]/page.tsx`, `[locale]/page/[page]/page.tsx`, `(home)/PostsWithLoadMore.tsx`
  (+ test), `(home)/homeFeedKey.ts`, `api/posts/[...pagination]/route.ts`.
- Productos: `productos/{data.ts,page.tsx,page/[page]/page.tsx,ui/ProductsList.tsx}`.
- Docs/E2E: roadmap (slice 3 detallado, slice 5 nuevo), `filtrosDelCatalogo.feature`,
  `filtrosDelCatalogo/homeYProductos.spec.ts` (nuevo).

### Comandos y resultados

- `pnpm run test:run` → 352 archivos, **3731/3731** (5 nuevas).
- `pnpm run typecheck` → limpio. `pnpm run lint` → 1514 archivos, sin cambios.
- `pnpm exec playwright test src/e2e/filtrosDelCatalogo src/e2e/chrome/nearbyBar.spec.ts
  src/e2e/publicationPillarFilter src/e2e/promociones` en 4 tramos: **50/50** (15 + 11 + 12 + 12).

### Desviaciones

- Primera corrida: el `next dev` del usuario tomó el 3000 a mitad y ningún tramo arrancó. El script
  esperaba 2 min y luego **borraba `.next` igual**, con su servidor vivo; se le avisó. La corrida
  buena aborta sin tocar `.next` si el puerto está ocupado.

### Recap

Los seis listados usan los mismos chips: categoría, búsqueda, tienda y perfil dentro de
`ListingFilterBar`; home y `/productos` en la barra del chrome. «Solo con existencia» llega a todos,
incluido «Cargar más» del home, y en `/productos` cambiar de pilar ya no suelta los demás filtros.
Falta «En promoción» en la barra (slice 4) y la búsqueda en el perfil (slice 5).

### Próximos pasos (opciones)

1. **Slice 4**: «En promoción» en la barra para todos.
2. **Slice 5**: búsqueda por palabras en el perfil / «Mis publicaciones».
3. Pendiente aparte (decide el usuario): volver robusto `tarjetaCompacta.spec.ts:37`.

## 2026-11-11 — Slice 4: «En promoción» en la barra, para todos

### Objetivo

Que «En promoción» (`?promocion=1`) esté en la barra de los seis listados, como el pilar y «Solo
con existencia», y que `/productos` deje su chip propio.

### Decisiones

- **Un solo estado de filtros en el dominio** (`domain/entities/post/listingFilters.ts`):
  `parseListingFilters` lee pilar, `disponibles` y `promocion` de la dirección y
  `listingFilterParams` los escribe de vuelta. Con un tercer interruptor, cada página habría
  repetido tres parámetros; ahora las doce páginas leen una sola cosa y la pasan entera
  (`filters: ListingFilterState`) a sus datos, a la barra y a la paginación.
- **`ListingToggles` (`onlyAvailable`, `onSale`)** es lo que reciben los repositorios.
  `PostListingFilters` lo extiende; `getPostsBySeller` lo acepta; la búsqueda cambia su booleano
  posicional `onlyAvailable` por `toggles` en el puerto, el caso de uso y el repositorio.
- **Una regla SQL por interruptor**: `onSaleWhere` sale de `PostgresPostQueryRepository` a su archivo,
  junto a `inStockWhere`, y la búsqueda usa las dos (`togglesWhere`). La vigencia sigue siendo la de
  `isPromotionActive`, con piezas registradas.
- **`resolveListingFilters`** (infra) traduce el estado a `PostListingFilters`, pilar resuelto
  incluido, para que ningún `data.ts` se olvide de un interruptor.
- **Vacío por interruptor**: `filteredEmptyMessage` elige el mensaje, y la promoción manda sobre la
  existencia porque es la más estrecha. La categoría conserva su vacío con botón, y ahora también
  lo usa para la promoción.
- **La búsqueda** gana el chip «En promoción ✕» en su resumen, y una búsqueda con promoción tampoco
  se registra (`isFiltered`), igual que con pilar o existencia.
- **`/productos`**: el interruptor pasa a la barra del chrome (`filter-on-sale`). `promociones.spec.ts`
  apunta ahí. La lista solo conserva el chip de marca o tienda.
- **El home**: `homeFeedKey` incluye la promoción, y «Cargar más» manda los filtros como una cadena
  estable para no volver a montar el observador del scroll.

### Archivos

- Dominio: `listingFilters.ts` (+ test).
- Casos de uso: `searchPosts/{SearchPostsUseCase.ts,dtos/ISearchPostDTO.ts,ports/ISearchPostRepository.ts}` (+ test).
- Infra: `posts/onSaleWhere.ts` (nuevo), `posts/resolveListingFilters.ts` (nuevo),
  `IPostQueryRepository.ts`, `PostgresPostQueryRepository.ts`,
  `searchPosts/PostgresSearchPostRepository.ts`.
- Presentación: `ListingFilterChips.tsx`, `ListingFilterBar.tsx` (+ test), `filteredEmptyMessage.ts`
  (nuevo), `NearbyPillarFilter.tsx` (+ test).
- Rutas: `buscar/{page,data,ui/SearchSummary}`, `categoria/[key]/{data,page,page/[page]/page,ui/CategoryPosts}`,
  `tienda/[slug]/{data,page,page/[page]/page,ui/StoreCatalog,ui/StoreSearchField}`,
  `u/[username]/{data,page,page/[page]/page,ui/ProfilePublications}`, `[locale]/page.tsx`,
  `[locale]/page/[page]/page.tsx`, `(home)/{PostsWithLoadMore,homeFeedKey}` (+ test),
  `api/posts/[...pagination]/route.ts`, `productos/ui/ProductsList.tsx` (+ test).
- i18n: `listingFilters.onSale`, `listingFilters.nothingOnSale` (es/en).
- E2E: `filtrosDelCatalogo.feature` (slice 4 detallado), `filtrosDelCatalogo/enPromocion.spec.ts`
  (nuevo), `testUtils/seedPromotion.ts` (nuevo), `promociones/promociones.spec.ts`.

### Comandos y resultados

- `pnpm run test:run` → 353 archivos, **3744/3744**.
- `pnpm run typecheck` → limpio. `pnpm run lint` → 1521 archivos, sin cambios.
- `pnpm exec playwright test src/e2e/filtrosDelCatalogo src/e2e/promociones src/e2e/busquedaFacetada
  src/e2e/chrome/nearbyBar.spec.ts src/e2e/publicationPillarFilter
  src/e2e/inventory/busquedaEnListas.spec.ts` en 5 tramos: **67/67** (14 + 14 + 13 + 13 + 13).

### Desviaciones

- El alcance creció un poco a propósito: además del interruptor, las páginas pasaron a leer los
  filtros con `parseListingFilters`. Era la forma de no copiar un tercer parámetro en doce sitios.

### Recap

Los seis listados comparten el conjunto completo: pilar, «Solo con existencia» y «En promoción».
Se leen de la dirección con una sola función del dominio, se aplican con una regla SQL por
interruptor (también en la búsqueda) y se pintan con los mismos chips, dentro de `ListingFilterBar`
o en la barra del chrome en `/` y `/productos`. Queda el slice 5: búsqueda por palabras en el
perfil.

### Próximos pasos (opciones)

1. **Slice 5**: búsqueda por palabras en el perfil / «Mis publicaciones».
2. Abrir el PR de `feat/filtros-catalogo` hacia `dev` (cuando el usuario lo pida).
3. Pendiente aparte (decide el usuario): volver robusto `tarjetaCompacta.spec.ts:37`.
