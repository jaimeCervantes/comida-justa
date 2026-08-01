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
