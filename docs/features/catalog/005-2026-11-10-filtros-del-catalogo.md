# Un solo conjunto de filtros para todos los listados

## Contexto

- Problem: cada listado tiene filtros distintos. La búsqueda deja quedarse con «Solo con
  existencia» pero no con «En promoción»; `/productos` tiene «En promoción» pero no existencias; una
  categoría, el home y el perfil solo tienen pilares; la tienda esconde lo agotado a quien visita y
  no deja decidir. Encima, en `/productos` elegir un pilar desde la barra del chrome suelta
  `?promocion=1`, porque esa barra no conoce los otros filtros.
- Savings: quien aprende un filtro en una pantalla lo encuentra igual en la siguiente; no se abren
  fichas que no se pueden comprar; y una sola barra en vez de tres copias que ya divergieron (clases
  on/off duplicadas, un chip con casilla y otro sin ella, un pilar que no conserva los demás).
- Why: el catálogo tiene seis puertas de entrada y deberían comportarse como una.

## El conjunto

Pilar + «Solo con existencia» (`?disponibles=1`) + «En promoción» (`?promocion=1`), en la dirección,
combinables entre sí. `/productos` conserva además su chip de marca/tienda, que llega desde el
carrusel de ofertas y no es un filtro que se elija.

## Dónde está cada filtro hoy

| Listado            | Pilar           | Solo con existencia            | En promoción |
| ------------------ | --------------- | ------------------------------ | ------------ |
| `/buscar`          | sí              | sí                             | no           |
| `/productos`       | sí (chrome)     | no                             | sí           |
| `/categoria/[key]` | sí              | no                             | no           |
| `/tienda/[slug]`   | sí              | lo agotado se esconde, sin más | no           |
| `/u/[username]`    | sí              | no                             | no           |
| `/` (home)         | sí (chrome)     | no                             | no           |

## Decisiones

- **Una barra, `ListingFilterBar`**, en `src/presentation/post/`: los pilares de
  `PublicationPillarFilter` más los interruptores, todos con un `ToggleFilterChip` (enlace con
  `aria-pressed` y casilla ✓). Cada enlace conserva el resto de la dirección: cambiar un filtro no
  suelta otro. Lo propio de una pantalla viaja como prop (las cuentas por pilar de la búsqueda, el
  término de la tienda).
- **El filtro vive en el dominio**: `catalogFilters.ts` lee y escribe `disponibles`, igual que ya
  hace con `marca` y `tienda`.
- **Una regla SQL para «con existencia»**, compartida por el listado común y por la búsqueda: un
  producto agotado sale; un anuncio, evento, servicio o práctica no se agota y se queda. Hoy la
  búsqueda usa `is_available IS TRUE` y la tienda `kind <> producto OR is_available`; dicen lo mismo
  con los datos actuales (ningún no-producto está en `false`), pero se queda la segunda, que lo dice
  a propósito.
- **La tienda enseña todo a quien visita**, con la insignia de agotado, y el filtro decide. Es un
  cambio de comportamiento pedido el 2026-11-10.

## Slices

### Slice 1 - La barra única, con existencias, en categoría y búsqueda

Scope:
- Dominio: `ONLY_AVAILABLE_QUERY_PARAM` y `parseOnlyAvailableFilter` en `catalogFilters.ts`.
- Infra: `onlyAvailable` en `PostListingFilters` / `ListingOptions` con la regla compartida;
  `getPostsByCategory` lo acepta; la búsqueda usa la misma regla.
- `ToggleFilterChip` y `ListingFilterBar` (pilar + existencia).
- `/categoria/[key]` estrena la barra; pilar y paginación conservan el filtro; con el filtro y sin
  resultados, un vacío propio que ofrece quitarlo.
- `/buscar` cambia su fila a la barra única, sin cambiar lo que hace (cuentas, `data-testid`).

Acceptance criteria:
- En `salsas_y_aderezos` (vacía en la base compartida) con «Salsa macha de cacahuate» (8 piezas) y
  «Aderezo de chipotle» (0): encender el chip deja solo la salsa y la dirección lleva
  `disponibles=1`; apagarlo enseña las dos; elegir un pilar no lo suelta; si todo está agotado, el
  vacío ofrece ver toda la categoría.
- Las pruebas de la búsqueda facetada siguen en verde.

### Slice 2 - Tienda y perfil

Scope: la tienda enseña lo agotado a quien visita y monta la barra (conservando su búsqueda por
palabras); el perfil monta la barra.

### Slice 3 - Home y productos (la barra del chrome)

Scope: `NearbyPillarFilter` pasa a montar la fila de chips de la barra única
(`ListingFilterChips`, la misma que pinta `ListingFilterBar` dentro de su superficie) en `/` y
`/productos`, y cada enlace parte de **toda** la dirección. El home lleva el filtro también a
«Cargar más» (`/api/posts/…`) y a su paginado `/page/[page]`; `/productos` y su paginado lo pasan a
`getProducts`. En `/productos`, elegir un pilar deja de soltar `promocion`, `marca` y `tienda`.

Acceptance criteria:
- En `/` con un producto recién sembrado y agotado («Miel de abeja melipona», 0 piezas): sin el
  filtro se ve con su insignia; al encenderlo desaparece, ninguna tarjeta del feed lleva la insignia
  de agotado, y la petición de «Cargar más» lleva `disponibles=1`.
- En `/productos` al encender el filtro, ninguna tarjeta lleva la insignia de agotado.
- En `/productos?promocion=1`, elegir «Alimentación» deja `pillar=nutrition` y `promocion=1`.

### Slice 4 - «En promoción» en la barra, para todos

Scope: el interruptor entra en la barra; `onSale` llega a categoría, tienda, perfil y home (el
listado común ya lo sabe filtrar) y a la búsqueda (otro repositorio, misma vigencia que
`onSaleWhere`). `/productos` deja su chip propio y usa el de la barra.

### Slice 5 - Búsqueda por palabras en el perfil

Pedido el 2026-11-11: «en mi perfil o Mis publicaciones no tiene búsqueda como en mi Tienda».
«Mis publicaciones» es el mismo `/u/[username]` visto por su dueño, así que es una sola pantalla.

Scope: el perfil gana el buscador de la tienda (`ListSearchField`, `?q=`), con el mismo criterio
de palabras que ya usa `getPostsBySeller` (`term`), combinable con pilar y existencia, y que viaja
al paginar. Sin resultados por el término, un mensaje propio que no diga que la persona no ha
publicado nada.
