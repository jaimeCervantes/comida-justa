# Bitácora — SEO

Registro append-only. Narra el **por qué**; el qué está en `git log`.

---

## Slice 1 — Que se pueda descubrir (2026-08-01)

### Objetivo

Que un buscador sepa qué páginas existen sin depender de que alguien las enlace. El sitio no tenía
`sitemap.ts` ni `robots.ts`, así que tiendas, perfiles y publicaciones solo se descubrían por
enlaces externos que nadie había puesto todavía.

### Lo que apareció al levantar el estado

**Seis secciones del menú responden 404.** `habitos`, `deportes`, `medio-ambiente`,
`negocios-locales`, `salud-infantil` y `productores-locales` son stubs que llaman a `notFound()`;
solo `pilares` y `nosotros` tienen contenido real. Eso decidió el alcance: **no entran al sitemap**,
porque publicar un 404 ahí es la forma más rápida de que un rastreador deje de fiarse del resto. Y
como es una situación que puede cambiar sin que nadie se acuerde de este archivo, hay un escenario
que **afirma que siguen siendo 404**: el día que dejen de serlo, la prueba falla y recuerda meterlas.

### Decisiones y por qué

**El sitemap se arma con la base y en cada petición.** Publicaciones, tiendas y perfiles salen de
tres consultas; las páginas fijas, de una lista en el dominio. Se marcó `force-dynamic` porque una
publicación nueva no puede esperar al siguiente despliegue para ser descubrible, y un rastreador
pide esto unas pocas veces al día: tres selects son irrelevantes frente a publicar contenido
invisible.

**Solo el español.** `localePrefix` es `as-needed`, así que el español vive sin prefijo. Pero las 24
publicaciones tienen únicamente traducción `es`: `/en/jugo-verde` renderiza el mismo texto en
español con el marco en inglés, o sea una página duplicada y delgada. Listar ambas habría sido
pedirle al buscador que elija entre dos versiones de lo mismo.

**Sin `priority` ni `changeFrequency`.** Google dice explícitamente que los ignora. Lo que sí usa es
`lastModified`, y solo se emite cuando la base lo sabe — en vez de rellenar con "hoy", que es
mentira y además hace que todo parezca recién cambiado.

**`robots.txt` prohíbe por lista explícita, no por prefijo.** Las publicaciones viven en la raíz
(`/<slug>`), así que no hay un prefijo que bloquear sin bloquear el contenido. Se listan las ocho
rutas privadas o combinatorias. `/buscar` y `/search` entran ahí no por privacidad sino porque
indexar resultados de búsqueda genera miles de páginas casi iguales que compiten contra las
publicaciones que sí importan.

**`metadataBase` en el layout raíz.** Sin él, las imágenes y canónicos relativos de las páginas
hijas salen relativos, que para quien comparte el enlace es como no tenerlos.

**Fuera de SEO, el ancho de `/nosotros`.** Sumaba `container-width` **otra vez** y `max-w-4xl
mx-auto` dentro del `container-width` del layout: el contenido quedaba en 896px dentro de un
contenedor de 1280px. Es el mismo error que ya habías señalado en `/cuenta`.

### Archivos tocados

- **Dominio:** `src/domain/seo/sitemap.ts` (+ prueba) — qué páginas fijas existen y cómo se arma cada entrada.
- **Infra:** `src/infra/dataAccess/seo/PostgresSitemapRepository.ts`.
- **App:** `src/app/sitemap.ts`, `src/app/robots.ts`, `metadataBase` en el layout, ancho de `/nosotros`.
- **e2e:** `src/e2e/seo/` (feature + spec).

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run test:run` | **464 pruebas en 51 archivos**, todas verdes (+18) |
| `playwright test src/e2e/seo` | **4 escenarios verdes** |

Las pruebas piden `/sitemap.xml` y `/robots.txt` como documentos y comprueban tres cosas: que lo
sembrado aparece, que los stubs y lo privado **no**, y que esos stubs siguen respondiendo 404.

### Pendientes que deja

- El detalle de publicación **sigue sin metadata**: es el slice 2 y es el hueco más caro que queda.
- Los pilares tampoco tienen título ni descripción propios.
- Las seis secciones del menú siguen llevando a un 404. No es SEO, pero un menú que ofrece seis
  puertas cerradas es peor para quien llega que para el buscador.

### Recap

El sitio ya se puede descubrir: `/sitemap.xml` lista las páginas fijas con contenido real, las 24
publicaciones con su fecha, la tienda y los perfiles reclamados, todo leído de la base en cada
petición; `/robots.txt` abre el contenido y cierra lo privado. Falta que cada página diga qué es.

### Próximos pasos (opciones)

1. **Slice 2 — Metadata por página.** El detalle de publicación primero: hoy comparte un enlace sin
   título, descripción ni imagen. Es lo que más se comparte y lo peor presentado.
2. **Slice 3 — Datos estructurados** (`Product`, `Store`, `Person`).
3. **Decidir qué pasa con las seis secciones stub:** darles contenido o quitarlas del menú.

---

## Slice 2 — Que cada página diga qué es (2026-08-01)

### Objetivo

Tapar el hueco más caro que dejó el slice 1: **el detalle de publicación no definía metadata**. Las
24 publicaciones compartían el título del layout ("Hazlo Sano") y salían sin descripción, sin
canónico y sin imagen. Compartir un producto por WhatsApp daba un enlace pelado — justo el gesto que
más hace un vendedor.

### Decisiones y por qué

**La descripción se corta en la última palabra completa.** La lee una persona, y
"Nopal, apio, piña y perej…" se ve como un error, no como un resumen. Escribiendo la prueba apareció
un desperdicio: cuando el corte caía **justo** donde terminaba una palabra, el algoritmo retrocedía
igual al espacio anterior y tiraba una palabra que sí cabía. Se corrigió y quedó cubierto.

**El contenido se aplana antes de resumirlo.** Llega de un `textarea` con los saltos de línea que le
puso quien publicó, que no son los que necesita una meta description.

**`getPostDetails` pasó a estar memorizada por petición.** Ahora la piden dos —`generateMetadata` y
la página—, así que sin `cache()` cada visita al detalle costaría el doble de consultas para leer
exactamente lo mismo.

**`type: "article"` también para los productos.** El vocabulario de comercio de Open Graph
(`product`) lo entienden pocos lectores; los datos de producto van en JSON-LD, que es lo que Google
lee, y eso es el slice 3.

**La tarjeta de Twitter se degrada sin imagen.** Pedir `summary_large_image` sin imagen deja un
hueco gris; sin media se usa `summary`.

**La metadata de un pilar sale de `PILLARS`**, la misma constante que pinta la página: si mañana
cambia el texto de un pilar, su descripción en el buscador cambia con él en vez de quedarse vieja.

**El `noindex` se hereda por layout.** `/auth/signin` es un Client Component y no puede exportar
`metadata`; y `/buscar` y `/search` tienen rutas de resultados anidadas. Un layout por sección lo
resuelve en un archivo en vez de en cuatro, y cubre las páginas que se agreguen después.

**`follow` se queda en `true`.** Que una página no se indexe no significa que sus enlaces no valgan.

### Archivos tocados

- **Dominio:** `src/domain/seo/description.ts` (+ prueba).
- **App:** `[slug]/metadata.ts` + `generateMetadata` en el detalle; `getPostDetails` memorizada; `pilares/metadata.ts` + `generateMetadata`; layouts `noindex` en `auth`, `buscar` y `search`; `metadata` en `/publicar`.
- **UI:** `src/infra/UI/metadata/noindex.ts`, la constante compartida.
- **e2e:** `src/e2e/seo/pageMetadata.spec.ts`.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run test:run` | **473 pruebas en 52 archivos**, todas verdes (+9) |
| `playwright test src/e2e/seo` | **8 escenarios verdes** (4 del slice 1 + 4 del 2) |

Los escenarios del detalle corren contra **"Jugo Verde", que ya existe** con su imagen: no siembran
nada y por eso no tienen nada que limpiar.

### Desviaciones del roadmap

- `/publicar` quedó fuera del escenario de `noindex`: sin sesión redirige a `/auth/signin`, así que
  probarla sería comprobar dos veces la misma página. Su `noindex` es la misma constante compartida.

### Pendientes que deja

- Sin datos estructurados todavía (slice 3): el buscador ve un artículo donde hay un producto con
  precio y disponibilidad.
- El home usa la descripción de i18n, que es más una frase de marca que una descripción de
  resultado de búsqueda. No se tocó por no cambiar copy sin pedirlo.

### Recap

Cada página pública ya dice qué es: el detalle de publicación lleva su título, su descripción
recortada del contenido, su imagen y su canónico; los cinco pilares tienen los suyos; y las páginas
de sesión, publicación y búsqueda piden explícitamente no ser indexadas. Con el slice 1, el sitio se
puede descubrir **y** presentar.

### Próximos pasos (opciones)

1. **Slice 3 — Datos estructurados** (`Product` con precio y disponibilidad, `Store` con sus
   coordenadas, `Person`, `Organization`). Es lo que convierte un resultado en una ficha rica.
2. **Decidir qué pasa con las seis secciones stub del menú:** darles contenido o quitarlas. Hoy son
   seis puertas cerradas para quien llega.
3. **Revisar la descripción del home**, que hoy es una frase de marca más que un resumen.

---

## Slice 3 — Que compartir y rastrear digan la verdad (2026-08-02)

### Objetivo

Revisar el SEO entregado contra el sitio de hoy. Entre el slice 2 y esta revisión entraron el i18n
con `/en` real, el catálogo por categorías y `/productos` de toda la comunidad, y eso **rompió cosas
que ya estaban entregadas**. Este slice no agrega SEO nuevo: arregla lo que estaba mintiendo.

### Lo que apareció al levantar el estado

**La vista previa de 8 publicaciones estaba rota.** `buildPostMetadata` tomaba `media[0].url` sin
mirar `media[0].type`, y de las 24 publicaciones **8 son video** (los anuncios de salud, justo los
de títulos en forma de pregunta y los más compartibles). Su `og:image` era un `.mp4`: WhatsApp
mostraba un hueco gris. El slice 2 se construyó para que compartir un producto se viera bien y
llevaba desde entonces fallando en un tercio del catálogo.

**Dos criterios opuestos de canónico conviviendo.** El home, `/nosotros`, `/productos` y los pilares
fijaban el canónico en español desde cualquier idioma —o sea, `/en/about`, que está traducida de
verdad, le pedía al buscador que la ignorara—, mientras `/categoria` y `/tienda` (escritas después,
ya con `pathnames`) se canonizaban a sí mismas. Y **ninguna** declaraba `hreflang`.

**Las dos legales apuntaban a direcciones que no existen:** `${CANONICAL_URL}/${locale}/…` producía
`/es/condiciones-de-servicio` —el español vive sin prefijo— y `/en/condiciones-de-servicio`, cuando
en inglés la ruta es `/en/terms-of-service`. Las dos, mal en los dos idiomas.

**`/og-image.jpg` no existe** en `public/`, y era la imagen de Open Graph de toda la paginación del
inicio.

### Decisiones y por qué

**Un video no es una imagen aunque las dos sean "media".** `buildSharePreview` elige la primera
imagen para `og:image`, manda el video a `og:video` y, cuando no hay imagen propia, cae al logo
**degradando la tarjeta a `summary`**: una tarjeta grande con un logo estirado se ve peor que una
pequeña con el logo entero. El día que una publicación traiga foto *y* video, gana la foto para la
imagen y el video se anuncia igual — está en la tabla de la corrida de escritorio.

**Cada idioma es canónico de sí mismo, salvo el detalle de publicación.** La regla que faltaba: si
la página existe de verdad en los dos idiomas, cada versión es la buena en el suyo y `hreflang`
explica que son la misma cosa; `x-default` va al español, que es lo que se sirve sin prefijo. **El
detalle de publicación queda fuera a propósito**: su texto sale de `post_translations`, que tiene 24
filas en español y 0 en inglés, así que `/en/<slug>` sigue apuntando al español y no declara pareja.
Es la misma razón por la que el sitemap solo lista español desde el slice 1.

**Las direcciones nunca se concatenan a mano.** `localizedAlternates` las resuelve con `getPathname`
desde `pathnames`, así que el día que un segmento se renombre, estas etiquetas cambian con él en vez
de quedarse apuntando a un 404 — que es exactamente el fallo que tenían las legales.

**El armado se partió en dos.** La composición de URLs es dominio puro (`buildLocalizedAlternates`,
`buildSharePreview`, y `absoluteUrl` extraída de `sitemap.ts` para no tener dos formas de pegar una
base con una ruta); solo la resolución por `pathnames` vive en infra. Así la regla se prueba sin
next-intl y la traducción de rutas se prueba con él, en una corrida de escritorio que falla si
alguien renombra un segmento.

**`max-image-preview: large` en el layout, no página por página.** En un sitio donde lo que se vende
entra por la foto, la miniatura de sello que Google pone por defecto es regalar el clic. Se hereda
en todas y **no** alcanza a las `noindex`, porque esas declaran su propio `robots` — y hay un
escenario que lo afirma, que era el riesgo real de ponerlo en el layout.

**De paso:** `products.backToList` salió del TSX (estaba escrito en español dentro del componente,
contra la norma de i18n) y el `meta()` de las pruebas se extrajo a `src/e2e/testUtils/metaTags.ts`.
Esa extracción no es cosmética: la versión que estaba copiada en el spec **se colgaba 90 segundos**
cuando la meta no existía, en vez de devolver `null`, así que afirmar que algo *no* se anuncia era
imposible. Se descubrió al escribir el escenario de la foto.

### Archivos tocados

- **Dominio:** `src/domain/seo/shareMedia.ts`, `alternates.ts`, `url.ts` (+ sus pruebas); `sitemap.ts` reusa `absoluteUrl`.
- **Infra:** `src/infra/UI/metadata/alternates.ts` (+ prueba), `DEFAULT_SHARE_IMAGE` en `constants`.
- **App:** `[slug]/metadata.ts` (imagen/video), `robots` en el layout de `[locale]`, y el canónico + `hreflang` en home, `/nosotros`, `/productos` (+ paginada), pilares, `/categoria` (+ paginada), `/tienda` (+ paginada), `/u` (+ paginada), las dos legales y la paginación del inicio. `site.webmanifest`.
- **i18n:** `products.backToList` en `es.json` y `en.json`.
- **e2e:** `src/e2e/seo/shareAndLanguage.spec.ts`, `src/e2e/testUtils/metaTags.ts`, escenarios `@slice-3` en `seo.feature` (y los `@future` renumerados a 4–7).

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **525 pruebas en 58 archivos**, todas verdes (+24) |
| `pnpm run test:e2e:run` | **74 escenarios verdes, 3 saltados**, 0 fallos |

De los 74, **17 son de `src/e2e/seo`** (4 del slice 1, 4 del 2 y 9 nuevos). Corren contra
publicaciones que ya existen —"Jugo Verde" con foto y "La clave para dormir profundo" en video—, así
que no siembran nada y no dejan nada que limpiar en la base compartida.

### Desviaciones del roadmap

- **El tamaño de página no se tocó.** En la revisión dije que eran 4 por página; ese es el valor de
  respaldo del código. `.env.development` y `.env.production` fijan **8**, así que 24 publicaciones
  son 3 páginas, no 6. Subirlo sería configuración, no código, y con este volumen no compra nada.
- `/tienda` y `/u` sí declaran pareja de idiomas aunque su texto (nombre y descripción del vendedor)
  sea de un solo idioma: la página **existe** en los dos y su URL cambia, que es justo el caso para
  el que sirve `hreflang`. Si algún día hay `seller_translations`, no cambia nada aquí.

### Pendientes que deja

- Sin datos estructurados todavía: es el slice 4 y sigue siendo el hueco más grande.
- Las categorías no están en el sitemap, y las 4 vacías (`abarrotes`, `frutas_y_verduras`,
  `sueno_y_descanso`, `movimiento_y_ejercicio`) responden 200 con lista vacía, enlazadas desde el
  menú. Slice 5.
- Las seis secciones stub del menú siguen siendo 404 enlazados desde todas las páginas.
- `lastModified` sigue siendo `created_at`: `posts` no tiene `updated_at`, y ponerlo es una
  migración Alembic en el backend Python.

### Recap

Lo que el sitio le cuenta a un buscador y a WhatsApp ya es cierto: una publicación en video anuncia
una imagen y declara su video aparte, cada página traducida es canónica de sí misma y dice cuál es
su hermana en el otro idioma, las legales dejaron de apuntar a direcciones inexistentes, y las
publicaciones piden vista previa de imagen grande sin que eso alcance a las páginas que piden no ser
indexadas. Con los slices 1 y 2, el sitio se puede descubrir, se presenta **y** no se contradice.

### Próximos pasos (opciones)

1. **Slice 4 — Datos estructurados.** `Product` con precio y disponibilidad (14 productos listos),
   `LocalBusiness` con la sucursal de Tezonapa y sus coordenadas, `VideoObject` para los 8 videos,
   `Organization` + `WebSite` + `BreadcrumbList`. Es lo que más rinde y sirve igual para GEO.
2. **Slice 5 — Categorías al sitemap y `noindex` a las vacías.**
3. **Slice 7 — GEO**, si prefieres empezar por ahí: robots por rastreador de IA y `llms.txt` son un
   rato; **las transcripciones de los 8 videos** son la palanca grande y no son código — se pueden
   ir produciendo en paralelo desde ya.
4. **Decidir qué pasa con las seis secciones stub del menú.** Sigue pendiente desde el slice 1.

---

## Slice 4 — Que el buscador entienda qué vende quién (2026-08-02)

### Objetivo

Los slices 1–3 consiguieron que el sitio se descubra, se presente y no se contradiga. Faltaba lo
que convierte un resultado en una ficha: **decirle al buscador qué es cada cosa**. Había material
sin usar — 14 productos con precio y disponibilidad, una sucursal con coordenadas, 8 videos, un
perfil reclamado— y ni una línea de datos estructurados.

### Decisiones y por qué

**Un producto es `Product` con su `Offer`; lo demás es `Article`.** Es la diferencia entre aparecer
como texto y aparecer con precio. La disponibilidad se declara **también cuando está agotado**
(`OutOfStock`): esconderla haría que el buscador siguiera ofreciendo algo que no hay, que es peor
para quien llega que un "agotado" honesto.

**Sin precio no se declara oferta.** Un `Offer` sin `price` es un dato inválido, y hoy los 10
anuncios no tienen precio. Se omite la propiedad en vez de inventar un cero.

**El video va como nodo aparte, no como propiedad.** 8 de las 24 publicaciones son video y su
contenido entero está ahí dentro: para un buscador esa página es un título y cuatro líneas. Con
`VideoObject` al menos existe el video, su archivo y su fecha. **Su miniatura es hoy el logo**,
porque no se guarda un fotograma; queda anotado abajo.

**La tienda es `LocalBusiness` con `geo`.** Las coordenadas ya estaban en la base —el chatbot las
usa para el radio de cercanía—, así que publicarlas no costó nada y es lo que convierte "una
tienda" en "una tienda **en Tezonapa**". La primera sucursal manda en `address`/`geo` y las demás
van en `location`: aguanta la realidad de hoy (una) sin romperse el día que haya tres.

**La dirección no se parte.** Se guarda como una línea que escribió el vendedor y se publica tal
cual en `streetAddress`. Adivinar calle, colonia y municipio con expresiones regulares produce una
dirección mal partida, que es peor que una completa en un solo campo.

**`sameAs` en la organización.** Es la parte que hace trabajo de verdad: le dice al buscador —y a un
asistente— que la cuenta de TikTok, la de Facebook y este dominio son **la misma** Hazlo Sano. Los
enlaces viven en `BRAND_SOCIAL_URLS`; los mismos están escritos en el pie con su icono, y unificar
las dos listas es un pendiente aparte.

**El `<` se escapa siempre al serializar.** El texto de una publicación lo escribe la comunidad, y
basta con teclear `</script>` en la descripción de un producto para cerrar la etiqueta antes de
tiempo y dejar el resto como HTML ejecutable. Está cubierto por una prueba con esa carga exacta.

**`BreadcrumbList` se movió al slice 5.** Google pide que los datos estructurados reflejen algo que
la página muestra, y la miga de pan visible es del slice 5. Declararla antes sería marcado sin
respaldo.

**El mapeo vive en la ruta, el vocabulario en el dominio.** `buildPostJsonLd` recibe datos
concretos y no sabe nada del tipo `Post`, que es laxo y está lleno de opcionales; quien lo lee es
`[slug]/jsonLd.ts`. La imagen y el video salen del **mismo** `buildSharePreview` que arma Open
Graph, así que lo que se comparte y lo que se declara no pueden divergir.

**De paso:** la etiqueta de categoría estaba calculada dos veces (la pinta el detalle, la declara el
JSON-LD) y pasó a `postCategoryLabel`; y el `"MXN"` escrito a mano en `PostDetail` es ahora
`SITE_CURRENCY`, el mismo que usa la oferta.

### Archivos tocados

- **Dominio:** `src/domain/seo/jsonLd/{types,post,store,site}.ts` (+ pruebas); `ensureAbsoluteUrl` en `url.ts`.
- **Presentación:** `src/presentation/seo/JsonLd.tsx` (+ prueba) — el primer componente que estrena `src/presentation/`.
- **App:** `[slug]/jsonLd.ts` y `[slug]/categoryLabel.ts`; JSON-LD en el detalle, la tienda, el perfil y el home.
- **Infra:** `SITE_CURRENCY` y `BRAND_SOCIAL_URLS` en `constants`.
- **e2e:** `src/e2e/seo/structuredData.spec.ts`, escenarios `@slice-4` en `seo.feature`.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run test:run` | **548 pruebas en 62 archivos**, todas verdes (+23) |
| `pnpm run test:e2e:run` | **79 escenarios verdes, 3 saltados**, 0 fallos |

Los 5 escenarios nuevos corren contra "Jugo Verde", "La clave para dormir profundo", la tienda
`hazlo-sano` y el inicio: nada sembrado, nada que limpiar.

### Lo que costó tiempo y no debería costarlo dos veces

Una corrida intermedia dio dos rojos —la tienda sin `LocalBusiness` y un pilar sin título— que **no
existían**. La causa: había un `next dev` de depuración corriendo a la vez que el de Playwright, y
los dos escriben el mismo `.next`; el HTML servido era una mezcla rancia. Con un solo servidor los
mismos escenarios pasan. Si aparece un fallo imposible, lo primero es comprobar que no haya dos
servidores vivos.

De ahí salió un escenario que vale la pena: **el JSON-LD se comprueba también por HTTP directo**,
sin navegador. En el DOM el script aparece igual aunque lo hubiera puesto la hidratación, y quien
rastrea suele leer solo la respuesta del servidor.

### Desviaciones del roadmap

- `BreadcrumbList` sale de este slice y entra al 5, con la miga visible (explicado arriba).
- Se agregó `Article` para los anuncios, que no estaba escrito en el roadmap: dejar 10 de 24
  publicaciones sin ningún tipo declarado, teniendo el constructor delante, no tenía sentido.

### Pendientes que deja

- **Los `VideoObject` llevan el logo como miniatura.** No se guarda un fotograma del video. Generar
  un póster al subir (o extraerlo con ffmpeg para los 8 existentes) mejora la ficha y la tarjeta al
  compartir.
- `BRAND_SOCIAL_URLS` y los enlaces del pie son la misma lista escrita dos veces.
- Sigue faltando la migación de categorías al sitemap y el `noindex` de las vacías (slice 5).
- El `Product` no declara vendedor cuando la publicación no trae autor con nombre; con
  `posts.seller_id` disponible se podría atar el producto a su `LocalBusiness`.

### Recap

Un buscador que entra hoy al sitio ya no ve texto suelto: ve productos con precio, moneda y
disponibilidad; artículos con su fecha y su autor; videos con su archivo; una tienda con dirección y
coordenadas en Tezonapa; personas con su página; y una organización con sus perfiles públicos atada
al sitio que publica. Todo eso viaja en el HTML del servidor, así que lo lee igual quien no ejecuta
JavaScript — que es la mitad del asunto para GEO.

### Próximos pasos (opciones)

1. **Slice 5 — Categorías descubribles:** las 6 con contenido al sitemap, `noindex` a las 4 vacías y
   miga de pan visible con su `BreadcrumbList`.
2. **Slice 6 — Enlaces internos:** relacionadas por embedding y enlaces a categoría, tienda y autor
   desde el detalle. Hoy el `<h2>` de relacionadas sigue vacío.
3. **Slice 7 — GEO:** robots por rastreador de IA, `llms.txt`, transcripción de los 8 videos.
4. **Fuera de SEO, pendiente de tu decisión:** qué hacer con las seis secciones stub del menú.

---

## Slice 5 — Que las categorías se puedan descubrir (2026-08-02)

### Objetivo

El catálogo por categorías llegó después del slice 1, así que el sitemap ni sabía que existía: seis
páginas con contenido real invisibles para un buscador. Y al revés, las cuatro categorías activas
sin publicaciones respondían 200 con una lista vacía, enlazadas desde el menú. Faltaba además la
miga de pan, que es lo que permite declarar el `BreadcrumbList` que se pospuso en el slice 4.

### Decisiones y por qué

**Quién entra al sitemap lo decide la consulta, no una lista a mano.** Una categoría entra si
existe **al menos una publicación** en ella o en su sub-categoría (`EXISTS` sobre `posts`, filtrando
por `is_active`). Hoy pasan 6 de 10. Escrito a mano, el día que alguien publique en `abarrotes`
nadie se acordaría de añadirla; así se añade sola.

**Lo vacío pide `noindex` en vez de desaparecer.** La categoría existe a propósito —el menú la
enseña y se llenará—, así que no puede responder 404 como una clave inventada. Pero tampoco es
contenido: una lista hueca compite contra las páginas que sí tienen algo. `noindex` es exactamente
eso, "existe pero no la indexes", y **se quita solo** en cuanto haya una publicación, sin que nadie
toque código.

**La miga se pinta y se declara desde la misma lista.** `categoryBreadcrumbs` y `postBreadcrumbs`
devuelven las dos formas a la vez: los `href` tipados de next-intl para la vista y las URL
absolutas para el JSON-LD. Google pide que los datos estructurados reflejen lo que la página
enseña; calculadas por separado, un cambio en una se olvidaría en la otra.

**El camino sale de la jerarquía real, no de una constante.** `categoryTrail` sube por `parentKey`,
así que `panaderia` da `Inicio › Alimentación › Panadería` porque *así está en la base*. Se recorre
en bucle aunque el catálogo tenga dos niveles impuestos por un trigger: el día que sean tres, esto
sigue valiendo.

**El helper vive en `src/app/[locale]/`, no dentro de una ruta.** Lo usan el catálogo de una
categoría y el detalle de una publicación; dejarlo en `categoria/[key]/` habría obligado al detalle
a importar desde otra ruta, que es justo lo que la norma de ubicación evita.

**`Breadcrumbs` no lee el catálogo de traducciones.** Recibe las etiquetas ya resueltas, incluida
la de accesibilidad. Es un componente de `src/presentation/`: tiene que poder pintarse desde
cualquier ruta y en cualquier idioma sin arrastrar el contexto de i18n.

**Una miga de un solo paso no se declara ni se pinta.** "Inicio" a secas no es un camino; el
constructor devuelve `null` y el componente no pinta nada.

**Fuera de SEO, en la misma corrida: las seis secciones stub salieron del menú.** Eran seis 404
enlazados desde el header de todas las páginas. Se ocultan con un `published: false`, no se borran.
El detalle está en `docs/features/secciones-comunidad-bitacora.md`.

### Archivos tocados

- **Dominio:** `categoryTrail` en `entities/post/taxonomy.ts`; `seo/jsonLd/breadcrumbs.ts` (+ prueba); `categories` en `seo/sitemap.ts` (+ pruebas).
- **Infra:** la consulta de categorías con publicaciones en `PostgresSitemapRepository`.
- **Presentación:** `src/presentation/navigation/Breadcrumbs.tsx` (+ prueba).
- **App:** `[locale]/breadcrumbs.ts` (el armado compartido); miga y `BreadcrumbList` en la categoría y en el detalle; `noindex` de la categoría vacía en su `metadata.ts`.
- **i18n:** `common.home` y `common.breadcrumb` en los dos catálogos.
- **e2e:** `src/e2e/seo/categories.spec.ts`, escenarios `@slice-5` en `seo.feature`.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **558 pruebas en 65 archivos**, todas verdes (+10) |
| `pnpm run test:e2e:run` | **83 escenarios verdes, 3 saltados**, 0 fallos (+4) |

Los escenarios nuevos corren contra la taxonomía real —`alimentacion` y `panaderia` con
publicaciones, `abarrotes` y `movimiento_y_ejercicio` vacías— y contra "Pan de Masa Madre Natural".
Nada sembrado.

### Desviaciones del roadmap

- El `BreadcrumbList` que el roadmap ponía en el slice 4 se entregó aquí, junto a la miga visible,
  tal como se anotó al cerrar aquel slice.
- La miga **no** se puso en la tienda ni en el perfil: su camino sería `Inicio › la propia página`,
  un solo paso, que no aporta nada. Entra cuando exista un directorio de tiendas del que colgar.

### Pendientes que deja

- Las páginas paginadas de categoría (`/categoria/<key>/page/2`) no llevan miga; la primera sí.
  Es coherente con que el canónico ya distingue página, pero conviene revisarlo si alguna categoría
  crece.
- Sigue sin tocarse el bloque de relacionadas del detalle: es el slice 6.

### Recap

El catálogo por categorías ya es descubrible: las seis con contenido están en el sitemap y las
cuatro vacías piden explícitamente no ser indexadas hasta que tengan algo. Quien aterriza en una
publicación desde un buscador ve el camino que no recorrió —`Inicio › Panadería › Pan de Masa Madre
Natural`— y puede subir por él; el buscador lee esa misma miga en JSON-LD. Y el header dejó de
ofrecer seis puertas cerradas.

### Próximos pasos (opciones)

1. **Slice 6 — Enlaces internos:** relacionadas por embedding (el vector ya está en
   `post_translations`) y enlaces del detalle a su categoría, su tienda y su autor. Hoy el `<h2>`
   de relacionadas sigue vacío.
2. **Slice 7 — GEO:** robots por rastreador de IA, `llms.txt` y la transcripción de los 8 videos.
3. **Directorios de productores y negocios locales** (`docs/features/secciones-comunidad.md`), que
   ya pueden heredar la regla de sitemap que fijó este slice.
