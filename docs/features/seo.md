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

### Slice 3 — Que el buscador entienda qué vende quién  *(siguiente)*

- JSON-LD: `Product` con precio y disponibilidad, `Store` con sus sucursales y coordenadas,
  `Person` para los perfiles, `Organization` + `WebSite` en el home.

**Criterios de aceptación:**
1. Un producto expone precio y disponibilidad en datos estructurados válidos.
2. Una tienda con sucursal expone su dirección y coordenadas.

## Enfoque de pruebas

- **Unit (Vitest):** armado de las entradas del sitemap a partir de datos (puro, sin base) y de la
  descripción recortada del contenido.
- **Behavior (Playwright):** `/sitemap.xml` y `/robots.txt` como documentos, comprobando que lo
  sembrado aparece y que lo privado y los 404 no.
