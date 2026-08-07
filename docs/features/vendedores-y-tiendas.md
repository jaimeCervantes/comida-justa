# Feature: Vendedores y tiendas

Roadmap de slices para que **cualquier usuario registrado pueda darse de alta como vendedor** y
tenga una página pública con su catálogo, sus sucursales y un camino claro para que le compren.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/vendedores-y-tiendas-bitacora.md`.

> **Alcance cruzado.** El slice 1 toca dos repositorios: este (Next.js) y el backend Python del bot
> en `C:\Users\S2G52\Desktop\jaimito\HazloSano\bot-whatsapp\backend`, dueño del esquema vía Alembic.

## Problema / Savings / Why

- **Problema:** hoy no existe la figura de vendedor en el sitio. `sellers` tiene **una sola fila**
  ("Hazlo Sano", sin `user_id`), creada a mano para el chatbot, y las 24 publicaciones cuelgan
  directo de `users`. Un productor local que se registra no tiene dónde decir quién es, dónde está,
  ni un lugar al que mandar a sus clientes: sus productos quedan sueltos en un feed cronológico.
- **Savings:** una tienda es una URL que el vendedor puede pegar en su WhatsApp, en su Facebook o en
  una etiqueta impresa; eso ahorra el trabajo de explicar el catálogo una conversación a la vez. Del
  lado nuestro, se reutiliza todo el pipeline de `Post` (formulario, media, categorías, embeddings,
  paginación): la tienda es una consulta con `WHERE seller_id = ...`, no un módulo nuevo. Y llenar
  `posts.seller_id` es lo que habilita el boost comercial y el radio geográfico que la función
  `search_posts_semantic` **ya calcula** y hoy no puede aplicar porque casi todo llega sin vendedor.
- **Why:** la visión declarada en `catalogo-unificado.md` es que *todo usuario registrado sea
  vendedor* y que el catálogo sea lo que publica la comunidad. Este es el slice 6 de aquel roadmap,
  ascendido a feature propia porque es el cuello de botella para vender: sin vendedor no hay tienda,
  sin tienda no hay a dónde mandar al comprador, y sin sucursal el bot no puede recomendar por
  cercanía.

## Estado real de la base al empezar (2026-07-31)

Consultado contra la Postgres compartida, no supuesto:

| Tabla | Estado |
|---|---|
| `users` | 21 filas |
| `sellers` | 1 fila: `Hazlo Sano`, `phone 2781126948`, `category 'Food'`, `user_id NULL` |
| `branches` | 1 fila: `Restaurante Hazlo Sano`, Tezonapa, Veracruz, con `location` |
| `posts` | 24: 14 `producto` (13 con `seller_id`, todas de Hazlo Sano) y 10 `anuncio` |
| Alembic head | `0026_2026_07_28` |

Nada de esto se destruye en ningún slice: todo el trabajo de esquema es aditivo.

## Decisiones de modelado

### `sellers` ya existe y se aprovecha tal cual

No se crea una tabla nueva. `sellers` tiene `name`, `phone`, `logo_url`, `description`, `url`,
`has_membership`, `has_paid_ads` y —desde la migración `0023`— `user_id` con índice único hacia
`users.id`. Le falta **una sola cosa** para ser una página pública: un nombre en la URL.

**Constraints heredados que condicionan el formulario** (verificados en `information_schema`):

| Columna | Constraint | Consecuencia |
|---|---|---|
| `phone` | `NOT NULL`, **`UNIQUE`** | Dos vendedores no pueden compartir teléfono: hay que dar un error accionable, no un 500 |
| `category` | `NOT NULL` | Es **otra** taxonomía (valor actual `'Food'`), ajena a `categories`. La escribe el repositorio con un default; no se le pregunta al vendedor |
| `name` | `NOT NULL` | Obligatorio en el formulario |

### Las URLs van con prefijo: `/tienda/<handle>` y `/u/<username>`

La raíz **ya está ocupada**: `src/app/[locale]/[slug]/page.tsx` con `localePrefix: "as-needed"`
significa que `hazlosano.com/jugo-verde` es hoy el detalle de una publicación. Colgar tiendas de la
raíz obligaría a un namespace compartido entre tiendas, usuarios y los slugs de las 24
publicaciones existentes — y a resolver que **hoy los slugs de publicación ni siquiera se
deduplican entre sí** (`createOnePostUseCase.defineSlug` solo llama a `createUniqueSlug` cuando el
slug llega ya escrito, y `/publicar` siempre lo manda vacío).

Con prefijo, cada namespace es independiente y la unicidad la garantiza un índice único por tabla:

```
/tienda/panaderia-la-luz   → tienda (slice 1)
/u/jaime                   → perfil público (slice 4)
/jugo-verde                → publicación (como hoy, intacto)
```

### El vendedor se da de alta solo, sin moderación previa

Auto-servicio: quien se registra puede crear su tienda y queda pública al instante. Es coherente con
`/publicar`, que tampoco modera. El admin ya tiene `/admin/productos` para vigilar el catálogo.
Si aparece abuso, moderar es un slice posterior; empezar cerrado mataría la oferta antes de tenerla.

### `seller_id` se sella al publicar, no se deduce después

Al publicar, si el usuario tiene tienda, la publicación nace con `posts.seller_id`. Deducirlo
después por `user_id` sería una consulta más en cada lectura y rompería el día que una tienda tenga
más de un dueño.

## Slices

### Slice 1 — Conviértete en vendedor y tu tienda queda en línea  *(actual)*

El corte más pequeño que ya sirve para vender: existir como vendedor y tener una URL que mandar.

- **Backend (Alembic `0027`, aditiva):** `sellers.slug` + índice único, y `users.username` + índice
  único. `username` se agrega aquí aunque se use hasta el slice 4: una migración sobre la base
  compartida es la operación cara y arriesgada de esta feature, y dos migraciones son dos veces el
  riesgo. El `UPDATE` de datos se limita a ponerle `slug = 'hazlo-sano'` a la fila que ya existe.
- **Web:** espejo Drizzle de `sellers`; dominio del handle (normalización + reservadas); caso de uso
  `becomeSeller`; `/cuenta` con el formulario de alta; `/tienda/[slug]` pública con cabecera y
  catálogo; `/publicar` sella `seller_id`.
- **De paso:** `MediaContent` deja de reventar cuando una publicación no trae media (defecto
  conocido en `docs/pendientes.md`); el listado de la tienda pasa por ese mismo camino.

**Criterios de aceptación:**
1. Un usuario registrado sin tienda abre `/cuenta`, envía nombre y teléfono, y queda con tienda.
2. `/tienda/<handle>` muestra el nombre, la descripción y el teléfono de la tienda.
3. Lo que ese usuario publica después aparece en su tienda; lo de otros vendedores, no.
4. `/tienda/hazlo-sano` lista los 13 productos que ya tienen `seller_id`, sin migrar datos.
5. Un handle ya tomado o un teléfono ya registrado devuelven un error entendible, no un 500.
6. Un usuario que ya es vendedor ve su tienda en `/cuenta`, no el formulario otra vez.
7. `/tienda/no-existe` responde 404.

### Slice 2 — Pedir por WhatsApp  *(entregado)*

Lo único que hoy convierte una visita en venta. El detalle solo ofrecía un `tel:`.

- **"Pedir por WhatsApp"** en el detalle de un producto, con el mensaje ya escrito (título, precio
  y enlace a la publicación). Solo en `kind = producto`: un anuncio no tiene nada que encargar.
- **"Escribir por WhatsApp"** en la tienda, para preguntar sin haber elegido producto.
- El número sale de `posts.contact_whatsapp` y, si falta, de `posts.contact_phone`.

> **Desviación con motivo.** El plan decía caer al teléfono de la tienda. Consultando la base,
> **las 24 publicaciones tienen `contact_phone`** (y solo 13 tienen `contact_whatsapp`), así que ese
> tercer nivel sería código inalcanzable, y habría costado un JOIN a `sellers` en el detalle. La
> regla "sin número no hay botón" se conserva y vive en un solo lugar: `whatsappLink` devuelve
> `null` y `WhatsappButton` no pinta nada.

**Criterios de aceptación:**
1. El botón abre `wa.me` con el título y el precio del producto en el mensaje. ✅
2. Un producto sin WhatsApp propio usa el teléfono de la publicación. ✅
3. Sin ningún teléfono utilizable, el botón no se pinta (no se ofrece un enlace roto). ✅
4. Un anuncio no ofrece el botón de pedir. ✅

### Slice 3 — Sucursales con ubicación  *(entregado)*

Lo que hace que al vendedor **lo encuentren**: sin `branches.location` el bot solo puede recomendarlo
en el fallback sin geo, aunque el cliente esté a dos calles.

- Alta de sucursal desde `/cuenta`: nombre, dirección y enlace de Google Maps. Las coordenadas se
  extraen del enlace (resolviendo el redirect de `maps.app.goo.gl`), con "usar mi ubicación actual"
  como alternativa. `branches.location` es `NOT NULL`, así que sin coordenadas no hay sucursal.
- Las sucursales se muestran en la tienda bajo "Dónde encontrarnos", con su enlace al mapa.
- **Sin migración:** `branches` ya existía con todo lo necesario, incluido el `geography(POINT,4326)`.

**Criterios de aceptación:**
1. Pegando un enlace de Google Maps se guarda la sucursal con coordenadas. ✅
2. Un enlace del que no se puedan extraer coordenadas se rechaza explicando qué pegar. ✅
3. Un vendedor puede tener varias sucursales y todas se listan en su tienda. ✅
4. Un producto de una sucursal dentro del radio aparece en las recomendaciones del bot. ✅
   Comprobado llamando a `search_posts_semantic` con la ubicación de un cliente a 1 km (la
   encuentra) y desde Xalapa, a 150 km (no la encuentra).

### Slice 4 — Perfil público `/u/<username>`  *(entregado)*

- Página de la persona: nombre, foto y todo lo que publica (incluidos anuncios, que no son
  catálogo), con enlace a su tienda si la tiene.
- El `username` se reclama desde `/cuenta`, sobre la columna que creó el slice 1. **Sin migración.**

> **Sin bio.** El plan la mencionaba, pero `users` no tiene esa columna y agregarla costaba otra
> migración sobre la base compartida para algo que ningún criterio de aceptación pide. Queda como
> pendiente, para cuando haya algo más que justifique tocar el esquema.

> **Se reclama una sola vez.** Cambiar de dirección rompería los enlaces que la persona ya repartió;
> renombrar con redirección es trabajo aparte.

**Criterios de aceptación:**
1. `/u/<username>` muestra las publicaciones de esa persona, anuncios incluidos. ✅
2. Un vendedor enlaza desde su perfil a su tienda y al revés. ✅
3. Un username ya tomado se rechaza con un error entendible. ✅
4. Una dirección que nadie reclamó responde 404. ✅

### Slice 5 — El vendedor administra su catálogo  *(entregado)*

- Marcar un producto como agotado desde su detalle (`posts.is_available`, que existía desde el
  catálogo unificado **sin UI**: nadie podía dejar de ofrecer lo que se le acabó).
- Editar publicaciones propias en `/editar/<slug>`, con reindexado del embedding al cambiar el texto.
- **Sin migración.**

> **Borrar quedó fuera.** Estaba en el texto del slice pero en ningún criterio de aceptación: es
> destructivo, pide su propia confirmación y su propia decisión sobre comentarios e histórico de
> recomendaciones. Marcar agotado cubre la necesidad real —dejar de ofrecerlo— y es reversible.

> **El slug no se mueve al editar**, aunque cambie el título: la dirección ya viaja dentro del
> mensaje de WhatsApp del slice 2, y moverla dejaría muertos los enlaces repartidos.

**Criterios de aceptación:**
1. Marcar agotado lo saca de la tienda y de las recomendaciones del bot. ✅
   *(La función SQL del bot ya filtra `is_available`; se comprobó por la vía del sitio.)*
2. Editar el título o la descripción regenera el embedding. ✅ *(verificado esperando al vector)*
3. Nadie puede editar la publicación de otro. ✅ *(404, no 403)*
4. Su dueño sigue viendo lo agotado, para poder volver a ofrecerlo. ✅

### Slice 6 — Editar la ficha de la tienda  *(entregado)*

Hoy la ficha se llena una vez, al darse de alta, y **nunca más**: `logo_url`, `url` y `description`
existen en la base, se leen en la tienda… y no hay forma de escribirlas después. Un vendedor que
cambia de teléfono, consigue logo o quiere corregir su descripción no puede hacer nada.

- Formulario en `/cuenta` para nombre, teléfono, descripción, sitio web y logo.
- El logo reutiliza el mismo subidor de `/publicar`, que sube a Cloud Storage; se mueve a
  `src/infra/UI/components/` porque pasa a tener dos consumidores.
- La tienda muestra el sitio web, que hasta ahora se guardaba sin pintarse en ninguna parte.
- **Sin migración:** las cinco columnas existen desde que el chatbot creó la tabla.

**Criterios de aceptación:**
1. Un vendedor cambia descripción y sitio web, y su tienda lo refleja.
2. El teléfono nuevo se valida igual que al darse de alta, y si es de otra tienda se rechaza.
3. Cambiar el teléfono al **mismo** que ya tenía no se confunde con un duplicado.
4. Nadie puede editar la ficha de otra tienda.
5. La dirección (`slug`) no se toca en este formulario: ver "Renombrar direcciones", más abajo.

### Slice 7 — La tienda dice a qué distancia está  *(entregado)*

La cercanía es el criterio con el que alguien decide a quién comprarle, y el sitio ya la decía en el
directorio, en las tarjetas del catálogo y en la ficha de una publicación — pero **no en la página de
la tienda**. Se nota justo ahí porque a `/tienda/<handle>` se llega normalmente desde el directorio:
lees "a 2 km", entras, y el dato desaparece cuando vas a decidir.

- `distanceToNearestBranch` en el repositorio de sucursales: `MIN(ST_Distance(...))` sobre las de esa
  tienda, el mismo cálculo que ya hace el directorio.
- La página lo pide dentro del `Promise.all` que ya tenía, así que no añade una espera en serie.
- Reutiliza `StoreDistance`, que ya existía y ya estaba probado. **Ningún componente nuevo.**
- **Sin migración:** `branches.location` existe desde el slice 3.

**La distancia la calcula PostGIS, no JavaScript.** `Branch.coordinates` ya viaja a la página, así
que restar en memoria habría salido gratis; se descartó porque `ST_Distance` sobre `geography` usa el
elipsoide y el haversine de `locationFreshness.ts` una esfera. Mezclarlos haría que el directorio y
la tienda discreparan sobre la misma tienda.

**Criterios de aceptación:**
1. Con ubicación compartida y una sucursal a 2 km, la tienda dice a qué distancia queda.
2. Sin ubicación del visitante, no se pinta ninguna distancia.
3. Con ubicación pero sin sucursal situada, tampoco: `MIN` de cero filas es `NULL`, que no es cero.

### Renombrar direcciones — *descartado (2026-08-01)*

Se evaluó y **no se hace**: la dirección de una tienda (`sellers.slug`) y la de una persona
(`users.username`) siguen siendo inmutables.

**Por qué.** La duda era si el 308 penaliza en buscadores. No: Google trata 301 y 308 igual —ambas
son redirecciones permanentes y consolidan las señales hacia la URL nueva—, así que el código de
estado no era el problema. Lo que cuesta es **renombrar**: hay que esperar a que el buscador
re-rastree la dirección vieja, las posiciones oscilan mientras tanto, y las vistas previas ya
cacheadas por WhatsApp o Facebook tardan en refrescarse.

Frente a eso, el slice 6 deja cambiar el **nombre visible** de la tienda sin tocar la URL, que
resuelve el caso real (escribirlo mal, corregir mayúsculas) con cero costo. Renombrar la dirección
solo haría falta si el negocio cambia de nombre de verdad, y entonces se paga una migración
(`handle_history`), un 308 de un solo salto hacia la dirección actual y la regla de no ceder nunca
una dirección que fue de otro. Queda escrito por si ese día llega.

**Consecuencia asumida:** un negocio que se renombre conserva su URL original. A cambio, ningún
enlace repartido muere jamás.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Migración sobre base compartida | Solo agrega dos columnas nullable y sus índices; el único `UPDATE` toca la fila `Hazlo Sano`. `downgrade()` las quita |
| `sellers.phone` es único y ya hay un número usado | El caso de uso lo comprueba antes de insertar y devuelve un error de dominio |
| La suite e2e escribe vendedores en la base compartida | El handle lleva el prefijo `e2e-` y el barrido de `globalSetup`/`globalTeardown` los borra igual que las publicaciones |
| Una tienda vacía o un handle inexistente rompen la página | Estado vacío explícito y `notFound()` |

## Fuera de alcance (por ahora)

Carrito, checkout y órdenes reales. Membresías de pago (`has_membership`/`has_paid_ads` existen y se
siguen administrando a mano). Moderación de vendedores. Traducción de la ficha de tienda: se guarda
en un solo idioma, como el resto del contenido hoy.

**Pendiente que no es código:** el plan Hobby de Vercel es para uso no comercial y el sitio va a
vender. Revisar antes de promocionar tiendas de terceros.

## Enfoque de pruebas

- **Unit (Vitest):** handle (normalización, longitud, reservadas) con `Scenario Outline`; caso de uso
  `becomeSeller` contra un repositorio falso (ya vendedor, handle tomado, teléfono tomado); armado
  del enlace de WhatsApp (número, mensaje, codificación y el caso sin número).
- **Component (Vitest):** `MediaContent` sin media; `WhatsappButton` sin número; lectura de
  coordenadas de un enlace de Maps y el resolutor de enlaces cortos (con `fetch` doblado).
- **Behavior (Playwright):** `src/e2e/sellerStore/sellerStore.feature`. Solo los escenarios del slice
  actual están detallados y conectados; los demás llevan `@future` y no corren en CI.
