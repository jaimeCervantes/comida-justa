# Feature: SEO — que el sitio se pueda encontrar

Roadmap de slices para que lo que publica la comunidad sea **descubrible**: que los buscadores
sepan qué páginas existen, qué es cada una y cuáles no deben indexar.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/seo-bitacora.md`.

## Problema / Savings / Why

- **Problema:** el sitio no tiene `sitemap.ts` **ni** `robots.ts`, así que un buscador solo
  encuentra lo que esté enlazado desde otra página que ya conozca. Y **la página más importante no
  dice qué es**: `src/app/[locale]/[slug]/page.tsx` —el detalle de cada publicación, 24 hoy y todo
  lo que se publique— no define `generateMetadata`, así que hereda el título genérico del layout
  ("Hazlo Sano") y no tiene descripción, canónico ni imagen para compartir. Un producto compartido
  en WhatsApp se ve como un enlace pelado.
- **Savings:** es tráfico que ya está pagado. El contenido existe, las páginas existen y son
  rápidas; falta decirle al buscador que están ahí. Para el vendedor es la diferencia entre que lo
  encuentren buscando "pan de masa madre Tezonapa" o solo por el enlace que él reparta.
- **Why:** la feature de vendedores construyó tiendas y perfiles para que la gente llegue a ellos.
  Sin descubrimiento, cada tienda depende de que su dueño reparta el enlace a mano — justo el
  trabajo que la tienda venía a ahorrar.

## Estado al empezar (2026-08-01)

| | |
|---|---|
| `sitemap.ts` / `robots.ts` | **no existen** |
| Rutas públicas con metadata | home, `/productos`, `/nosotros`, legales, tienda, perfil |
| Rutas públicas **sin** metadata | **detalle de publicación**, `/pilares` y sus 4 hijas |
| Rutas privadas que no deben indexarse | `/cuenta`, `/editar/*` (ya `noindex`), `/publicar`, `/auth/*`, `/admin/*`, `/buscar`, `/search` |
| Contenido en la base | 24 publicaciones (todas con traducción `es`), 1 tienda, 0 perfiles con username |

**Seis secciones del menú son stubs que responden 404** (`habitos`, `deportes`, `medio-ambiente`,
`negocios-locales`, `salud-infantil`, `productores-locales`). No entran al sitemap: publicar un 404
en el sitemap es la forma más rápida de perder confianza con un rastreador.

## Decisiones de alcance

**Solo el español entra al sitemap.** `localePrefix` es `as-needed`, así que el español vive sin
prefijo y el inglés en `/en/...`. Pero **las 24 publicaciones tienen únicamente traducción `es`**:
`/en/jugo-verde` renderiza el mismo texto en español con el marco en inglés, o sea una página
duplicada y delgada. Se listan las URL canónicas en español; el día que exista traducción real se
agregan con `alternates.languages`.

**El sitemap se arma con la base, no a mano.** Publicaciones, tiendas y perfiles salen de una
consulta; las páginas fijas, de una lista. Un sitemap escrito a mano nace desactualizado.

## Slices

### Slice 1 — Que se pueda descubrir  *(entregado)*

- `src/app/sitemap.ts`: páginas fijas + todas las publicaciones + tiendas + perfiles reclamados,
  con `lastModified` real donde la base lo tiene.
- `src/app/robots.ts`: todo permitido salvo lo privado y lo que no aporta (`/cuenta`, `/editar`,
  `/publicar`, `/admin`, `/api`, `/auth`, `/buscar`, `/search`), y el enlace al sitemap.
- `metadataBase` en el layout raíz, para que las imágenes relativas de Open Graph resuelvan solas.
- **De paso, fuera de SEO:** `/nosotros` deja de estar encajonada — hoy suma `container-width` y
  `max-w-4xl mx-auto` **dentro** del `container-width` del layout.

**Criterios de aceptación:**
1. `/sitemap.xml` responde y lista el home, `/productos`, `/nosotros`, los 5 pilares y las legales.
2. Lista cada publicación por su slug real, con su fecha.
3. Lista las tiendas y los perfiles que existan.
4. **No** lista ninguna de las seis secciones que responden 404, ni nada privado.
5. `/robots.txt` responde, bloquea lo privado y apunta al sitemap.

### Slice 2 — Que cada página diga qué es  *(entregado)*

- `generateMetadata` en el **detalle de publicación**: título real, descripción a partir del
  contenido, imagen de su media para compartir, canónico propio.
- Metadata para `/pilares` y sus cuatro hijas.
- `noindex` explícito en `/publicar`, `/auth/signin`, `/buscar` y `/search`.

**Criterios de aceptación:**
1. El detalle de un producto tiene su título, su descripción y su imagen al compartirlo. ✅
2. Cada pilar tiene título y descripción propios. ✅
3. Las páginas de sesión y búsqueda no se indexan. ✅

### Slice 3 — Que compartir y rastrear digan la verdad  *(entregado)*

Revisión del 2026-08-02: el sitio cambió debajo de los slices 1 y 2 —i18n con `/en` real, catálogo
por categorías, `/productos` de toda la comunidad— y aparecieron defectos en lo ya entregado. Este
slice no agrega SEO nuevo: arregla lo que estaba mintiendo.

- **La imagen de compartir depende del tipo de medio.** `media[0].url` iba a `og:image` sin mirar
  el tipo, y **8 de las 24 publicaciones son video**: su vista previa en WhatsApp era un hueco. El
  video se anuncia en `og:video` y la imagen cae al logo, con la tarjeta degradada a `summary`.
- **Una sola imagen de respaldo** (`DEFAULT_SHARE_IMAGE`). Había dos formas escritas a mano: el
  dominio completo repetido en cuatro archivos y un `/og-image.jpg` que **no existe** en `public/`,
  así que la paginación del inicio compartía un 404.
- **Canónico por idioma y `hreflang`.** El home, `/nosotros`, `/productos` y los pilares fijaban el
  canónico en español desde cualquier idioma; `/categoria` y `/tienda` hacían lo contrario. Y las
  legales apuntaban a `/es/condiciones-de-servicio` y `/en/condiciones-de-servicio`, dos direcciones
  que **no existen**. Ahora cada página traducida es canónica de sí misma y declara su pareja, con
  `x-default` en español.
- **El detalle de publicación se queda como está:** su contenido solo existe en español, así que
  `/en/<slug>` sigue apuntando al español y no declara pareja.
- **`max-image-preview: large`** (más `max-snippet` y `max-video-preview` sin tope) en el layout.
- **`site.webmanifest`** tenía `name` y `short_name` vacíos.

**Criterios de aceptación:**
1. Compartir una publicación en video muestra una imagen, y el `.mp4` va en `og:video`. ✅
2. Compartir una publicación con foto sigue mostrando su foto en tarjeta grande. ✅
3. Cada página traducida es canónica de sí misma y declara `es`, `en` y `x-default`. ✅
4. `/en/<slug>` apunta al español y no declara pareja de idiomas. ✅
5. Las páginas públicas piden `max-image-preview:large`; las `noindex` no lo heredan. ✅

### Slice 4 — Que el buscador entienda qué vende quién  *(entregado)*

- JSON-LD: `Product` con su `Offer` (precio, MXN, disponibilidad), `Article` para los anuncios,
  `VideoObject` para los 8 en video, `LocalBusiness` con dirección y coordenadas de sus sucursales,
  `Person` en los perfiles y `Organization` + `WebSite` en el home.
- `BreadcrumbList` **se movió al slice 5**, donde vive la miga de pan visible: Google pide que los
  datos estructurados reflejen algo que la página muestra, y hoy no la muestra.

**Criterios de aceptación:**
1. Un producto expone precio y disponibilidad en datos estructurados válidos. ✅
2. Una tienda con sucursal expone su dirección y coordenadas. ✅
3. Un anuncio en video declara su `VideoObject` con el archivo y su fecha. ✅
4. El home dice quién publica el sitio y ata el sitio a su editor. ✅
5. Todo eso viaja en el HTML del servidor, no solo tras hidratar. ✅

### Slice 5 — Que las categorías se puedan descubrir  *(entregado)*

- Las categorías **con contenido** entran al sitemap (hoy 6 de 10: `alimentacion`, `platillos`,
  `bebidas`, `panaderia`, `untables`, `jugos`). El filtro lo hace la consulta, no una lista a mano.
- Las 4 vacías responden 200 con una lista vacía y están enlazadas desde el menú: piden `noindex`
  mientras no tengan nada, y vuelven solas al índice en cuanto alguien publique.
- Miga de pan **visible** en la categoría y en el detalle de publicación, con su `BreadcrumbList`
  —el que se pospuso en el slice 4 justamente por esto.

**Criterios de aceptación:**
1. El sitemap lista las categorías con publicaciones y ninguna vacía. ✅
2. Una categoría vacía pide `noindex`; una con contenido, no. ✅
3. La categoría enseña `Inicio › Alimentación › Panadería` y lo declara en ese orden. ✅
4. Desde una publicación se puede subir a su categoría y al inicio. ✅

### Slice 6 — Que una publicación lleve a las demás  *(siguiente)*

- El bloque «relacionadas» del detalle es hoy un `<h2>` vacío. `post_translations.embedding` ya
  existe, así que las relacionadas semánticas son casi gratis.
- Enlaces desde el detalle a su categoría, su tienda y su autor: hoy no hay ninguno.

### Slice 7 — GEO

- Política explícita por rastreador de IA en `robots.txt` (`GPTBot`, `OAI-SearchBot`, `ClaudeBot`,
  `PerplexityBot`, `Google-Extended`…), permitiendo el contenido y cerrando lo privado.
- `/llms.txt` con el índice del sitio en texto.
- **Transcripción de los 8 videos**, que es la palanca más grande y la única que no es código: hoy
  esas páginas tienen título, ~500 caracteres y un archivo que ni un buscador ni un modelo pueden
  leer.
- Feed (RSS/JSON) para la ingesta de contenido nuevo.

## Enfoque de pruebas

- **Unit (Vitest):** armado de las entradas del sitemap a partir de datos (puro, sin base) y de la
  descripción recortada del contenido.
- **Behavior (Playwright):** `/sitemap.xml` y `/robots.txt` como documentos, comprobando que lo
  sembrado aparece y que lo privado y los 404 no.
