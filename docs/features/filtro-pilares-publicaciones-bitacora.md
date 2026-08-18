# Bitacora - Filtro de pilares en listados de publicaciones

## 2026-08-17 - Slice 1

### Objective

Hacer que los listados publicos principales y la busqueda rapida del Header muestren y apliquen el
modelo de cuatro pilares, para que el sitio no se lea como un simple listado de comida.

### Decisions + Rationale

- El estado del filtro vive en `pillar` en la URL. Esto permite compartir enlaces, volver con el
  navegador y conservar el filtro al paginar.
- El modelo de pilares vive en dominio, no en componentes, porque tambien lo consumen repositorios,
  casos de uso, API routes y UI.
- La seleccion de pilar se traduce a categorias raiz y sus descendientes usando la taxonomia activa.
  Asi el filtro incluye subcategorias sin codificar listas paralelas.
- El control visual es compartido (`PublicationPillarFilter`) y se inserta en cada listado publico
  principal. Eso evita que home, productos, busqueda, tienda y perfil diverjan.
- La busqueda rapida del Header lee el pilar activo de la URL mediante un wrapper cliente
  (`HeaderSearchBar`) y envia ese filtro tanto al endpoint de sugerencias como a "Ver todos".
- Los estados vacios mencionan el pilar seleccionado para que una lista vacia no parezca error.

### Files Touched

- Documentacion y especificacion:
  - `docs/features/filtro-pilares-publicaciones.md`
  - `src/e2e/publicationPillarFilter/publicationPillarFilter.feature`
  - `src/e2e/publicationPillarFilter/publicationPillarFilter.spec.ts`
- Dominio y adaptadores:
  - `src/domain/entities/post/publicationPillars.ts`
  - `src/infra/dataAccess/posts/publicationPillarFilter.ts`
  - `src/infra/dataAccess/posts/IPostQueryRepository.ts`
  - `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`
  - `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts`
- Casos de uso y API:
  - `src/use_cases/searchPosts/SearchPostsUseCase.ts`
  - `src/use_cases/searchPosts/dtos/ISearchPostDTO.ts`
  - `src/use_cases/searchPosts/ports/ISearchPostRepository.ts`
  - `src/app/api/posts/[...pagination]/route.ts`
  - `src/app/api/search/route.ts`
- Paginas/listados:
  - `src/app/[locale]/page.tsx`
  - `src/app/[locale]/page/[page]/page.tsx`
  - `src/app/[locale]/productos/data.ts`
  - `src/app/[locale]/productos/page.tsx`
  - `src/app/[locale]/productos/page/[page]/page.tsx`
  - `src/app/[locale]/productos/ui/ProductsList.tsx`
  - `src/app/[locale]/categoria/[key]/data.ts`
  - `src/app/[locale]/categoria/[key]/page.tsx`
  - `src/app/[locale]/categoria/[key]/page/[page]/page.tsx`
  - `src/app/[locale]/categoria/[key]/ui/CategoryPosts.tsx`
  - `src/app/[locale]/buscar/data.ts`
  - `src/app/[locale]/buscar/page.tsx`
  - `src/app/[locale]/buscar/[term]/page/[page]/page.tsx`
  - `src/app/[locale]/tienda/[slug]/data.ts`
  - `src/app/[locale]/tienda/[slug]/page.tsx`
  - `src/app/[locale]/tienda/[slug]/page/[page]/page.tsx`
  - `src/app/[locale]/tienda/[slug]/ui/StoreCatalog.tsx`
  - `src/app/[locale]/u/[username]/data.ts`
  - `src/app/[locale]/u/[username]/page.tsx`
  - `src/app/[locale]/u/[username]/page/[page]/page.tsx`
  - `src/app/[locale]/u/[username]/ui/ProfilePublications.tsx`
  - `src/app/(home)/PostsWithLoadMore.tsx`
- Presentacion e i18n:
  - `src/presentation/post/PublicationPillarFilter.tsx`
  - `src/presentation/post/publicationPillarEmptyMessage.ts`
  - `src/presentation/search/HeaderSearchBar.tsx`
  - `src/presentation/search/SearchBar.tsx`
  - `src/presentation/chrome/Header/Header.tsx`
  - `src/presentation/navigation/Pagination.tsx`
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
- Pruebas unitarias/componentes:
  - `src/domain/entities/post/publicationPillars.test.ts`
  - `src/presentation/post/PublicationPillarFilter.test.tsx`
  - `src/presentation/post/publicationPillarEmptyMessage.test.ts`
  - `src/presentation/search/SearchBar.test.tsx`
  - `src/presentation/navigation/Pagination.test.tsx`
  - `src/app/(home)/PostsWithLoadMore.test.tsx`
  - `src/app/[locale]/productos/ui/ProductsList.test.tsx`
  - `src/use_cases/searchPosts/SearchPostsUseCase.test.ts`

### Key Commands

- `pnpm exec vitest --run --reporter=json --outputFile=.tmp/vitest-results.json`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec biome check --write ...`
- `pnpm run test:e2e:run` fue iniciado y luego detenido a peticion del usuario antes de tomarlo
  como validacion.

### Validation Results

- Vitest: 616 archivos de prueba pasaron; 1891 tests pasaron; 0 fallos.
- Typecheck: `tsc` paso.
- Lint: Biome reviso 901 archivos; 0 errores; 0 fixes pendientes.
- E2E: pendiente. El usuario pidio ejecutar Playwright despues de probar manualmente. Los procesos
  de Playwright/Next que quedaron del intento interrumpido fueron detenidos.

### Deviations From Roadmap

- No se corrio la suite e2e hasta verde dentro de este slice porque el usuario cambio la
  validacion: primero hara prueba manual y despues ejecutara e2e.
- Se agrego `data-testid="search-dropdown"` al desplegable del buscador para que la e2e compruebe
  el resultado filtrado del Header sin confundirse con contenido visible del feed.

### Follow-Ups

- Ejecutar `pnpm run test:e2e:run` despues de la prueba manual.
- Si la DB e2e no tiene activas las categorias raiz de los pilares, correr o revisar el seed de
  subcategorias antes de validar Playwright.
- Considerar Slice 2 para enlaces editoriales desde `/pilares` hacia listados filtrados.

### Recap

El slice 1 dejo implementado un filtro compartido por pilares en home, home paginado, productos,
categoria, busqueda, tienda y perfil publico. El parametro `pillar` viaja por paginacion, carga
incremental, endpoint de busqueda y busqueda rapida del Header. La validacion de unidad, componentes,
typecheck y lint paso; la validacion e2e queda pendiente por decision del usuario.

### Proximos pasos (opciones)

- Opcion A: probar manualmente el flujo en home, productos, busqueda y Header, y luego ejecutar
  `pnpm run test:e2e:run`.
- Opcion B: si algo se siente visualmente pesado, ajustar solo el componente
  `PublicationPillarFilter` sin tocar el contrato de URL ni repositorios.
- Opcion C: avanzar al Slice 2 y crear entradas editoriales desde `/pilares` hacia los listados
  filtrados.

## 2026-08-17 - Ajuste posterior: remount del feed al cambiar pilar

### Objective

Corregir el caso reportado manualmente donde el home parecia no filtrar por pilar aunque la URL ya
incluyera `pillar`.

### Decisions + Rationale

- La consulta del servidor ya recibia `currentPillar` y resolvia `categoryKeys`, asi que el problema
  no estaba en SQL ni en el mapeo de pilares.
- El feed del home acumula publicaciones en estado de cliente para soportar `Cargar mas`. Ese estado
  ya se reiniciaba cuando cambiaba la ubicacion, pero no cuando cambiaba el pilar.
- Se extrajo `homeFeedKey(visitor, currentPillar)` para que la regla de remount quede nombrada y
  probada: el estado acumulado se invalida por ubicacion o por pilar activo.

### Files Touched

- Home:
  - `src/app/[locale]/page.tsx`
  - `src/app/(home)/homeFeedKey.ts`
- Pruebas:
  - `src/app/(home)/PostsWithLoadMore.test.tsx`

### Key Commands

- `pnpm exec biome check --write 'src/app/(home)/homeFeedKey.ts' 'src/app/[locale]/page.tsx' 'src/app/(home)/PostsWithLoadMore.test.tsx'`
- `pnpm exec vitest --run 'src/app/(home)/PostsWithLoadMore.test.tsx'`
- `pnpm run typecheck`
- `pnpm run lint`

### Validation Results

- Vitest focalizado: 1 archivo paso; 7 tests pasaron; 0 fallos.
- Typecheck: `tsc` paso.
- Biome focalizado en los archivos tocados: paso con advertencias existentes de imports/variables no
  usados en `src/app/[locale]/page.tsx`.
- Lint completo: pendiente de limpiar un cambio de formato ajeno al bug en
  `src/app/(home)/HomeHero.tsx`. Biome pide volver `<div className="mt-3">{locationPanel}</div>` a
  una sola linea.
- E2E: no ejecutado por decision del usuario; lo correra despues de probar manualmente.

### Deviations From Roadmap

- No se modifico el contrato de `pillar` ni el SQL. El ajuste fue solo de sincronizacion entre la
  navegacion por query params y el estado cliente acumulado del feed.

### Follow-Ups

- Probar manualmente `/?pillar=movement`, `/?pillar=sleep` y volver a `Todo`.
- Formatear `src/app/(home)/HomeHero.tsx` antes de tomar `pnpm run lint` como verde del arbol
  completo.

### Recap

El home si estaba consultando por pilar, pero al navegar entre filtros el componente cliente podia
seguir enseñando las publicaciones ya acumuladas del estado anterior. Ahora el feed se remonta cuando
cambia el pilar, por lo que toma las publicaciones filtradas que ya trae el servidor.

### Proximos pasos (opciones)

- Opcion A: probar manualmente el home cambiando entre Todo, Movimiento y Sueno.
- Opcion B: formatear `HomeHero.tsx` para recuperar `pnpm run lint` verde en todo el repo.
- Opcion C: ejecutar `pnpm run test:e2e:run` despues de la prueba manual.
