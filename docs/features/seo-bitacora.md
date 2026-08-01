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
