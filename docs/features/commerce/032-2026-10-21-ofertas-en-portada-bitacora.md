# Bitácora: Ofertas en la portada

Roadmap: `032-2026-10-21-ofertas-en-portada.md`. Escenarios:
`src/e2e/ofertasEnPortada/ofertasEnPortada.feature`.

## 2026-10-21 — Slice 1: el banner y el carrusel

### Objetivo

Que el hero del inicio diga, de entrada, qué está en promoción: un banner generado con las fotos y
los precios de las promociones vigentes, en un carrusel junto a lo último publicado.

### Decisiones

- **Decisiones del usuario en el gate:** imagen compuesta en el servidor (no IA), banner combinado y
  después (slice 2) un slide por producto, carrusel automático con controles, y el banner lleva a
  `/productos?promocion=1`.
- **Dominio genérico** (`entities/post/promotionBanner.ts`): `selectBannerPromotions` decide con
  `currentPrice` qué entra (vigente y con foto), ordena por descuento y corta en 4.
  `promotionsFingerprint` (FNV-1a) va en la dirección de la imagen para que una promoción nueva no se
  tape con la imagen vieja de la caché.
- **La base no tiene consulta nueva.** `loadHomeOffers` reusa `getProducts(…, { onSale: true })`, el
  filtro del slice 3 de promociones, y la portada y la ruta de la imagen llaman a la misma función:
  el `alt` describe exactamente lo que la imagen dibuja.
- **`GET /api/ofertas/banner?locale=…&v=<huella>`** responde un PNG de `next/og`, o 404 sin
  promociones. `Cache-Control` de 5 minutos aunque la dirección cambie con la huella, porque una
  promoción que **vence** no cambia ningún dato, solo la hora.
- **Desviación del roadmap: 1200×760 y no 1200×900.** El hero solo se pinta desde `lg`, y ahí su lado
  derecho mide 288 px de alto por ~400–500 de ancho (1.4:1 a 1.75:1). Un 4:3 perdía el titular y los
  precios con `object-cover`. Los mosaicos van en una sola fila, como un banner de campaña, con
  márgenes que aguantan el recorte en los dos extremos.
- **Las fotos se ven enteras sobre blanco** (`contain`, y `sharp` con `fit: "inside"`): son fotos de
  producto, y `cover` en un mosaico angosto le cortaba los lados al frasco. Títulos a dos renglones.
- **Fuentes de la marca en el repo** (`src/assets/fonts/`, OFL): Plus Jakarta Sans 500 y 800 y
  Newsreader 500. `next/og` solo trae Geist Regular, y bajarlas de Google en cada petición haría
  depender la imagen de la red.
- **`sharp` alineado a la versión de Next (`^0.34.5`).** En Node, `ImageResponse` rasteriza con el
  `sharp` que importa Next (0.34.5). El proyecto tenía el suyo en 0.35.3 para el importador, y con
  las dos copias de libvips cargadas en el mismo proceso cada banner fallaba con
  `colourspace: parameter space not set`. Con una sola versión, el banner sale. El importador solo
  usa `resize` y `webp`, que 0.34 tiene igual.
- **El carrusel es del sistema de diseño** (`design_system/carousel/Carousel.tsx`): no sabe de
  publicaciones. Avanza cada 6 s, se detiene con el cursor encima o con foco, y no avanza solo con
  `prefers-reduced-motion`. Tiene flechas, puntos, teclado y gesto. Los slides que no se ven llevan
  `hidden`, así que no se tabulan ni bajan su imagen. Sus textos llegan como plantillas
  (`{position} de {count}`), porque el hero es de servidor y una función no cruza al cliente.
- **Sin promociones, la portada es exactamente la de antes**, y con promociones pero sin nada
  publicado, el banner va solo y sin controles.

### Archivos

- Dominio: `entities/post/promotionBanner.ts` (+ pruebas).
- Portada: `app/(home)/homeOffers.ts` (+ pruebas), `app/(home)/OffersBannerSlide.tsx`,
  `app/(home)/HomeHero.tsx` (+ pruebas), `app/[locale]/page.tsx`.
- Imagen: `app/api/ofertas/banner/route.tsx` y `OffersBannerImage.tsx`, `src/assets/fonts/*.ttf`.
- Sistema de diseño: `design_system/carousel/Carousel.tsx` (+ pruebas).
- Mensajes `home.offers*` y `home.carousel*` en es y en.
- `package.json` y `pnpm-lock.yaml` (`sharp` `^0.34.5`).
- e2e: `ofertasEnPortada.feature` y su spec, `testUtils/warmRoutes.ts` (la ruta de la imagen), y
  `home/homeHero.spec.ts` (ver abajo).

### Validación

- e2e `src/e2e/ofertasEnPortada`: 5 de 5. El sexto escenario es `@component` (HomeHero.test.tsx).
- e2e vecinos: `src/e2e/home` y `src/e2e/promociones`, 24 de 24 tras dos ajustes a
  `homeHero.spec.ts`:
  - «Tezonapa, Veracruz» se buscaba en toda la página, y un producto real ya se llama «… de
    Tezonapa, Veracruz». Se acotó al rótulo (`home-eyebrow`). No lo causó este cambio.
  - «Lo último publicado» ahora es el segundo slide cuando hay promociones (hoy hay cinco reales de
    Falcon). El spec llega a él con los controles del carrusel. Cambio de comportamiento esperado.
- Suite completa de vitest: 343 archivos y 3640 pruebas en verde. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
- `.next` se borró antes de cada corrida de e2e, como pide AGENTS.md.
- Capturas del banner y del hero a 1366 px revisadas a ojo.

### Recap

Slice 1 terminado. Con promociones vigentes, el hero del inicio es un carrusel que abre con un banner
de ofertas generado en el servidor (fotos, `-N%`, precio rebajado y el normal tachado) y sigue con lo
último publicado. Sin promociones, la portada no cambia. La imagen cambia de dirección cuando cambian
las promociones.

### Próximos pasos (opciones)

- Slice 2: un slide por producto en promoción, que lleve a su ficha.
- El hero es solo de escritorio (`hidden lg:block`), así que en el teléfono no se ve el banner.
  Decidir si las ofertas merecen un lugar en el inicio del teléfono.
- Opcional: reusar la imagen como `og:image` de `/productos?promocion=1` o para compartir en grupos.

## 2026-10-21 — Slice 1b: la tarjeta de ofertas, primera del feed

### Objetivo

Lo pidió el usuario al ver el slice 1: el banner a todo el ancho, en escritorio y en el teléfono, como
la primera tarjeta del feed y con carrusel. Y sin llenar `CardForList` de condiciones: una base y
tarjetas específicas encima.

### Decisiones

- **Del usuario:** se quedan los dos, el carrusel del hero (escritorio) y la tarjeta del feed. El
  carrusel de la tarjeta lleva el banner y, en el slice 2, un slide por producto; lo último publicado
  no entra porque es la tarjeta siguiente. La imagen va en dos formatos.
- **`CardShell`** (`design_system/surfaces/`): la superficie de una tarjeta (papel elevado, borde,
  radio, elevación al pasar el cursor), sin nada de publicaciones. `Card` —la de una publicación, con
  su firma— se apoya en ella sin cambiar su API ni sus clases, y `CardForList` no se tocó.
  `OffersCard` (`app/(home)/`, porque solo la usa el inicio) es la segunda tarjeta sobre la misma
  base.
- **Tres formatos en `BANNER_FORMATS`**: `portada` (el del hero, 1200×760), `ancho` (1600×520,
  titular a la izquierda y productos en fila) y `compacto` (1080×900, rejilla de 2×2). La ruta los
  recibe en `formato`; sin él, `portada`.
- **`<picture>` y no CSS** para elegir el formato: el teléfono solo descarga el compacto y el
  escritorio solo el ancho. El corte va en 1024 px, como el hero. En una tableta, el compacto se
  limita a `min(70vh, 640px)` de alto, y lo que sobra a los lados es del mismo crema que la imagen.
- **`PostsWithLoadMore` gana `leading`**: lo pinta antes de la rejilla, fuera de las columnas. La
  tarjeta llega ya pintada desde el servidor, que es quien sabe si hay ofertas.
- **Corregido de paso:** el slide de lo último publicado en el hero no tenía `key`, y React lo
  avisaba en la consola. Lo detectó el usuario.

### Archivos

- `design_system/surfaces/CardShell.tsx` (+ pruebas), `presentation/post/Card/Card.tsx`.
- `app/(home)/OffersCard.tsx` (+ pruebas), `PostsWithLoadMore.tsx` (+ prueba), `homeOffers.ts`,
  `OffersBannerSlide.tsx`, `HomeHero.tsx`, `app/[locale]/page.tsx`.
- `app/api/ofertas/banner/OffersBannerImage.tsx` y `route.tsx` (formatos).
- e2e: tres escenarios `@slice-1b` en el `.feature` y su spec.

### Validación

- Suite completa de vitest: 345 archivos y 3646 pruebas en verde. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
- **e2e pendiente.** El usuario tenía su servidor de desarrollo en el 3000, y correr Playwright
  obliga a borrar `.next` y levantar otro `next dev`. Falta correr `src/e2e/ofertasEnPortada` con su
  servidor apagado.

### Recap

La tarjeta de ofertas existe y abre el feed a todo el ancho, con el formato ancho en escritorio y el
compacto en el teléfono. `Card` y `OffersCard` comparten la base `CardShell`. Falta la corrida de
e2e.

### Próximos pasos (opciones)

- **Pendiente:** correr `src/e2e/ofertasEnPortada` con el 3000 libre.
- Slice 2: un slide por producto, en los dos carruseles.

## 2026-10-21 — Un solo carrusel, y el banner rediseñado

### Pedido del usuario

«En desktop solo quiero un carrusel banner, obviamente solo cuando hay ofertas, y mejora la UI de
eso, que sea moderno y minimalista.»

### Decisiones

- **El hero volvió a ser el de antes** (`HomeHero.tsx` y su prueba restaurados desde `dev`). Las
  ofertas viven solo en la tarjeta del feed, que solo se monta cuando hay alguna vigente. Se borró
  `OffersBannerSlide` y el formato `portada`. Los textos `offersCaption` y `carouselLabel` ya no se
  usan y se quitaron. El tipo `HomeOffersBanner` pasó a `homeOffers.ts`.
- **El arreglo de «Tezonapa, Veracruz» en `homeHero.spec.ts` se quedó**, porque no dependía del
  carrusel. El rodeo para llegar a la portada con las flechas se quitó.
- **Banner minimalista:**
  - Un fondo cálido, mosaicos blancos sin sombra ni borde, y un solo color de acento (el barro de la
    marca), solo en la píldora del descuento. Los mosaicos son blancos porque casi todas las fotos de
    producto vienen sobre blanco, y sobre un mosaico de color se leían como un cuadro pegado.
  - Jerarquía: un rótulo pequeño en versalitas («Promociones»), «Ofertas» en Newsreader, el conteo
    en gris y una píldora de tinta, «Ver todas →», que es lo único que parece un botón.
  - Precio en tinta y en negrita, con el normal tachado y más pequeño. El título del producto va en
    gris, en un renglón.
  - Con pocas ofertas, los mosaicos no se estiran: tienen el ancho que tendrían con la fila llena.
- **Controles del carrusel más discretos:** papel translúcido en vez de círculos negros. En
  escritorio aparecen al pasar el cursor o con foco, y en pantallas táctiles siempre. Los puntos son
  delgados y van sobre la imagen. Hoy no se ven porque el carrusel tiene un solo slide; se estrenan
  en el slice 2.
- `.feature` reescrito para este modelo. Los escenarios del hero se volvieron escenarios de la
  tarjeta, más uno nuevo: «El hero no repite las ofertas». El de los controles pasó al slice 2.

### Validación

- Los dos formatos se dibujaron fuera del servidor con las fotos reales de Falcon y se revisaron a
  ojo.
- Suite completa de vitest: 345 archivos y 3643 pruebas en verde. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
- **e2e pendiente:** el usuario sigue con su servidor en el 3000.

### Recap

Con ofertas vigentes, el feed abre con una tarjeta a todo el ancho que lleva un banner minimalista:
el formato ancho en escritorio y el compacto en el teléfono. El hero es el de siempre. Falta la
corrida de e2e.

### Próximos pasos (opciones)

- **Pendiente:** correr `src/e2e/ofertasEnPortada` (y `src/e2e/home`) con el 3000 libre.
- Slice 2: un slide por producto en la tarjeta de ofertas.

## 2026-10-21 — Modelo final: el carrusel ocupa el lugar del hero, al estilo de un marketplace

### Pedido del usuario

«Cuando hay promociones hay que ocultar el homeHero, y ese banner/carrusel lo quiero más
estilizado, más como lo hace Mercado Libre. Si necesitas crear imágenes con IA, adelante.»

### Decisiones

- **Con ofertas vigentes, `OffersCarousel` va en lugar del hero**, arriba de todo, en escritorio y
  en el teléfono (el hero era solo de escritorio). Sin ofertas vuelve el hero de siempre. Ya no está
  en el feed: se revirtieron `leading` de `PostsWithLoadMore` y `CardShell`. Al dejar de ser una
  tarjeta, la base solo la habría usado `Card`, y una abstracción con un solo cliente no se queda.
- **Estilo de carrusel de marketplace:**
  - Fondo de arte, una píldora crema «OFERTAS», un titular blanco en ExtraBold y mayúsculas
    («HASTA 21% OFF», con el descuento más grande), el conteo y un botón blanco «Ver ofertas →».
  - Los productos **recortados y flotando**, cada uno con su sombra difusa en el piso, un sello
    circular de descuento en barro con borde blanco y una etiqueta blanca con el precio y el normal
    tachado.
  - Ancho: 1600×520, hasta 4 productos. Compacto: 1080×810, hasta 3.
- **IA solo para el fondo.** `scripts/generateOffersBannerBackgrounds.ts` pide a Gemini
  (`gemini-2.5-flash-image`) dos fondos abstractos en los verdes de la marca con acentos de barro y
  crema, una vez, y los deja en `src/assets/banners/`. Ni en cada petición (costo, segundos, y una
  imagen distinta en cada visita) ni sobre los productos: el modelo nunca toca un producto ni una
  cifra. El primer fondo compacto salió como una maqueta con la palabra «HEADLINE»; se endureció el
  prompt (a sangre, sin marco ni texto) y se regeneró solo ese (`… fondo-compacto.png`). Revisados a
  ojo los dos.
- **Recorte de las fotos** (`infra/images/cutoutProductPhoto.ts`): relleno por anchura desde los
  bordes, que quita solo el blanco conectado al borde (el fondo de estudio) y deja lo blanco de
  adentro (etiquetas, logos). Si menos del 35% del borde es blanco, la foto no es de estudio y se
  pinta como tarjeta redondeada. Probado con una imagen sintética y a ojo con las cinco de Falcon.
- Se quitó Newsreader de los assets (el titular ya no es serif) y los textos `offersBannerTitle`;
  entraron `offersBannerHeadline` («Hasta {percent}% OFF») y cambiaron eyebrow y botón.
- **`homeHero.spec.ts`:** sus escenarios de escritorio se saltan con motivo explícito cuando hay
  ofertas vigentes, porque entonces el hero no está por diseño. En la base compartida hay
  promociones reales. Vuelven a correr solos el día que no haya ninguna.

### Validación

- Los dos formatos se dibujaron con las fotos reales de Falcon y el fondo de IA, y se revisaron a ojo.
  Un ajuste salió de ahí: el texto del sello se salía del círculo.
- Suite completa de vitest: 345 archivos y 3641 pruebas en verde (incluye el recorte, el carrusel y
  `OffersCarousel`). `tsc`, `typecheck:tests` y `biome check .` limpios.
- **e2e:** con autorización del usuario se detuvo su `next dev` del 3000 (PID 13836 y su padre
  59204), se borró `.next` y se corrió `src/e2e/ofertasEnPortada` + `src/e2e/home`: 12 en verde y 5
  saltados (los de escritorio del hero, con su motivo, porque hay ofertas reales). La primera corrida
  encontró un defecto real: **sin el hero, el inicio se quedaba sin `h1`**. Se agregó un `h1` visible
  solo para lectores de pantalla, con el mismo titular del hero, y el escenario ahora lo comprueba.
- Capturas de la página completa a 1366 y 390 px revisadas a ojo.

### Recap

Con ofertas vigentes, el inicio abre con un carrusel de ofertas a todo el ancho en lugar del hero.
El banner tiene fondo generado con IA, titular grande, productos recortados con su descuento y su
precio, y botón «Ver ofertas». Sin ofertas, el hero de siempre. Todo en verde, e2e incluido.

### Próximos pasos (opciones)

- **Pendiente del usuario:** volver a levantar su servidor (`pnpm dev`); se detuvo para el e2e.
- Commit, merge a `dev` y push.
- Slice 2: un slide por producto, que estrena los controles del carrusel.
