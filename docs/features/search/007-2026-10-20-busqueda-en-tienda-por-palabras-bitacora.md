# Bitácora — La búsqueda de una tienda entiende palabras sueltas

## 2026-10-20 — Slice 1: palabras sueltas en la tienda y el inventario

### Objetivo

Que el buscador del catálogo de una tienda y el del panel de inventario encuentren el producto con
las palabras que uno recuerda: en cualquier orden, a medias y sin acentos, ñ ni mayúsculas. Es lo
que ya hacía el selector de productos de la difusión.

### Decisiones y por qué

- **El mismo criterio que la difusión, sacado a un solo lugar.** `src/infra/dataAccess/db/titleWords.ts`
  junta `containsAllWords`, que ya vivía dentro de `PostgresOutreachProductFinder`, y dos piezas
  nuevas. `titleHasAllWords(term)` es el filtro del listado. `firstWordFirst(term, order)` pone
  primero lo que empieza con la primera palabra. Las palabras salen de `searchWords`, en el dominio.
  La difusión, la tienda y el inventario comparan igual.
- **Los puertos no cambian:** siguen recibiendo el término (`term: string`) y el repositorio lo parte.
  Así los casos de uso y sus fakes no se tocan.
- **Todas las palabras, no cualquiera.** Buscar más palabras tiene que traer menos resultados.
- **El orden propio de cada lista se queda detrás.** La tienda sigue por lo más reciente y el
  inventario por orden alfabético; solo se adelanta lo que empieza con la primera palabra.
- **Sin palabras, el orden queda intacto.** La primera versión mandaba un `TRUE DESC`, y Postgres
  rechaza una constante en un `ORDER BY` (`42601`). Salió en la prueba contra la base, antes del e2e.
- **Sin rescate por sentido.** Cuesta una llamada al proveedor por búsqueda; queda para después.
- **El e2e escribe con `fillWhenHydrated`.** En la corrida del arreglo de los bordes,
  «Cualquiera puede buscar en el catálogo» falló una vez porque se escribió antes de que React
  hidratara el campo.

### Archivos tocados

- Infra: `db/titleWords.ts` y su prueba (nuevos), `posts/PostgresPostQueryRepository.ts` (`termWhere`
  sustituido y `listingOrder`), `storeInventory/PostgresStoreInventoryRepository.ts` y
  `outreach/PostgresOutreachProductFinder.ts`, que ahora usa `containsAllWords`.
- E2E: `src/e2e/busquedaEnTienda/` (`.feature` y `.spec.ts`).
- Docs: el roadmap `007-2026-10-20-busqueda-en-tienda-por-palabras.md` y esta bitácora.

### Comandos clave

```sh
pnpm run test:run && pnpm run typecheck && pnpm run lint && pnpm run check:directives
# Los dos repositorios contra la base real, solo lectura:
node --env-file=.env.development node_modules/tsx/dist/cli.mjs --tsconfig tsconfig.json <scratchpad>/store-check.mts
pnpm exec playwright test src/e2e/busquedaEnTienda src/e2e/inventory/busquedaEnListas.spec.ts src/e2e/outreach --shard=1/4 --reporter=line   # …hasta 4/4, con rm -rf .next antes de cada uno
```

### Resultados

- **Vitest:** 337 archivos, 3551 pruebas en verde (5 nuevas de `titleWords`). Typecheck, lint y
  directivas limpios.
- **Contra la base real, en el inventario de Hazlo Sano:**

  | búsqueda | resultados |
  |---|---|
  | «masa madre» | 6, igual que antes |
  | «canela masa» y «madr canel» | 1, el pan de canela |
  | «pina» | 5 |
  | «SOYA» | 3 |
  | «proteina» | 30, con la Proteína de Soya primero |
  | «canela pepino» | 0 |
  | sin término | 420, sin cambios |

  En la tienda, los mismos totales.
- **Playwright:** 54 de 54 en cuatro tramos (14, 20, 10 y 10). Son los 8 escenarios nuevos, los 6 de
  `busquedaEnListas` y los 40 de la difusión, porque su buscador ahora usa `containsAllWords`.

### Desviaciones

- El `ORDER BY` con constante, corregido antes del e2e (ver arriba).
- En el registro del servidor de Playwright apareció una vez un `Failed to load external module pg-…`
  de Turbopack. No tumbó ninguna prueba.

### Escrito en recursos compartidos

- **Base compartida:** una tienda `E2E Tienda por palabras …` y cuatro publicaciones con slug `e2e-…`
  por escenario. Las borra `afterEach`, y `globalTeardown` barre lo que quede. Los títulos van sin la
  marca `E2E`, porque el escenario del orden mira cómo empiezan, así que mientras dura un escenario
  pueden aparecer en la búsqueda del sitio.
- El script de comprobación solo hizo `SELECT`, con `default_transaction_read_only`.

### Recap

El catálogo de una tienda y el panel de inventario buscan como el selector de la difusión, con una
sola pieza compartida (`titleWords`). «canela masa», «madr canel» y «pina» encuentran lo que antes
daba vacío, y lo que empieza con la primera palabra va primero. Lo que ya se encontraba no cambió.

### Próximos pasos (opciones)

1. Del usuario: probar `/tienda/hazlo-sano` con sus búsquedas de siempre.
2. Llevar a `dev` esta rama y `fix/buscadores-de-lista-visibles` (los bordes y la lupa), que siguen
   sin integrar.
3. Si hace falta, el rescate por sentido dentro de una tienda, con su costo por búsqueda.
4. La búsqueda de pedidos sigue con `ILIKE` sobre el título del artículo. Podría usar `titleWords`,
   pero no es la misma tabla.
