# Feature: las seis secciones del menú — de 404 a contenido

Las seis entradas de «Comunidad» (`habitos/grupos`, `salud-infantil`, `medio-ambiente`,
`productores-locales`, `negocios-locales`, `deportes`) son hoy stubs que llaman a `notFound()`.
Este documento es el **checkpoint de revisión** antes de escribir nada: qué es cada una de verdad,
qué se resuelve con lo que ya existe, qué falta, y dónde encaja con el roadmap de SEO que está en
marcha (`docs/features/content/003-2026-08-01-seo.md`).

Escrito el **2026-08-02**, con los datos de la base a esa fecha.

## Problema / Savings / Why

- **Problema:** el menú principal ofrece seis puertas y las seis están cerradas. Quien llega hace
  clic y recibe un 404; un rastreador hace lo mismo desde **todas** las páginas del sitio, porque
  los enlaces están en el header. Y las secciones que sí valdrían —quién produce y quién vende
  cerca— no existen en ninguna parte, aunque la gente ya se registre, abra su tienda y publique.
- **Savings:** dos de las seis se resuelven **sin modelo nuevo y sin migración** con datos que ya
  están en la base. Las otras cuatro son contenido, que es trabajo de redacción, no de plataforma.
  Y quitar seis 404 del header es media hora que recupera todo el enlazado interno del sitio.
- **Why:** los 4 pilares dicen **qué** queremos lograr; estas secciones son **cómo se hace en tu
  pueblo**. Sin ellas, el sitio explica la teoría y deja al visitante sin el paso siguiente.

## Estado al escribir (2026-08-02)

| | |
|---|---|
| Secciones que responden 404 | **6**, enlazadas desde el header en todas las páginas |
| Publicaciones | 24 (14 productos, 10 anuncios) |
| Publicaciones con `origin` de productor o negocio **local** | **0** (todas son `hazlo_sano_*` o `null`) |
| Tiendas | **1** (`hazlo-sano`), con 1 sucursal |
| Perfiles reclamados | **1** (`jaime-cervantes`) |
| Entidad para grupos o lugares deportivos | **no existe** |

## Las seis no son la misma cosa

Leyendo la descripción que cada una ya tiene en el menú (`nav.community` en `es.json`):

| Sección | Su propia descripción | Naturaleza |
|---|---|---|
| Productores locales | "Apoyo a la producción local" | **directorio** |
| Negocios locales | "Guía a negocios locales" | **directorio** |
| Grupos | "Grupos locales, donde te apoyan a alcanzar tus metas" | directorio, sin datos |
| Deportes | "Dónde practicar deportes con personas que te animan" | directorio de lugares + contenido |
| Salud infantil | "Es injusto fomentar una alimentación dañina" | **contenido**, como un pilar |
| Medio ambiente | "Impacto para las generaciones futuras" | **contenido**, como un pilar |

Meterlas todas en el mismo molde —cuatro artículos más dos— sería construir de más en un lado y de
menos en el otro.

## Lo que el modelo ya soporta

**El vocabulario de procedencia ya distingue quién produce.**
`src/domain/entities/post/origin.ts` usa el patrón `{rol}_{ámbito}` y declara `productor_local`,
`reventa_local`, `productor_foraneo` y `reventa_foranea`, con `isLocalOrigin()` incluido. Se
persiste como `text` validado contra una allowlist, así que **no hay migración que hacer**.

**Pero `origin` describe la publicación, no al vendedor** — y ahí estaba el error del primer
borrador de este documento, que definía "negocios locales" como `reventa_local`:

- Un restaurante del pueblo **cocina** lo que vende: publicaría `productor_local` y aun así es un
  negocio local.
- Una tienda de abarrotes que revende producto foráneo publica `reventa_foranea` y **sigue siendo un
  negocio del pueblo**.
- La localidad de un negocio no cambia según lo que venda ese día.

**Tampoco hace falta un `venta_local` nuevo.** El eje `rol` responde "¿quién lo produjo?"
(`hazlo_sano` / `productor` / `reventa`); un valor genérico de "venta" no responde ninguna pregunta
distinta y se solaparía con `reventa_local` — dos valores que nadie sabría cuándo elegir es peor que
uno solo. Y hoy **ninguna publicación usa todavía los orígenes locales**, así que ampliar el
vocabulario sería adivinar sin datos.

La definición que sí se sostiene:

- **Negocios locales = las tiendas.** `sellers` con su `slug`: quien abrió tienda en el pueblo, sin
  importar qué venda. Es lo que dice la palabra y es lo que ya está modelado.
- **Productores locales = quienes publican con `productor_local`**, un subconjunto de los
  anteriores. Que se solapen está bien: un productor también es un negocio local, y la sección
  existe para destacar a quien **hace** lo que vende.

Si algún día hace falta separar por tipo de negocio (restaurante, abarrotes, taller), eso es un
campo de `sellers` —migración Alembic en el backend Python—, no un `origin` más.

**Lo que falta es el sentido del directorio.** Un directorio lista **a quién**, no qué: hace falta
una consulta de vendedores/perfiles que tengan publicaciones con ese origen, hermana de
`getPostsBySeller`.

**Grupos y deportes no tienen entidad.** Un grupo de caminata no es una tienda ni una publicación.
Crearla es una migración Alembic en el backend Python, y no se justifica para cero filas.

## Decisiones de alcance

**Ninguna sección se publica sin su cabecera de contenido.** Hoy los dos directorios saldrían
**vacíos** (0 publicaciones con origen local). Una página que responde 200 con una lista vacía es
justo el contenido delgado que el slice 5 de SEO va a marcar `noindex` en las categorías: no tiene
sentido crear el problema en una sección y arreglarlo en otra. Cada sección lleva **arriba su
texto —por qué comprar local, con sus estudios— y debajo el directorio**, que mientras esté vacío
invita a publicar. Así la página vale desde el primer día y se llena sola después.

**Las referencias científicas las aporta el usuario.** Como los ~40 DOIs por pilar de
`pilares/components/references.ts`. No se inventan citas ni se rellenan con fuentes sin verificar;
mientras no lleguen, los slices de contenido están **bloqueados a propósito**.

**Grupos y deportes empiezan a mano.** Lista escrita en datos (como `PILLARS`) y un "propón el
tuyo" por WhatsApp. La entidad en la base se crea cuando mantener la lista a mano canse, no antes.

**`/habitos` es un caso aparte:** el menú apunta a `/habitos/grupos`, así que la sección padre
existe solo para colgar `grupos`. Si grupos se queda a mano, `habitos` puede desaparecer del menú
en vez de convertirse en una tercera página vacía.

## Slices

### Slice 0 — Que el menú deje de mentir  *(entregado el 2026-08-02)*

Las seis entradas dejan de enlazar a 404. Dos caminos, y el segundo es el bueno mientras no haya
contenido: **ocultar del menú lo que no existe** y volver a mostrarlo conforme se entregue cada
sección.

**Criterios de aceptación:**
1. Ningún enlace del header lleva a una ruta que responde 404. ✅
2. Los escenarios de `src/e2e/seo/seo.spec.ts` que afirman que esas rutas son 404 siguen verdes
   (son un recordatorio deliberado del slice 1 de SEO: el día que dejen de serlo, fallan y avisan
   de que hay que meterlas al sitemap). ✅

**Cómo se resolvió:** cada entrada de `COMMUNITY_ITEMS` lleva ahora un `published`, hoy en `false`
en las seis, y los menús leen `VISIBLE_COMMUNITY_ITEMS`. **No se borró nada**: la lista es el plan
de este documento, y publicar una sección es poner su `published` en `true` — y acordarse entonces
de meterla a `STATIC_SITEMAP_PATHS`, que es lo que recuerda el escenario de los 404. El rótulo
«Secciones» del desplegable desaparece mientras no haya ninguna publicada; el menú «Comunidad»
sigue teniendo publicaciones, productos y las categorías.

### Slice 1 — Productores y negocios locales  *(entregado el 2026-08-02)*

- **Negocios locales:** el directorio de tiendas (`sellers` con `slug`), paginado como el resto.
- **Productores locales:** las tiendas —o los perfiles— con al menos una publicación de origen
  `productor_local`. Es una consulta sobre el mismo listado, con un `EXISTS`.
- Dos páginas con la misma plantilla y distinto filtro, cada una con su cabecera de contenido y su
  estado vacío ("aún no hay ninguno registrado — abre tu tienda").
- Entran al sitemap **solo cuando tengan contenido** (la regla del slice 5 de SEO).
- `LocalBusiness`/`ItemList` en JSON-LD reusando lo del slice 4 de SEO.

**Criterios de aceptación:**
1. Una tienda aparece en negocios locales por existir; aparece **además** en productores locales
   solo si publica algo con `productor_local`. ✅
2. Con cero resultados la página explica la sección e invita a publicar; no es una lista hueca. ✅
3. La página no entra al sitemap mientras esté vacía. ✅

**Lo que quedó fuera a propósito:** las dos secciones **no paginan** todavía —con una tienda, una
paginación es una promesa vacía— y el directorio lista **tiendas**, no perfiles: quien produce sin
abrir tienda no aparece, y el enlace de "abre tu tienda" es justo la invitación a hacerlo.

### Slice 2 — Salud infantil *(bloqueado: referencias)*

Artículo con la estructura de un pilar (`PillarArticle` + `PillarReferences` ya son reutilizables),
con su metadata, su canónico y sus DOIs.

### Slice 3 — Medio ambiente *(bloqueado: referencias)*

Igual que el anterior. Enlaza con los directorios locales: el argumento ambiental del consumo local
es el mismo que sostiene la sección de productores.

### Slice 4 — Deportes *(bloqueado: referencias)*

Contenido + lista de lugares y grupos a mano. Ojo con el solapamiento: el pilar «Movimiento» ya
cubre el porqué, así que esta sección debe responder **dónde y con quién**, o serán dos páginas
compitiendo por lo mismo.

### Slice 5 — Grupos

Lista a mano y formulario de propuesta. Se decide entonces si `habitos` vuelve al menú.

## Dónde encaja con el SEO en marcha

| Momento | Qué |
|---|---|
| **Ahora, en paralelo** | **Slice 0** (menú). Es SEO puro: seis 404 enlazados desde todas las páginas. No depende de nada. |
| Después del slice 5 de SEO | **Slice 1** (directorios). El slice 5 de SEO define la regla de "solo entra al sitemap lo que tiene contenido" y el `noindex` de lo vacío; los directorios la heredan en vez de inventar la suya. |
| Cuando lleguen las referencias | **Slices 2–4** (contenido). No compiten con el SEO: son redacción, y cada artículo publicado es una página más que el slice 7 (GEO) puede aprovechar. |
| Al final | **Slice 5** (grupos). |

Lo que **no** conviene es intercalar los artículos ahora: el trabajo de SEO que queda (categorías,
enlaces internos, GEO) mejora todas las páginas del sitio a la vez, incluidas las secciones que
aún no existen. Hacerlas antes solo significa volver a pasar por ellas.

## Pendiente del usuario

- **Las referencias científicas** de salud infantil, medio ambiente y deportes. Sin ellas, los
  slices 2–4 no arrancan.
- **Confirmar el slice 0:** ocultar del menú lo que no existe (recomendado) o dejar los enlaces
  hasta que haya contenido.

## Enfoque de pruebas

- **Unit (Vitest):** el filtro de procedencia (qué origen entra en qué directorio) como tabla de
  corrida de escritorio, y el armado del estado vacío.
- **Behavior (Playwright):** un vendedor sembrado con origen local aparece en su directorio y no en
  el otro; la sección vacía explica y no lista; ningún enlace del menú responde 404.
