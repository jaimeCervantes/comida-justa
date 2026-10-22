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

## 2026-10-21 — Slice 2: un slide por marca

### Objetivo

Que el carrusel cuente una historia por marca —«Ofertas Birdman», «Ofertas Amarosana»— en vez de un
slide por producto. Lo pidió el usuario al preguntar si convenía agrupar por categoría, vendedor o
marca.

### Decisiones

- **Por marca, no por tienda ni por categoría.** Con los datos de hoy, por tienda sale un solo grupo
  (Hazlo Sano publica 426 de 428) y por categoría tampoco se separan proteínas de smoothies (los dos
  en `alimentacion / abarrotes`). La marca no existía como dato: vivía dentro del título.
- **Migración `0065_2026_10_21`** en `hazlo-sano-bot` (rama `feat/marca-de-publicacion`), aplicada a
  la base compartida a pedido del usuario: `posts.brand` text nulo, con el CHECK
  `posts_brand_not_blank` (sin marca es NULL, nunca vacía) y el índice parcial `posts_brand_idx`
  sobre `lower(brand)`. Sin relleno: lo llena el siguiente `--sync` del importador.
- **Dominio genérico:** `entities/post/brand.ts` (`normalizeBrand`, `validateBrand` con tope de 60,
  `brandKey`) y `catalogFilters.ts` (los parámetros `marca` y `tienda`, y cómo se leen).
- **`groupBannerPromotions`:**
  - Agrupa por marca sin distinguir mayúsculas y, sin marca, por tienda.
  - Solo forma un grupo con 2 o más ofertas, y como mucho 4 grupos, del mayor descuento al menor.
  - Un grupo que junta todas las ofertas no tiene slide, porque repetiría el general. Es el caso de
    hoy en producción: las cinco promociones de Falcon son de Hazlo Sano y aún no tienen marca.
  - `selectBannerPromotions` quedó como el primer corte de `activeBannerPromotions`, que los grupos
    necesitan completa.
- **Cada slide tiene su propia imagen y su huella:** `/api/ofertas/banner?…&marca=…` (o `&tienda=`)
  dibuja solo ese grupo, con la marca en la píldora. Cada slide lleva a
  `/productos?promocion=1&marca=…`.
- **`/productos` filtra por `marca` y por `tienda`.** Se suman a la promoción y al pilar, la
  paginación los conserva, y el filtro puesto se ve como una píldora con ✕. `ProductsList` recibe
  ahora un solo `filters` en vez de `onSale`.
- **El importador** guarda `supplierName` como marca al dar de alta y en el `--sync`, que la reporta
  («marcas a poner»). El mapeo vive en `scripts/catalogBrand.ts`, para poder probarlo sin ejecutar el
  importador.
- **Publicar y editar:** un campo «Marca (opcional)» en productos y servicios (`BrandField`), que se
  normaliza y se valida. En un anuncio o un evento se descarta aunque venga forjada.
- El primer slide carga de inmediato, y los demás con `loading="lazy"` y dentro de un `hidden`, así
  que no se descargan hasta que les toca.

### Archivos

- Backend: `alembic/versions/0065_2026-10-21_add_post_brand.py`.
- Espejo: `db/schema/posts.ts`.
- Dominio: `entities/post/brand.ts`, `catalogFilters.ts` y `promotionBanner.ts` (+ pruebas), y
  `schemas/PostValidator.ts` (+ prueba).
- Casos de uso: `managePost` (puerto, caso de uso, fixture y pruebas) y `createOnePost`.
- Infra: `posts/PostgresPostQueryRepository.ts` e `IPostQueryRepository.ts`,
  `managePost/PostgresPostAdminRepository.ts`, `createOnePost/PostgresPostRepository.ts` y
  `types/Actions.d.ts`.
- Inicio: `homeOffers.ts`, `OffersCarousel.tsx` (+ pruebas) y `app/[locale]/page.tsx`.
- Imagen: `api/ofertas/banner/route.tsx`.
- Catálogo: `productos/data.ts`, las dos páginas y `ui/ProductsList.tsx` (+ pruebas).
- Formularios: `presentation/post/BrandField`, `publicar/*` y `editar/[slug]/*`.
- Importador: `scripts/importSupplierCatalog.ts` y `scripts/catalogBrand.ts` (+ prueba).
- Mensajes `home.offersGroupAlt`, `products.removeFilter` y `emptyFiltered`, y `publish.brand` y
  `errorBrandTooLong`, en es y en.
- e2e: `ofertasEnPortada/ofertasPorMarca.spec.ts`, y `ofertasEnPortada.spec.ts` acotado al slide
  general.

### Validación

- Suite completa de vitest: 348 archivos y 3676 pruebas en verde. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
- **e2e incompleto.** Se partió en 3 tramos (42 escenarios). Tramo 1: 9 en verde y 5 saltados.
  Tramo 2: 11 en verde y 3 fallos, todos del mismo helper de `ofertasEnPortada.spec.ts`. Con la miel
  sembrada en otra tienda, las ofertas reales de Hazlo Sano formaron su propio slide, y «la imagen
  del banner» encontraba dos. Era un defecto del spec, no del producto, y se acotó al slide general.
  El tramo 3 lo detuvo Claude Code por falta de memoria del equipo. Después de eso se mató el
  `next dev` huérfano del 3100 y se corrió el barrido de datos de prueba: no quedaba nada.
- **Pendiente:** repetir los 3 tramos.

### Recap

Slice 2 implementado: la marca existe en la base, el importador la llena, se puede escribir al
publicar y al editar, el catálogo filtra por ella y el carrusel suma un slide por marca (o por
tienda) que junte dos o más ofertas. Las pruebas unitarias están en verde; falta repetir el e2e.

### Próximos pasos (opciones)

- **Pendiente:** repetir el e2e en 3 tramos (`ofertasEnPortada`, `home`, `promociones`, `products`,
  `editPublicationTypes` y `publishProduct`).
- **Pendiente del usuario:** commitear la migración en `hazlo-sano-bot`; ya está aplicada.
- Correr `pnpm run import:catalog -- --sync` con el próximo catálogo, para que las ofertas reales
  tengan marca y aparezca su slide («Ofertas Birdman»).

## 2026-10-22 — El banner tardaba en cargar

### Qué se midió

El usuario notó que la imagen del banner tardaba. Se cronometró cada paso con los datos reales
(fuera del servidor):

| Paso | Antes |
|---|---|
| Base de datos | ~1 s (incluye abrir la conexión) |
| Bajar 4 fotos de Firebase | 0.7 s, **en cada petición** |
| Recortarlas | 0.2 s, **en cada petición** |
| Dibujar | 0.5–1 s (el fondo de IA pesaba 0.8–1.2 MB de PNG dentro de cada dibujo) |
| **Resultado** | **PNG de 957 KB a 1.2 MB** |

### Decisiones

- **WebP en vez de PNG.** `next/og` solo entrega PNG; se convierte con `sharp` (el mismo de Next).
  Pasa de ~1 MB a **53 KB** sin diferencia a la vista.
- **Nunca se dibuja dos veces el mismo banner.** La dirección ya llevaba la huella de lo que pinta,
  así que la misma dirección es siempre la misma imagen:
  - En el servidor, `LruCache` (`infra/cache/`, 32 banners) los guarda por dirección. Un acierto ni
    siquiera lee la base.
  - En el navegador y la CDN, `Cache-Control: immutable` de un año cuando `v` coincide con lo que se
    pinta hoy. Sin `v`, o con uno viejo, se pinta lo de hoy y se guarda 5 minutos.
  - `v` lleva además una **versión del dibujo** (`bannerVersion`, hoy `3`). La huella solo mira los
    datos: sin esa versión, un rediseño se seguiría sirviendo con el dibujo viejo a quien lo tuviera
    guardado. Hay que subirla cada vez que cambie cómo se ve el banner.
- **Las fotos recortadas se guardan por su dirección** (96 entradas). Un producto sale en el general
  y en el de su marca, en dos formatos: antes se bajaba y recortaba hasta cuatro veces. Un fallo no
  se guarda, para que la siguiente petición reintente.
- **Fondos de IA en JPEG**: de 837 KB y 1.2 MB a **12 KB y 22 KB**, sin bandas visibles. El script
  generador ya escribe JPEG.
- **`fetchPriority="high"`** en la imagen del primer slide: es lo más grande de la página al cargar.

### Validación

- Medido otra vez: dibujar más convertir a WebP toma 0.4–0.9 s **la primera vez**; desde la segunda
  se sirve de la caché. Revisado a ojo.
- Suite completa de vitest: 349 archivos y 3680 pruebas en verde (incluye `LruCache`). `tsc`,
  `typecheck:tests` y `biome check .` limpios.
- Los e2e que esperaban PNG ahora esperan WebP (`RIFF…WEBP`).
- **e2e en 3 tramos**, en primer plano y con `.next` borrado antes de cada uno (`ofertasEnPortada`,
  `home`, `promociones`, `products`, `editPublicationTypes` y `publishProduct`, 42 escenarios): 37
  en verde y 5 saltados (los de escritorio del hero, porque hay ofertas). De paso se cierra la
  corrida del slice 2 que había cortado la falta de memoria.
- Dos specs dependían de cuánto hubiera publicado ese día, y fallaron cuando aparecieron ofertas
  reales al 20% (Açaí Glow, Dona Chocolate Keto, dos barras de proteína):
  - El banner general pinta las cuatro de mayor descuento, y la miel de prueba al 17% quedó fuera.
    Esos escenarios ahora la ponen al 50% (180 → 90), y el `.feature` se ajustó igual.
  - `/productos?promocion=1` ya tiene tantas ofertas que la miel caía después de la primera página.
    El escenario sigue pulsando el filtro, pero mira el resultado dentro de la tienda de prueba
    (`&tienda=`).

### Recap

El banner pesa 53 KB en vez de ~1 MB, se dibuja una sola vez por dirección y el navegador lo guarda
para siempre. Solo la primera visita después de un cambio de promociones paga el dibujo.

### Próximos pasos (opciones)

- Opcional: «calentar» el banner al guardar una promoción, para que ni esa primera visita espere.
- Visto en la medición: una foto de producto que no está sobre blanco (el açaí de $230) se pinta
  como cuadro y su sombra queda separada. Se podría ajustar la sombra para ese caso.

## 2026-10-22 — Lo agotado no se anuncia, el banner se calienta al guardar, y la sombra

### Pedidos del usuario

- Adelante con las dos optimizaciones que quedaron pendientes: calentar el banner al guardar y
  arreglar la sombra de las fotos que no son de estudio.
- A mitad del trabajo: «si no tiene stock, no debe aparecer en ofertas».

### Decisiones

- **Lo que no se puede comprar no es oferta.**
  - `canBeAdvertised` (`promotionBanner.ts`) usa las reglas que ya existían: `canBeOrdered` (no
    marcado como agotado) y `isOutOfStock` (inventario en cero, solo en productos que llevan
    inventario; nulo no es cero).
  - `onSaleWhere` las repite en SQL, así que `/productos?promocion=1` —a donde lleva «Ver
    ofertas»— cuenta lo mismo que el banner.
- **El banner se calienta al guardar.**
  - Publicar o editar algo que se vende agenda en `after()` a `warmOffersBanners`, que pide por HTTP
    todas las imágenes del carrusel (cada slide, en los dos formatos y los dos idiomas).
  - Va por HTTP y no llamando a la función que dibuja, porque en producción la acción y la ruta
    pueden correr en procesos distintos: solo pidiéndola se llenan la caché de la ruta y la de la
    CDN.
  - El origen sale de la petición (`requestOrigin`, que lee `x-forwarded-*` detrás de Vercel), así
    que en local o en un e2e calienta ese servidor y nunca producción.
  - Una dirección ya dibujada responde de la caché sin costo. Nunca falla: lo que no se calentó, se
    dibuja cuando alguien lo pide.
- **Cada foto a su proporción real**, apoyada sobre su sombra.
  - `cutoutProductPhoto` devuelve el tamaño de la foto entregada, y el dibujo la ajusta con
    `fitPhoto`.
  - La foto recortada lleva una sombra en el piso de su ancho. La que no está sobre blanco va como
    una tarjeta con marco blanco, redondeo y su propia sombra.
  - Hallazgo al revisar el dibujo: con `boxShadow: "none"` y fondo transparente en el contenedor de
    la foto recortada, **Satori pintaba la silueta del producto en negro en la esquina superior
    izquierda del banner**. Los estilos de tarjeta solo se ponen en la que no está recortada.
  - `BANNER_DESIGN_VERSION` sube a `4`.

### Validación

- Dibujado con los datos reales (60 ofertas vigentes hoy) y revisado a ojo en los dos formatos.
- Suite completa de vitest: 350 archivos en verde, incluidas las pruebas nuevas de
  `canBeAdvertised`, `warmOffersBanners` y el tamaño del recorte. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
  - `editar/[slug]/actions.test.ts` ahora simula el origen y el calentado, como ya simulaba `after`
    y los repositorios.
- e2e en 3 tramos, con `.next` borrado antes de cada uno: 39 en verde y 5 saltados (44), incluidos
  los dos escenarios nuevos de lo agotado: «marcada como agotada» y «0 piezas».
- El calentado no tiene escenario e2e: lo que garantiza es tiempo, y un e2e que mida tiempos sería
  frágil. Lo cubren sus pruebas unitarias.

### Recap

El carrusel y la lista de ofertas ya no anuncian lo agotado. Guardar un producto o un servicio deja
el banner dibujado antes de que llegue la primera visita. Las fotos se pintan a su proporción: las
recortadas sobre su sombra y las demás como tarjeta.

### Próximos pasos (opciones)

- Commit, merge a `dev` y push.

## 2026-10-22 — El carrusel solo anuncia lo que tiene piezas registradas

### Decisión del usuario

De las 150 ofertas vigentes, 128 no llevan inventario (`stock_quantity` nulo: casi todo lo importado
del proveedor), 22 tienen piezas y 1 está marcada como agotada. El usuario decidió que **el
carrusel solo anuncie lo que tiene piezas registradas**.

### Decisiones

- `canBeAdvertised` exige ahora `canBeOrdered` y además inventario con al menos una pieza. Un
  servicio no sale en el carrusel, porque no se cuenta en piezas: su disponibilidad es la agenda.
- **La lista de ofertas (`/productos?promocion=1`) no cambia**: sigue enseñando todo lo que se puede
  comprar, también lo que no cuenta piezas. El usuario preguntó solo por el carrusel, así que «Ver
  ofertas» lleva a más productos de los que anuncia el banner.
- El filtro va también en la base (`inStock`, `stock_quantity > 0`), así que la consulta del
  carrusel ya no lee filas para tirarlas.
- **Error corregido de paso:** el carrusel leía como mucho 60 ofertas. Con 150, el banner decía «60
  productos rebajados» y una marca cuyas ofertas quedaran más abajo se quedaba sin su slide. Ahora
  el total sale de la base (`COUNT(*) OVER()`) y se leen hasta 300 para agrupar.
- e2e: los helpers dejan a la miel de prueba con 10 piezas, y hay un escenario nuevo, «una oferta
  sin inventario registrado no sale en el carrusel, pero sí en la lista».

### Validación

- Suite completa de vitest: 350 archivos y 3688 pruebas en verde. `tsc`, `typecheck:tests` y
  `biome check .` limpios.
- e2e `ofertasEnPortada` + `home` en 2 tramos: 18 en verde y 5 saltados (23).

### Recap

El carrusel anuncia solo productos con piezas registradas (hoy, 22 ofertas) y cuenta bien el total.
La lista de ofertas sigue completa.

### Próximos pasos (opciones)

- Si se quiere, alinear la lista de ofertas con el carrusel (solo lo que tiene piezas).
- Commit, merge a `dev` y push.

