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
