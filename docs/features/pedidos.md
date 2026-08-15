# Feature: Carrito y pedidos

Roadmap de slices para que **un comprador pida varias cosas de una vez** y para que el vendedor
tenga sus pedidos en un solo lugar, con su proceso.

Este documento es el **checkpoint de revisión** que reemplaza las pausas paso a paso (ver
"Autonomous delivery mode" en `AGENTS.md`). La bitácora por slice se lleva en
`docs/features/pedidos-bitacora.md`.

> **Continúa `vendedores-y-tiendas.md`**, que dejó "carrito, checkout y órdenes reales" explícitamente
> fuera de alcance. Esto lo abre.

## Problema / Savings / Why

- **Problema:** el catálogo tiene 13 productos de una tienda y el único camino a la venta es "Pedir
  por WhatsApp" (slice 2 de `vendedores-y-tiendas.md`), que es **de un producto a la vez**. Quien
  quiere Jugo Verde ($40), Suero natural ($35) y una hogaza de Masa Madre ($96) manda **tres mensajes
  sueltos**, y el vendedor arma el total a mano dentro de la conversación. No queda registro de nada:
  ni de qué se pidió, ni de cuánto sumaba, ni de cuántos pedidos se cayeron a medio camino.
- **Savings:** una conversación por pedido en vez de una por producto, con el desglose y el total ya
  escritos. Para el vendedor, dejar de sumar en el chat y dejar de reconstruir a mano qué le pidieron.
  Del lado nuestro, el primer número real sobre el que decidir si el pago en línea vale la pena — hoy
  esa pregunta no tiene respuesta posible porque `orders` tiene **0 filas**.
- **Why:** es el eslabón que falta entre "te encontraron" y "te compraron". La búsqueda, el
  directorio, la distancia, la tienda y el perfil ya están entregados: todos terminan en un producto
  y ahí el camino se corta en un mensaje suelto por artículo.

## Estado real de la base al empezar (2026-08-09)

Consultado contra la Postgres compartida, no supuesto:

| Tabla | Estado |
|---|---|
| `users` | 21 filas, 3 han publicado algo, 1 tiene `username` |
| `sellers` | **1**: `Hazlo Sano`, `slug hazlo-sano`, `phone 2781126948`, con `user_id` |
| `branches` | 1, con `location` |
| `posts` | 23: **13 `producto`** (todos con precio, `seller_id` y `is_available`) y 10 `anuncio` |
| `orders` | **0 filas** |
| `messages` (del bot) | 462 |
| Alembic head | `0029_2026_08_08` |

Dos hechos que ordenan el roadmap:

1. **La demanda ya pasa por WhatsApp** (462 mensajes). El canal no es un sustituto pobre del checkout:
   es donde se vende hoy. Lo que le falta no es reemplazo, es estructura.
2. **`orders` existe, está vacía, y su enum `orderstatus` ya trae el proceso completo**:
   `DRAFT → PENDING → CONFIRMED → PAID → PREPARING → DELIVERED → CANCELLED`. Lo diseñó el bot y nunca
   lo usó. Agregarle columnas a una tabla de 0 filas es la migración más barata que existe sobre la
   base compartida: sin backfill, sin bloqueos, sin datos que romper.

**Los 13 productos, tal como están** (es lo que usan los escenarios, sin inventar nada):

| Producto | Precio | Producto | Precio |
|---|---|---|---|
| Agua de Avena con canela | 20 | Pechuga de pollo a la naranja en bistec | 105 |
| Agua de piña con pepino | 20 | Pechuga de pollo a la macha en bistec | 105 |
| Electrolitos de frutos rojos | 35 | Pechuga de pollo asada en bistec | 105 |
| Suero natural | 35 | Crema de Cacahuate Natural | 110 |
| Jugo Verde | 40 | Pan de Masa Madre con Semillas (hogaza 1 kg) | 125 |
| Omelet con ensalada | 95 | Pan de Masa Madre de Chocolate (hogaza 1 kg) | 136 |
| Pan de Masa Madre Natural (hogaza 1 kg) | 96 | | |

Los 13 están disponibles y los 13 tienen `contact_whatsapp = 522781126948`.

## Decisiones de modelado

### El carrito es de varios vendedores; un pedido es de uno solo

**La decisión que ordena todo lo demás.** Un carrito puede llevar productos de cuantas tiendas quiera.
Confirmarlo produce **un pedido por tienda**:

```
Carrito (1)  ──groupBySeller()──▶  Pedido de Hazlo Sano      (PENDING)
                                   Pedido de Panadería La Luz (PENDING)
```

Hoy, con un vendedor, produce exactamente un pedido — **por el mismo camino de código**, no por una
rama especial. Esto es lo que hace que el día del segundo vendedor no haya nada que migrar ni que
rediseñar.

Consecuencias que se asumen desde ahora:

- **El estado vive en el pedido, nunca en el carrito.** Cada vendedor acepta, prepara y entrega por su
  cuenta y a su ritmo; "el estado del carrito" no existe como concepto porque no hay nadie que sea su
  dueño. Un carrito confirmado simplemente deja de existir.
- **`sellerId` es obligatorio en cada renglón**, aunque hoy siempre sea el mismo.
- **No se le puede mandar un WhatsApp a dos vendedores a la vez.** Un carrito con dos tiendas se
  confirma en dos pasos, uno por tienda, cada uno con su botón. Hoy es invisible porque solo hay una;
  el modelo tiene que soportarlo sin cambiar de forma.

### El total de la compra se enseña aunque no se pueda pagar de una vez  *(slice 5)*

La primera versión **se negó a sumar dos tiendas**: el argumento era que una cifra que las mezclara
no se la podría cobrar nadie. Es cierto para cobrar y falso para decidir. Quien llena un carrito no
está preguntando "¿cuánto le debo a cada tienda?" sino **"¿cuánto me voy a gastar?"**, y esa pregunta
no tiene dueño ni hace falta que lo tenga.

Se enseñan las dos cifras y cada una dice lo que es: el subtotal por tienda es **lo que se le pide a
esa tienda**, y el total de la compra es **lo que sale del bolsillo**, con la nota de que se confirma
en un pedido por tienda. Sigue sin existir en la base: se calcula al pintar, igual que los subtotales.

### Un carrito es un `checkout`, aunque produzca varios pedidos  *(slice 5)*

`customer_orders.checkout_id` existía desde `0032` y **no cumplía su promesa**: se generaba uno nuevo
dentro de `PlaceOrderUseCase` en cada confirmación, así que dos tiendas del mismo carrito salían con
dos checkouts distintos y nada las volvía a juntar.

El identificador **pertenece al carrito, no al pedido**, así que vive donde vive el carrito: en una
cookie, `hs_checkout`, al lado de `hs_cart`. Nace la primera vez que se confirma algo y **muere
cuando el carrito se vacía** —por confirmarlo todo o por quitarlo a mano—, que es exactamente la vida
de la compra que representa.

Consecuencias:

- Confirmar la segunda tienda **reutiliza** el id, y los dos pedidos quedan hermanados.
- La página del pedido enseña la compra completa: los N pedidos, su estado y **el total de todo**.
- **Solo al comprador.** El vendedor ve su pedido y nada más: a qué otras tiendas le compraste no es
  asunto suyo, y el `WHERE` de la consulta lleva el `user_id`, no solo el `checkout_id`.
- La cookie la escribe cualquiera y su valor va a una columna `uuid`: **se valida antes de creerle**,
  igual que `hs_cart`. Lo que no sea un uuid se descarta y se empieza un checkout nuevo.

### El carrito guarda ids y cantidades — nunca precios

Una cookie `hs_cart` con `postId:cantidad|postId:cantidad`, y **el título, el precio y la
disponibilidad se releen de la base en cada render**.

- **Cookie y no `localStorage`**, siguiendo el precedente de `hs_location`
  (`src/infra/location/locationCookie.ts`): la lee el servidor, así que la página del carrito y el
  contador de la cabecera son Server Components, sin parpadeo de hidratación. No cuesta nada
  estático: todas las rutas ya son dinámicas porque `Header` lee la sesión.
- **Solo ids** porque un precio guardado en el navegador es el precio de ayer. Releerlo es lo que hace
  que un producto que subió de precio o que se agotó **se vea antes de pedir**, no después. El carrito
  más grande imaginable hoy son 13 renglones: unos 400 bytes.
- Una cookie la escribe cualquiera, así que lo que venga se valida antes de creerle — igual que
  `parseFix`. Un id que no existe, una cantidad de `0` o de `"abc"` se descartan sin tirar el resto.

### El precio se congela al pedir, no al añadir

Cuando el pedido se registre (slice 2), cada renglón copia el precio del momento. Si el vendedor sube
el precio mañana, el pedido de ayer no cambia. Sin esto no hay histórico creíble, ni reclamación
posible, ni pago que cuadre. Es la contraparte exacta de la decisión anterior: **el carrito siempre
muestra el precio de hoy; el pedido conserva el del día que se hizo.**

### Solo se vende lo que es producto y está disponible

`kind = 'producto'` y `is_available = true`. Los 10 anuncios **no tienen precio ninguno** (0 de 10),
así que un carrito con anuncios no podría ni sumarse. Es la misma regla que ya aplica "Pedir por
WhatsApp", escrita una sola vez.

### El número al que se pide sale de la tienda, no de la publicación

El mensaje es por vendedor, así que el teléfono es el del vendedor: `sellers.phone`, que es `NOT NULL`.
El pedido de un solo producto sigue usando `posts.contact_whatsapp` como hasta hoy, y no se toca.

> Hoy los dos caminos dan el mismo número (`sellers.phone = 2781126948` y `contact_whatsapp =
> 522781126948` son el mismo teléfono con y sin lada), así que el cambio no se nota. Se decide igual,
> porque el día que un vendedor ponga un número de atención distinto del de una publicación vieja, el
> pedido tiene que llegar a la tienda.

### El mensaje lleva el enlace de cada renglón

Igual que el pedido de un producto, y por la misma razón que ya está escrita en `whatsappOrder.ts`:
del otro lado hay una persona atendiendo varias conversaciones. Y el catálogo real lo pide a gritos
— hay **tres hogazas de masa madre** que se llaman casi igual (Natural, con Semillas, de Chocolate) y
cuestan 96, 125 y 136.

### Avisar al vendedor es un puerto, no WhatsApp incrustado

`OrderNotifier` en `src/domain/order/ports.ts`. Hoy lo implementa WhatsApp reutilizando
`whatsappLink()`; mañana puede ser el bot, un correo o el webhook de la pasarela, y el caso de uso no
se entera. Es lo que permite que el slice 4 no reescriba el slice 1.

### El carrito no pide sesión; el pedido sí

Exigir cuenta para poner algo en el carrito mata la conversión antes de empezar, y con 21 usuarios
registrados no hay margen para eso. La sesión se pide **al registrar el pedido** (slice 2), porque
`orders.user_id` es `NOT NULL`. En el slice 1 no hace falta en ningún momento.

## Slices

### Slice 1 — Carrito por tienda y pedido por WhatsApp  *(actual)*

El corte más pequeño que ya ahorra trabajo real: tres productos, un mensaje. **Sin base de datos y
sin migración** — el valor no la necesita, y así la parte cara y arriesgada se paga cuando ya haya
algo funcionando que la justifique.

- Dominio del carrito: `CartLine`, `groupBySeller()`, subtotales y total.
- Cookie `hs_cart` en `src/infra/cart/`, espejo de lo que ya hace `locationCookie`.
- "Añadir al carrito" en la ficha del producto y en la tarjeta del catálogo.
- `/carrito` (`/en/cart`): renglones agrupados por tienda, cantidad editable, quitar, subtotal por
  tienda y total.
- "Confirmar pedido con \<tienda\>" por grupo → WhatsApp con el desglose ya escrito.
- Contador en la cabecera.

**Criterios de aceptación:**
1. Añadir "Jugo Verde" desde su ficha y "Suero natural" desde una tarjeta de `/productos` deja los dos
   renglones en `/carrito`, agrupados bajo "Hazlo Sano", con total 75.
2. La cabecera dice cuántos artículos hay, desde cualquier página.
3. Cambiar la cantidad de "Jugo Verde" a 2 deja el total en 115; quitar un renglón lo recalcula.
4. "Confirmar pedido con Hazlo Sano" abre `wa.me/522781126948` con los renglones, sus cantidades, el
   enlace de cada uno y el total.
5. Un producto que se agotó mientras estaba en el carrito se ve marcado, no entra en el total ni en el
   mensaje, y no se borra a escondidas.
6. Un anuncio no ofrece "Añadir al carrito" en ninguna pantalla.
7. El carrito sobrevive a recargar la página y a navegar por el sitio.
8. Un carrito vacío dice que está vacío y enlaza al catálogo, en vez de una pantalla en blanco.
9. Una cookie manipulada (id inexistente, cantidad `0` o `"abc"`) no rompe la página: se descarta ese
   renglón y los demás siguen.

### Slice 2 — El pedido queda registrado y el vendedor lo administra  *(actual)*

Aquí entra la base, y con ella el proceso que el vendedor necesita.

- **Migración Alembic `0032`, encadenada desde `0031_2026_08_09`.** Crea `customer_orders` y
  `customer_order_items`, y **reutiliza el enum `orderstatus`** que ya existe.
- Confirmar escribe el pedido en `PENDING` y lleva a `/pedido/<id>`, desde donde se avisa a la tienda.
- Sección "Pedidos" en `/cuenta`, con el flujo `PENDING → CONFIRMED → PREPARING → DELIVERED` y
  `CANCELLED` desde cualquier punto menos el último.

> **Es el único paso irreversible del roadmap.** La migración la escribe este repositorio y la
> aplica el usuario, según lo acordado el 2026-08-09.

#### Por qué NO se reusa `orders`

El plan original decía adaptar `orders`: existe, está vacía y su enum describe el proceso entero.
Leyendo el backend se vio que **es el carrito del bot, y es código vivo** —
`PostgresOrderRepository` está inyectado en `api/dependencies.py` y en el orquestador de mensajes.
`handle_order_intent` crea la fila con `status=DRAFT` **antes** de saber qué se pide y va apilando
artículos en el JSON de `items`. De ahí que:

- `orders.seller_id NOT NULL` sea imposible: al crear la fila no hay vendedor que poner.
- `orders.items` sea carga viva: normalizar aparte dejaría al sitio escribiendo `[]` o duplicando.

Y no había nada que unificar: las filas del bot son carritos a medio hacer, no pedidos. El nombre
`customer_orders` —y no `site_orders`— deja la puerta abierta a que el bot escriba ahí el día que
llegue a colocar un pedido de verdad.

> **Hallazgo aparte, sin tocar:** los `items` del bot guardan `product_id` apuntando a `products`,
> la tabla que desapareció al unificar el catálogo dentro de `posts`. Esa ruta probablemente ya esté
> rota, y explicaría los 0 pedidos.

#### Decisiones del esquema

- **No hay columna `total`.** Se suma de los renglones, que son la única verdad; una copia
  denormalizada solo puede desincronizarse.
- **`post_id` es nulo con `ON DELETE SET NULL`.** Si la publicación se borra, el renglón sobrevive
  con su copia del título y del precio — que es exactamente para lo que se guardaron. Con `RESTRICT`,
  el histórico bloquearía para siempre el borrado de cualquier producto pedido una vez.
- **`unit_price` es `numeric`**, como `posts.price`: el dinero no se guarda en flotante.
- **`checkout_id` desde el primer día**, aunque hoy siempre haya un pedido por carrito.
- **Qué transición vale lo decide el dominio, no un `CHECK`.** Son reglas que van a cambiar —con el
  pago, `PAID` se mete en medio— y que necesitan dar un motivo entendible.

**Criterios de aceptación:**
1. Confirmar deja el pedido en `PENDING` y lleva a su página, con el aviso por WhatsApp a un clic.
2. El precio del pedido no se mueve aunque el catálogo suba después.
3. El vendedor lo lleva de pendiente a entregado desde `/cuenta`, y ahí se le acaban las acciones.
4. Confirmar sin sesión pide identificarse y **no** vacía el carrito.
5. El pedido de otra persona responde 404, no 403.
6. Dos pestañas no aplican la misma decisión dos veces.

### Slice 3 — Pedidos que aguantan  *(actual)*

> La lista del comprador, que era el slice 3 original, se entregó dentro del 2 al darle sitio propio
> a `/pedidos`. Este slice es lo que hace que esa pantalla siga sirviendo cuando haya volumen.

**El defecto:** `listBySeller` y `listByBuyer` no tenían `LIMIT`. La página traía **todos** los
pedidos con **todos** sus renglones, los metía en memoria y los volcaba al HTML en cada visita. Con
cinco no se nota —por eso pasó las pruebas—; con trescientos es media pantalla de HTML y una
consulta que crece para siempre.

**El espacio en disco nunca fue el problema.** Una fila de `customer_orders` ocupa ~100 bytes y una
de `customer_order_items` ~120 con su título: diez mil pedidos de tres renglones son unos **5 MB**.
La base ya guarda vectores de 768 dimensiones por traducción, que pesan mucho más.

- **Paginación** de 10 en las dos listas, con el total en la misma consulta (`count(*) OVER ()`) en
  vez de un segundo `SELECT count`.
- **El vendedor entra por lo abierto** (`PENDING`, `CONFIRMED`, `PREPARING`). Trescientos entregados
  detrás esconden los cuatro que hay que contestar.
- **Búsqueda por el título congelado del renglón**, con `ILIKE`.
- **Miniatura y enlace al producto** en cada renglón, resueltos al leer contra la publicación de hoy.
- **Sin migración.**

#### Pestañas, y por qué dejaron de verse las dos listas a la vez

Apiladas funcionaban mientras no tenían controles. Al ganar cada una su búsqueda, su filtro y su
paginación, apilarlas significaba **dos buscadores y dos paginaciones** compitiendo por los mismos
parámetros de la URL. Con pestañas hay un solo juego de controles, y el número que llevan al lado
dice si hay algo esperando en la otra — que era lo único que se perdía al no verlas juntas.

#### El índice que se propuso y NO se hizo

Se planteó `(seller_id, status, created_at DESC)` y se descartó al mirarlo de cerca:
`ix_customer_orders_seller` ya lleva `seller_id` de primero, así que la consulta lo usa para acotar
y ordenar, y el estado se filtra sobre esas pocas entradas. Para una tienda con cientos de pedidos
eso es gratis. Una migración sobre la base compartida para una tabla de una fila es ceremonia, no
ingeniería. **El umbral:** si alguna tienda pasa de ~10.000 pedidos y `EXPLAIN` muestra que el filtro
de estado descarta la mayoría, entonces sí.

#### Por qué `ILIKE` y no full-text

La pregunta real es «¿cuándo pedí aquel pan?» sobre una lista que casi siempre cabe en dos páginas.
Montar `tsvector` con su índice GIN —como el catálogo— sería traer toda esa maquinaria a un sitio que
no la necesita. Vive en una función del repositorio: el día que haga falta, se cambia ahí y el resto
no se entera.

**Criterios de aceptación:**
1. La lista viene por páginas de 10 y la consulta no trae el resto.
2. El vendedor ve solo lo abierto, con lo terminado a un clic.
3. Entregar un pedido lo saca de "abiertos" y lo pone en "terminados".
4. Buscar "pan" deja solo los que lo llevaban, sin perder el filtro de estado.
5. Cada renglón muestra miniatura y enlaza a la publicación.
6. Un pedido de algo ya borrado conserva título e importe, sin miniatura ni enlace.

### Slice 4 — El carrito se entiende de un vistazo  *(actual)*

El carrito era una lista de texto con un desplegable de veinte números al lado: se entendía leyendo,
no mirando, y poner tres unidades pedía abrir una lista y buscar el número.

- **Miniatura del producto** en cada renglón, enlazada a su publicación igual que el nombre. Se
  relee como todo lo demás; el carrito sigue guardando solo id y cantidad.
- **La fila se reordena para caber**: la foto a la izquierda y el resto en columna, así que en un
  teléfono el nombre se lleva su renglón entero y los controles caen debajo en vez de comprimirse.
- **Menos / cantidad / más** en lugar del desplegable. Los botones mandan un **incremento**, no la
  cantidad final: el servidor lo aplica sobre lo que hay guardado, así que dos toques seguidos suman
  dos aunque la pantalla enseñe todavía el número viejo. El campo sigue aceptando que se escriba 12.
- **`Thumbnail` se comparte** con los renglones del pedido en vez de escribirse dos veces.
- **Sin migración**: `post_media` ya estaba; lo que faltaba era pedirla en la consulta del carrito.

**Criterios de aceptación:**
1. Cada renglón enseña la foto del producto y su nombre lleva a la publicación.
2. «Más» y «menos» cambian la cantidad de a uno y el total sigue.
3. Dos toques seguidos en «más» suman dos, no uno.
4. Un producto sin imagen —o con solo vídeo— se lee igual, sin marco vacío.

### Slice 5 — Una compra, aunque sean varias tiendas  *(actual)*

Los cuatro slices anteriores construyeron el carrito de varias tiendas **y nunca lo vieron funcionar**:
la base tiene un solo vendedor, así que `groupBySeller` siempre devolvía un grupo y las dos piezas que
solo importan con dos tiendas —el total y el checkout— quedaron sin ejercitar. Una de las dos estaba
mal.

- **Total de la compra** bajo los grupos, con la nota de que se confirma un pedido por tienda. Se
  calcula al pintar, como los subtotales; no hay columna nueva.
- **Un `checkout_id` por carrito**, en la cookie `hs_checkout`. Nace al confirmar la primera tienda,
  lo reutiliza la segunda y se borra cuando el carrito se queda vacío.
- **La página del pedido enseña la compra entera** cuando tiene hermanos: cada tienda con su estado y
  su importe, el total de todo, y el pedido que se está mirando marcado. Solo al comprador.
- **Aviso de lo que queda por confirmar**: recién hecho un pedido, si el carrito todavía lleva otra
  tienda, se dice y se enlaza. Sin esto, la segunda mitad de la compra depende de que el comprador se
  acuerde de volver al carrito.
- **Una segunda tienda de verdad**, sembrada con `pnpm run seed:demo-seller`, reversible con
  `--remove`. Es lo que permite probar todo esto en el navegador en vez de solo en Vitest.
- **Sin migración.** `checkout_id` y su índice están desde `0032`.

**Criterios de aceptación:**
1. Un carrito con dos tiendas enseña dos grupos con su subtotal y, debajo, el total de los dos.
2. Con una sola tienda no se pinta un segundo total: sería la misma cifra dos veces.
3. Confirmar la primera tienda deja la segunda en el carrito, y confirmar la segunda produce dos
   pedidos con **el mismo** `checkout_id`.
4. La página de cualquiera de los dos pedidos lista los dos, con el total de la compra.
5. El vendedor que abre ese mismo pedido **no** ve la otra tienda.
6. Vaciar el carrito a mano y empezar otro produce un checkout distinto: la compra de ayer no se
   engancha a la de hoy.
7. Una cookie `hs_checkout` manipulada no rompe la confirmación: se descarta y se empieza de nuevo.

### Slice 6 — El pedido se reconoce sin abrirlo  *(actual)*

**El defecto son tres, y los tres se ven en la base de hoy** (5 pedidos, 15 de agosto de 2026):

1. `BuyerOrders` se escribió "resumido, no desglosado" a propósito, y la premisa era que el detalle
   podía esperar a `/pedido/<id>`. Con los pedidos reales esa premisa se cae: **cuatro son a la misma
   tienda, los cuatro `PENDING`, tres de la misma semana**. Tienda, estado y fecha ya no distinguen
   nada, y lo único que los separa —qué se pidió— es justo lo que no se enseña. El de 525 lleva 3
   renglones y 9 artículos; el de 70, dos renglones. Desde la lista los dos se ven igual.
2. **El vendedor no ve a quién le prepara el pedido.** No es que no se pinte: `listBySeller` no trae
   el comprador, y `listWhere` sólo hace `JOIN sellers`. La clave `orders.buyer` («Lo pidió {name}»)
   lleva en los dos catálogos desde el slice 2 sin que nadie la use.
3. **La búsqueda sólo dispara con Enter**, porque es un `<form method="get">` pelado. La búsqueda
   principal del sitio (`SearchBar`) filtra mientras se escribe: dos comportamientos distintos para
   el mismo gesto, en el mismo sitio.

- **Una sola tarjeta para los dos papeles** (`presentation/orders/OrderCard/`): la contraparte y el
  estado arriba, la fecha y cuántos artículos debajo, los renglones de `OrderLines` en medio, y un
  pie que cambia — las acciones del vendedor, o «Ver el pedido» para quien compró.
- **La tarjeta del comprador deja de ser un enlace entero.** Es la consecuencia directa de la
  decisión de arriba, no un capricho: los renglones ahora enlazan a su producto, y un enlace no puede
  llevar enlaces dentro. El destino no se pierde, se nombra («Ver el pedido»).
- **Quién pidió**, con avatar y enlazado a `/u/<username>` cuando lo tiene: `users` entra en la misma
  consulta que ya hacía `JOIN sellers`, por el mismo motivo que se escribió allí — es una fila que ya
  está en memoria. También en `/pedido/<id>`, y **sólo para el vendedor**: a quien compró decirle que
  lo pidió él no le informa de nada.
- **La búsqueda filtra mientras se escribe**, con 300 ms de espera y `router.replace` para no llenar
  el historial de un teclazo por letra. El `<form method="get">` **se queda**: es lo que hace que
  Enter siga funcionando y que la pantalla sirva sin JavaScript.
- **Sin migración.** Todo sale de columnas que ya existen.

#### Por qué `replace` y no `push`

Escribir «suero» son cinco cambios de URL. Con `push`, el botón de atrás obliga a deshacerlos letra
por letra antes de salir de la página; con `replace`, atrás devuelve a donde se estaba antes de
buscar, que es lo que quiere quien pulsa atrás. El precio es que no se puede "deshacer" una letra con
el navegador, que nadie hace: para eso está la tecla de borrar.

#### Por qué 300 ms y no los 500 de `SearchBar`

No son la misma operación. `SearchBar` va a la API de búsqueda semántica y pinta un desplegable
encima de lo que estás leyendo; equivocarse ahí cuesta una consulta cara y un parpadeo. Aquí se
refiltra una lista que ya estás mirando, contra un `ILIKE` sobre los pedidos de una sola persona.

**Criterios de aceptación:**
1. Una tarjeta de «Tus pedidos» enseña sus renglones con miniatura, cantidad e importe, y su total,
   sin abrir el pedido.
2. Cada renglón enlaza a su producto, y «Ver el pedido» al detalle.
3. La tarjeta del vendedor dice quién lo pidió y su nombre lleva a su perfil cuando tiene `username`;
   sin `username` se lee igual, sin enlace.
4. Las dos tarjetas dicen cuántos artículos lleva el pedido, contando cantidades y no renglones.
5. Escribir «suero» filtra la lista sin pulsar Enter, conserva pestaña y estado, y vuelve a la
   página 1.
6. Pulsar Enter sigue funcionando, y la búsqueda sigue siendo un `<form method="get">` con su campo
   `q`, así que también funciona sin JavaScript.

### Slice 7 — Pago en línea  *(@future, condicionado)*

El 5 y el 6 se hicieron en paralelo, en dos ramas, y el pago se quedó donde estaba: sin fecha. Es el
7 porque los otros dos ya existen, no porque se haya acercado.

**No se empieza hasta que los pedidos del slice 2 lo justifiquen.** No es una pantalla de checkout:
es repartir dinero entre vendedores, y eso trae KYC por vendedor, datos fiscales, devoluciones y
contracargos. Antes de escribir una línea hay que responder, con números: cuántos pedidos hay al mes,
cuántos se caen entre `PENDING` y `DELIVERED`, y si a quien compra local le estorba pagar al recibir.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| El carrito muestra un precio viejo | La cookie no guarda precios: se releen de la base en cada render |
| Un producto se agota con el carrito lleno | Se marca en el renglón y se excluye del total y del mensaje; no se borra en silencio |
| La cookie crece sin control | Solo ids y cantidades; se acota el número de renglones al validarla |
| Se diseña para un vendedor y llegan dos | El corte por vendedor está en el dominio desde el primer commit, no en la UI |
| Vender de verdad en el plan Hobby de Vercel | Pendiente que ya estaba anotado en `vendedores-y-tiendas.md`; sigue sin ser código |

## Fuera de alcance (por ahora)

Pago en línea (slice 7, condicionado). Envíos, paquetería y costos de entrega. Inventario y descuento
de existencias — hoy `is_available` es un sí/no, no una cantidad. Cupones y promociones. Facturación.
Calificaciones del vendedor tras la compra.

## Enfoque de pruebas

- **Unit (Vitest):** `groupBySeller` con dos tiendas (el caso que hoy no existe en la base pero que el
  modelo tiene que sostener); subtotales y total; el `parse`/`serialize` de la cookie con entradas
  manipuladas; el armado del mensaje de WhatsApp del grupo.
- **Component (Vitest):** el botón de añadir sobre un anuncio y sobre un producto agotado.
- **Behavior (Playwright):** `src/e2e/orders/orders.feature`. Los escenarios de los slices 1–5 están
  detallados y conectados; el del slice 6 lleva `@future` y no corre en CI. Desde el slice 5 **las dos
  tiendas se prueban también en el navegador** (`multiSeller.spec.ts`, que siembra las suyas), no solo
  en Vitest.
