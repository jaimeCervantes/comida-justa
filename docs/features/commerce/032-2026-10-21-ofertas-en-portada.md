# Ofertas en la portada: banner generado y carrusel en el hero

> Roadmap de rebanadas. La bitácora de cada una vive en
> `032-2026-10-21-ofertas-en-portada-bitacora.md`. Escenarios:
> `src/e2e/ofertasEnPortada/ofertasEnPortada.feature`. Rama: `feat/ofertas-portada`.
> Se apoya en las promociones de `031-2026-10-20-promociones.md`.

## Contexto

_Problem / Savings / Why redactados por el agente a partir de la petición («generar imágenes de las
ofertas en la página de inicio… algo parecido a lo que hace Mercado Libre»); el usuario los aprobó
en el gate de alineación del 2026-10-21._

- **Problem:** una oferta solo se ve si quien visita baja hasta su tarjeta o abre el filtro «En
  promoción». Lo primero que se ve del sitio, el hero del inicio, nunca dice que hay ofertas, y es el
  lugar más valioso.
- **Savings:** nadie diseña ni sube un anuncio. El banner se arma solo con las fotos y los precios
  de las promociones vigentes, y desaparece solo cuando se acaban. No hay que mantener nada a mano.
- **Why:** las promociones solo mueven inventario si se ven. Esto las pone en el hero, como Mercado
  Libre, con los datos que la plataforma ya tiene.

**As** visitante del inicio
**I want** ver en el hero, de entrada, qué está en promoción
**So that** encuentre las ofertas sin tener que buscarlas

## El modelo acordado

- **La imagen es un PNG real compuesto en el servidor** con `next/og` (`ImageResponse`): hasta 4
  promociones vigentes, cada una con su foto, `-N%` y el precio rebajado, en los colores de la
  marca. Sin IA: nunca inventa nada de un producto.
- **Vigencia:** la decide `currentPrice` (`domain/entities/post/promotion.ts`) al momento de la
  petición, la misma regla de la ficha, el carrito y el filtro.
- **La dirección de la imagen lleva una huella del conjunto de promociones** (ids, precios y fin):
  cuando cambia una promoción cambia la dirección, y el navegador pide la nueva en vez de servir la
  vieja de su caché.
- **Las fotos están en WebP**, que `next/og` (Satori) no lee. Se convierten a PNG en el servidor con
  `sharp`, que ya es dependencia.
- **El hero:** el texto de la izquierda queda igual. A la derecha:
  - **Sin promociones vigentes**, la portada es exactamente la de hoy (la última publicación).
  - **Con promociones**, un carrusel: el banner combinado, (slice 2: un slide por producto) y la
    última publicación.
  - Rota solo cada ~6 s; se pausa al pasar el cursor o con foco; puntos y flechas; deslizar en el
    teléfono. Quieto con `prefers-reduced-motion`.
  - El banner lleva a `/productos?promocion=1`; un slide de producto, a su ficha.
- **Reusabilidad:** «publicaciones con promoción vigente» es núcleo genérico (dominio + repositorio
  de consultas, la misma vigencia que `onSaleWhere`). El banner y el carrusel son presentación; nada
  supone comida.

## Rebanadas

### Slice 1 — El banner y el carrusel

- Consulta: las promociones vigentes para la portada (hasta 4 para el banner), con foto, título y
  precios. Reusa `onSaleWhere`.
- Dominio: la huella del conjunto (`promotionsFingerprint`) y la selección para el banner.
- Ruta de imagen `GET /api/ofertas/banner` → `image/png` (1200×900, 4:3 como el hueco del hero).
  Sin promociones vigentes responde 404. Se agrega a `warmRoutes.ts`.
- `HomeHero`: con promociones, carrusel de dos slides (banner + última publicación); sin ellas, el
  de hoy. El `alt` del banner nombra los productos y sus descuentos.
- Carrusel en `src/presentation/` (cliente, pequeño): autoplay, pausa, puntos, flechas, gesto,
  movimiento reducido.

**Acepta cuando:** los escenarios `@slice-1` pasan; pruebas unitarias de la huella y la selección;
pruebas de componente del carrusel (avance, pausa, movimiento reducido) y del hero sin promociones.

### Slice 1b — La tarjeta de ofertas, primera del feed (cambio pedido el 2026-10-21)

Tras ver el slice 1, el usuario pidió que el banner **use todo el ancho, en escritorio y en el
teléfono, como la primera tarjeta del feed**, también con carrusel, y que no se reusara
`CardForList` llenándola de condiciones sino que hubiera una base y tarjetas específicas.
Decisiones del usuario:

- **Se quedan los dos:** el carrusel del hero (solo escritorio) y la tarjeta de ofertas en el feed.
- **El carrusel de la tarjeta:** el banner y, en el slice 2, un slide por producto. Lo último
  publicado no entra: ya es la tarjeta siguiente.
- **Dos formatos de imagen:** ancho para escritorio (los productos en fila) y compacto para el
  teléfono (2×2), elegidos con `<picture>`.

Diseño:

- `CardShell` (sistema de diseño): la superficie de una tarjeta, sin nada de publicaciones. `Card`
  (la de una publicación, con su firma) se apoya en ella sin cambiar su API, y `CardForList` no se
  toca. `OffersCard` es otra tarjeta sobre la misma base.
- La ruta de la imagen gana `formato=ancho|compacto`.
- `PostsWithLoadMore` gana un `leading` que se pinta antes de la rejilla, a todo el ancho.

**Acepta cuando:** los escenarios `@slice-1b` pasan; pruebas de `CardShell`/`Card` (la de siempre
sigue igual), de `OffersCard` y de los dos formatos.

### Slice 2 — Un slide por producto

Hasta 5 slides, uno por producto en promoción, con su foto, el normal tachado, el rebajado y `-N%`,
que llevan a su ficha. En los dos carruseles: el del hero y el de la tarjeta de ofertas.

### Opcional (no planeado)

Reusar la imagen para compartir en grupos o como `og:image` de `/productos?promocion=1`.

## Estado

- Slice 1: terminado el 2026-10-21. El banner salió en 1200×760 y no en 4:3; ver la bitácora.
- 2026-10-21: el usuario pidió un solo carrusel. El hero volvió a ser el de siempre, y las ofertas
  viven solo en la tarjeta del feed (slice 1b), con un banner minimalista en dos formatos (`ancho` y
  `compacto`). El formato `portada` se quitó. Ver la bitácora.
