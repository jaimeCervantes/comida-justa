# Difusión en grupos de Facebook

> Roadmap de rebanadas. La bitácora de cada una vive en
> `030-2026-10-04-difusion-en-grupos-bitacora.md`. Escenarios:
> `src/e2e/outreach/difusionEnGrupos.feature`. Rama: `feat/difusion-en-grupos`.

## Contexto

- **Problem:** publicar en grupos de Facebook es copiar y pegar, a mano y de memoria. El texto de
  masa madre que circula anuncia diez sabores y el catálogo tiene seis: Integral, Ajo, Dátiles con
  Nuez y Queso Parmesano con Aceitunas no existen en la base, y nadie se entera de qué se agotó ni
  de qué precio cambió hasta que pregunta un comprador. Tampoco queda registro de en qué grupo se
  publicó qué ni cuándo, y repetir antes de tiempo es lo que hace que el administrador de un grupo
  o Facebook restrinjan la cuenta.
- **Savings:** minutos por publicación, porque el texto sale armado y se copia de un toque. Ningún
  anuncio de lo agotado ni con precio viejo. Menos riesgo de perder la cuenta o los grupos, porque
  la app lleva la cuenta de dónde y cuándo se publicó.
- **Why:** los grupos son donde está el comprador local. Esto convierte el inventario en
  publicaciones constantes sin automatizar nada que Facebook prohíba.

**As** administrador de la tienda
**I want** escribir una sola vez el texto de cada línea de productos y copiarlo listo para cada grupo
**So that** publique en grupos en minutos, sin anunciar lo agotado ni precios viejos y sin saturarlos

## Por qué la app prepara y la persona publica

- **Facebook cerró su API de grupos en 2024** (Graph API v19). Ninguna app puede publicar en un
  grupo, ni siquiera en uno que administras, y no hay permiso ni revisión que lo devuelva.
- Lo único que queda para publicar sin una persona es un robot que maneje el navegador con su
  cuenta. Va contra las condiciones de Meta, y la parte de «que no nos bloqueen» consiste en
  esquivar su detección de spam: no se construye aquí. Además no funciona a la larga, y lo que se
  pierde es la cuenta y su presencia en los grupos.
- Así que **nada se publica solo.** La app hace lo que cuesta —armar el texto, la lista al día,
  las fotos, recordar dónde y cuándo— y la persona da el clic. Que publique una persona, a su
  ritmo y con las reglas de cada grupo a la vista, es lo que mantiene la cuenta a salvo.

## Cómo publicar: todos juntos o uno por uno

Depende del tipo de grupo. Por eso el tipo es del **grupo**, no del texto:

| Tipo de grupo                                        | Qué publicar                                                                                      | Por qué                                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Normal** (texto libre)                             | **Todos juntos**: una publicación por línea («Masa madre») con la lista de sabores y precios.     | Muchos grupos limitan cuántas publicaciones hace cada miembro al día, y seis seguidas se leen como saturación. Una sola junta los comentarios, que es lo que hace que Facebook la muestre a más gente.                                                                                        |
| **Compraventa** («Vender artículo»: título, precio, descripción) | **Uno por producto**, escalonados: uno o dos artículos por grupo al día, turnando cuál toca. | El artículo admite un solo precio: poner $96 cuando casi todo cuesta $125 se siente engañoso, y hay grupos que lo prohíben. Quien busca «pan de chocolate» dentro del grupo encuentra el artículo con ese título y su foto. El selector «más grupos» de Facebook multiplica cada artículo sin multiplicar el trabajo. |

En los dos casos se escribe **un solo texto por línea**: el artículo de compraventa se deriva de él
(título y precio del producto, descripción con el texto de la línea).

## El modelo acordado

### La publicación para grupos

Un texto que alguien escribió una vez para una línea de productos. Se guarda en su propia tabla y
**solo lo que está en ella se publica**: la descripción del producto en el sitio
(`post_translations.content`) no se usa ni se toca, aunque hoy la de los panes empiece igual.

| Parte                     | Ejemplo (masa madre)                                                      | De dónde sale                                                        |
| ------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Nombre interno            | `Masa madre`                                                              | Lo escribe el administrador. Nunca se publica: sirve para encontrarla. |
| Texto antes de la lista   | `¿Te inflama el pan comercial?…` hasta `Pasa por el tuyo a Hazlo Sano:`    | Tal cual se escribió.                                                |
| **La lista de precios**   | `🌾 Natural — $96` …                                                       | **Generada de la base al abrirla**: lo disponible, al precio de hoy. |
| Texto después de la lista | `MM Naturalmente, …` y los enlaces de contacto                            | Tal cual se escribió.                                                |

Cada producto ligado lleva su **etiqueta corta** (`Natural`, no `Pan de Masa Madre Natural`), un
**emoji** opcional y su **orden**.

### La regla de la lista

```
motivoParaQuedarFuera(producto) =
    moderation_status <> 'published'          → «no publicado»
    is_available = false y lleva inventario   → «agotado»
    is_available = false sin inventario       → «no disponible»
    price IS NULL                             → «sin precio»
    (ninguno)                                 → sale en la lista
```

Se evalúan en ese orden y gana el primero. `is_available` ya resume el inventario: cuando un
producto lleva existencias se deriva de ellas en la misma escritura
(`004-2026-09-03-inventario-de-existencias.md`), así que aquí no se vuelve a calcular nada.
«No publicado» existe porque anunciar algo en revisión manda al comprador a una página que no
existe.

1. Solo salen los disponibles. Los demás quedan **fuera con su motivo**, a la vista del
   administrador y nunca en el texto.
2. Los del mismo precio comparten renglón, con sus etiquetas en el orden en que se agregaron y
   separadas por ` / `. El renglón lleva el primer emoji que aparezca entre ellos.
3. Los renglones van del más barato al más caro.
4. El precio se escribe como en un letrero: `$96`, `$140`, `$96.50`, `$1,250`.

El texto completo:

```
<texto antes, sin espacios ni renglones vacíos en los extremos>
<renglón 1>
<renglón 2>
…
                                   ← un renglón vacío
<texto después, igual de recortado>
```

Sin texto antes, empieza en la lista; sin texto después, termina en ella. Si no queda nada
disponible no hay texto que copiar, y la pantalla lo dice.

### Decisiones por omisión (revisables en esta revisión)

- **La lista sale de la base**, no del texto. Lo que no está dado de alta no se anuncia.
- **«MM Naturalmente, facebook.com/…» va en el texto después de la lista**, como hoy. No se modela
  como crédito del productor: `sellers` no tiene dónde guardarlo y hoy aparece en una sola línea.
- **En compraventa, un artículo por producto** (slice 2), derivado de la misma publicación.
- **Sin dueño por vendedor todavía**: la herramienta es del administrador (`isAdmin`). Cuando la
  usen los vendedores, una migración añade `seller_id` y se rellena con la tienda de sus productos.

### Lo que NO se hace

- No se publica nada en Facebook desde la app. Ningún token de Facebook, ningún robot de navegador.
- No hay plantillas con marcadores (`{precio}`): el único dato vivo es la lista, y tiene su lugar.
- No se toca la descripción del producto en el sitio.

### Reutilización

El concepto es genérico —difundir lo que vende un catálogo en canales de fuera— y vive en
`src/domain/outreach/`, que depende del núcleo (`posts`) y nunca al revés. Nada en el dominio
nombra a Hazlo Sano ni a Facebook: «Facebook» llegará en el slice 3 como un valor de una lista
cerrada de redes, en un solo archivo. Los motivos para quedar fuera también son una lista cerrada,
en un solo archivo.

## Rebanadas

### Slice 1 — La publicación para grupos normales

**Alcance.** En `/admin/difusion` el administrador crea y edita publicaciones para grupos: nombre
interno, texto antes y después de la lista, y los productos con su etiqueta, emoji y orden. Al
abrir una ve el texto completo para un grupo normal con la lista generada en ese momento, el aviso
de lo que quedó fuera y su motivo, y un botón «Copiar».

**Criterios de aceptación.**

1. La migración A existe y está aplicada en `hazlo-sano-bot` (especificación abajo), y el espejo
   Drizzle se escribe **después**, contra lo que hay en la base.
2. El texto completo sigue exactamente la regla de arriba (corrida de escritorio en el `.feature`).
3. Lo que no está disponible no sale, y se dice por qué. Si no queda nada, no hay qué copiar.
4. Un cambio de precio o de existencias en el producto se ve la siguiente vez que se abre, sin
   tocar la publicación.
5. «Copiar» deja en el portapapeles exactamente el texto que se ve.
6. Quien no es administrador recibe 404, como en el resto de `/admin`.
7. Un nombre o una etiqueta vacíos se rechazan con un mensaje, sin escribir nada.

**Qué se toca.** `src/domain/outreach/` (nuevo: la lista, el texto, los motivos, la validación);
`src/use_cases/outreach/`; repositorio Postgres y espejo Drizzle; rutas `/admin/difusion`,
`/admin/difusion/nueva`, `/admin/difusion/[id]` y `/admin/difusion/[id]/editar`, añadidas a
`src/e2e/testUtils/warmRoutes.ts`; catálogos `es`/`en`.

**Orden de trabajo.** Mientras la migración A no exista se avanza en lo que no toca la base:
dominio, casos de uso con repositorio falso, pantallas y sus pruebas de componente. El espejo, el
repositorio Postgres y el e2e esperan a que las tablas existan.

### Slice 2 — Artículos de compraventa y fotos

**Alcance.** La misma publicación ofrece un artículo por cada producto disponible: título (el del
producto), precio (el de la base) y descripción (el texto completo de la línea), cada campo con su
propio «Copiar». Las fotos de cada producto se ven y se pueden guardar, en los dos formatos. Sin
migración.

**Criterios de aceptación.**

1. Un artículo por producto disponible, en el orden del texto; lo que queda fuera de la lista
   tampoco genera artículo (la misma `decideListing`).
2. El precio va como lo pide el campo de Facebook: `136`, `96.50`, `1250`; sin `$` ni comas.
3. Título y precio se copian cada uno con su botón; la descripción es el texto completo de la línea
   y se ofrece una sola vez para todos.
4. Cada artículo enseña las fotos de su producto (solo imágenes, en su orden) y cada una abre la
   original en otra pestaña para guardarla. El grupo normal enseña la primera de cada producto.

### Slice 3 — Los grupos y dónde quedó publicada (migración B)

**Alcance.** Alta y listado de grupos: nombre, URL, tipo (normal o compraventa), cada cuántos días
acepta una publicación tuya y notas de sus reglas. Desde la publicación se abre el grupo, y al
terminar se marcan **todos** los grupos donde quedó, incluidos los que se eligieron en el selector
«más grupos» de Facebook. Eso es el historial.

**Criterios (por detallar).** El tipo del grupo decide qué formato ofrece la publicación; se
marcan varios grupos a la vez.

### Slice 4 — El ritmo

**Alcance.** La publicación dice a qué grupos ya les toca y a cuáles todavía no, por sus días
mínimos y el historial. En compraventa sugiere qué producto toca hoy en cada grupo: el que lleva
más tiempo sin publicarse ahí. Avisa al llegar a un tope de publicaciones por día; avisa, no
bloquea. Sin migración.

### Slice 5 — Pie compartido y versiones que se turnan (migración C, opcional)

**Alcance.** El pie de contacto (ubicación, WhatsApp, bot, pilares) se escribe una vez y lo
comparten todas las publicaciones. Una publicación puede tener varias versiones del texto y la app
turna cuál toca, para no repetir el mismo texto en grupos distintos el mismo día.

## Especificación de la migración A (para `hazlo-sano-bot`)

Calcada de `0055_2026-09-07_add_post_reactions.py`. Escrita el 2026-10-13 como
`alembic/versions/0060_2026-10-13_add_outreach_texts.py` (revisión `0060_2026_10_13`, sobre
`0059_2026_09_26`), en la rama `feat/outreach-texts` de `hazlo-sano-bot`.

### `outreach_texts`

| Columna      | Tipo          | Restricciones                    | Para qué                                          |
| ------------ | ------------- | -------------------------------- | ------------------------------------------------- |
| `id`         | `UUID`        | PK, `DEFAULT gen_random_uuid()`  |                                                   |
| `name`       | `TEXT`        | `NOT NULL`                       | Nombre interno («Masa madre»). Nunca se publica.  |
| `opening`    | `TEXT`        | `NOT NULL DEFAULT ''`            | Texto antes de la lista.                          |
| `closing`    | `TEXT`        | `NOT NULL DEFAULT ''`            | Texto después de la lista.                        |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`         |                                                   |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()`         | Lo escribe la web al guardar.                     |

### `outreach_text_items`

| Columna            | Tipo      | Restricciones                                            | Para qué                                            |
| ------------------ | --------- | -------------------------------------------------------- | --------------------------------------------------- |
| `id`               | `UUID`    | PK, `DEFAULT gen_random_uuid()`                          |                                                     |
| `outreach_text_id` | `UUID`    | `NOT NULL`, FK `outreach_texts.id` `ON DELETE CASCADE`   |                                                     |
| `post_id`          | `TEXT`    | `NOT NULL`, FK `posts.id` `ON DELETE CASCADE`            | Si el producto se borra, deja de estar en la lista. |
| `label`            | `TEXT`    | `NOT NULL`                                               | Etiqueta corta en la lista («Natural»).             |
| `emoji`            | `TEXT`    | `NULL`                                                   | Opcional.                                           |
| `position`         | `INTEGER` | `NOT NULL`                                               | Orden dentro de la publicación.                     |

- `UNIQUE (outreach_text_id, post_id)` con nombre `outreach_text_items_one_per_text`: un producto
  aparece una vez por publicación. Su índice ya sirve para leer los productos de una publicación.
- `INDEX ix_outreach_text_items_post_id (post_id)`, para el borrado en cascada desde `posts`.
- Sin `CHECK` de longitud ni de vacío: la validación vive en el dominio, que sabe decir por qué.
- `downgrade`: borrar el índice, luego `outreach_text_items`, luego `outreach_texts`.

Las migraciones B (grupos e historial) y C (pie y versiones) se especifican al llegar a su slice.

## Pendientes del usuario

1. Escribir y aplicar la migración A en `hazlo-sano-bot`. También puedo escribir yo el archivo
   allí para que lo revises; aplicarla sigue siendo tuyo.
2. Si Integral, Ajo, Dátiles con Nuez y Queso Parmesano con Aceitunas se siguen vendiendo, darlos
   de alta: con la lista generada, lo que no está en la base no se anuncia.
3. Para el slice 3: las URLs de los grupos, su tipo y cada cuánto aceptan publicaciones.
