# Inventario de existencias

> Roadmap de rebanadas. La bitácora de cada una vive en
> `004-2026-09-03-inventario-de-existencias-bitacora.md`.

## Contexto

- **Problem:** el agotado es un interruptor binario y manual. `posts.is_available` solo sabe decir
  "sí" o "no", así que quien vende no sabe cuántas donas le quedan y se entera de que se acabaron
  cuando ya prometió una que no tiene. De las 418 publicaciones de tipo `producto`, 4 están marcadas
  agotadas — todas a mano. Los pedidos ya vendidos (9 pechugas, 8 donas, 7 sueros) no descontaron
  nada de ningún lado, porque no hay ningún lado.
- **Savings:** menos pedidos que cancelar a mano, menos "ya no me quedan" por WhatsApp, y dejar de
  repasar 418 publicaciones una por una para saber qué hay que reponer. El chatbot deja de
  recomendar lo que se acabó sin que nadie tenga que acordarse de apagarlo.
- **Why:** es lo que separa un catálogo de un comercio. Lo que se ofrece pasa a ser lo que de verdad
  hay, y sobre ese número se pueden tomar decisiones que hoy no existen: qué reponer, qué se vende,
  qué sobra.

**As** dueño de una tienda o de una publicación
**I want** llevar la cuenta de cuántas unidades me quedan de cada producto
**So that** deje de ofrecer lo que ya no tengo sin tener que acordarme de apagarlo

## El modelo acordado

Un "ejemplar" es **una unidad contada**, no una fila con identidad propia: el inventario es un
número por producto, no un registro por pieza.

### `posts.stock_quantity integer NULL`

| Valor  | Significa                                    | Quién queda así                                   |
| ------ | -------------------------------------------- | ------------------------------------------------- |
| `NULL` | **No lleva inventario.** Nadie cuenta nada.  | Las 418 publicaciones de hoy, sin tocar una fila. |
| `0`    | Agotado por inventario.                      | Lo que se vendió entero.                          |
| `> 0`  | Quedan tantas.                               | Lo que el dueño puso a contar.                    |

**`NULL` no es `0`.** Es la distinción que hace que esta entrega no cambie el comportamiento de
nada de lo ya publicado: un producto sin inventario se comporta exactamente como hoy, con su
interruptor manual de agotado. Llevar inventario es una decisión que se toma producto por producto.

### `is_available` sigue siendo la columna que todos leen

El sitio, el carrito, la búsqueda, el JSON-LD y **el chatbot** ya filtran por `is_available`. No se
toca a ninguno de ellos: cuando un producto lleva inventario, **el inventario manda** y
`is_available` se deriva de él en la misma escritura.

```
llevaInventario(post)  =  stock_quantity IS NOT NULL

is_available  =  llevaInventario(post) ? stock_quantity > 0 : (lo que el dueño puso a mano)
```

Con eso el bot deja de recomendar lo agotado sin conocer la columna nueva, y el interruptor manual
de "marcar agotado" se sigue usando tal cual en todo lo que no lleva inventario.

### Quién puede administrarlo

Hoy `SetPostAvailabilityUseCase` autoriza con `post.ownerId !== userId`. Se suma una segunda vía:

```
puedeAdministrar(post, sesión)  =  post.ownerId === sesión.userId
                                || post.sellerId === sesión.sellerId
```

`sellerId` sale de `findSellerOfUser(session.user.id)`, **nunca del formulario**. Hoy las dos vías
apuntan a la misma persona —las 420 publicaciones son de `44pZIIJ5w1vSYkDQ6gfb`, que además es el
dueño de `Hazlo Sano`—, así que no cambia nada hasta el día que la tienda tenga más de una mano.

### Lo que NO se hace

- **No hay tabla de movimientos.** Un `stock_quantity` no dice *por qué* cambió. Es deliberado:
  la pregunta "¿quién bajó esto de 12 a 3?" no tiene demanda todavía, y `customer_order_status_changes`
  ya reconstruye lo que descontó cada pedido cuando llegue la rebanada 3.
- **No hay lotes ni caducidad.** El dato "6 hogazas que caducan el viernes" es otro modelo y otra
  entrega.
- **No hay reserva al añadir al carrito.** Un carrito no compromete inventario; un pedido aceptado
  sí (rebanada 3).

## Rebanadas

### Slice 1 — Fijar y ver existencias por producto

**Alcance.** El dueño de la publicación *o* el dueño de su tienda abre la ficha del producto,
escribe cuántas unidades quedan y el sitio lo refleja: el visitante ve "Quedan 3", y en 0 aparece la
insignia de Agotado sin que nadie la haya pulsado. El producto que no lleva inventario se comporta
igual que hoy.

**Criterios de aceptación.**

1. La migración Alembic `0048_2026-09-03` añade `posts.stock_quantity integer NULL` con
   `CHECK (stock_quantity IS NULL OR stock_quantity >= 0)`, y las 420 publicaciones quedan en `NULL`.
2. Guardar existencias en un producto escribe `stock_quantity` **y** deriva `is_available` en la
   misma sentencia. Nunca quedan en desacuerdo.
3. Poner 0 muestra la insignia Agotado, apaga "Pedir por WhatsApp" y lo saca del carrito y de las
   recomendaciones del bot — por el mismo camino que ya usa el agotado manual.
4. Subir de 0 a un número positivo lo vuelve a ofrecer.
5. El dueño de la tienda puede fijar las existencias de un producto de su tienda que publicó otra
   persona; quien no es ni una cosa ni la otra recibe el mismo error que hoy da editar lo ajeno.
6. Un anuncio, un evento y un servicio no ofrecen el campo: no se cuentan ejemplares de lo que no se
   entrega. (Un servicio se vende, pero no tiene unidades — su disponibilidad es la agenda.)
7. Un valor que no sea un entero ≥ 0 se rechaza con un mensaje, sin escribir nada.
8. Las publicaciones que hoy existen (`stock_quantity IS NULL`) siguen con su interruptor manual y
   sin número visible.

**Qué se toca.** Migración Alembic + espejo Drizzle; `src/domain/entities/post/stock.ts` (nuevo) y
`postPermissions.ts` (nuevo); `SetPostStockUseCase`; `IPostAdminRepository.setStock`;
`OwnerControls` y `PostDetail`; catálogos `es`/`en`.

### Slice 2 — El panel de inventario de la tienda

**Alcance.** `/cuenta/inventario`: la lista de los productos de la tienda con su número editable en
la misma tabla, para no abrir 418 fichas. Filtro por "agotados" y "sin inventario".

**Criterios de aceptación.** El dueño de la tienda ve **todos** los productos de su tienda,
publicara quien los publicara; edita un número sin salir de la tabla; la entrada aparece en
`AccountNav` solo si tiene tienda, como ya hace la agenda.

### Slice 3 — El pedido descuenta al aceptarse

**Alcance.** Cuando el vendedor pasa un pedido de `PENDING` a `CONFIRMED`, las cantidades de sus
renglones se restan del inventario de cada producto que lo lleve. Cancelar un pedido ya aceptado las
devuelve.

**Criterios de aceptación.** Un pedido que pide más de lo que hay no se puede aceptar y dice por
qué; los renglones de productos sin inventario no afectan a nada; un pedido cancelado desde
`PENDING` (que nunca descontó) no devuelve nada. Si el descuento agota un producto, queda agotado
para todos por la regla derivada del slice 1.

### Slice 4 — Las existencias se editan desde la tarjeta

**De dónde sale.** De mirar el catálogo propio y no poder arreglar lo que se ve. Es el mismo
argumento que ya justificó `CardOwnerControls` en su día —«obligarle a abrir cada publicación para
apagar tres cosas que se acabaron convierte un minuto en cinco»— aplicado al número en vez de al
interruptor. La tarjeta ya ofrece editar y marcar agotado; le falta la cuenta.

- **Problem:** el número sólo se toca en dos sitios: la ficha de cada producto y el panel. Quien
  está mirando su tienda o su perfil y ve que de algo quedan pocas tiene que irse a otra pantalla,
  encontrarlo otra vez y volver. Y hay un hueco peor: en `/tienda/<handle>` la tarjeta decide quién
  manda por **quién publicó** (`viewerId === post.user.id`), no por quién lleva la tienda, así que
  al dueño no se le ofrece nada sobre lo que escribió otra cuenta — justo lo que el slice 1 vino a
  habilitar en la ficha y aquí sigue sin hacerse.
- **Savings:** recontar donde ya estás mirando, sin cambiar de pantalla ni buscar dos veces. Y una
  incoherencia menos: el mismo permiso en los dos sitios donde aparece una publicación.
- **Why:** el inventario sólo se mantiene si mantenerlo es más barato que no hacerlo. El panel sirve
  para sentarse a hacer inventario; la tarjeta, para arreglar lo que ves de paso. Son dos momentos y
  hacen falta los dos.

**Alcance.**

1. `stock_quantity` llega a la proyección que alimenta las tarjetas (`IPostQueryRepository` y
   `PostgresPostQueryRepository`), como ya llegó a la de la ficha en el slice 1.
2. `CardOwnerControls` gana el campo de existencias —el mismo `StockControl` compacto del panel— y
   **esconde «marcar agotado» cuando el producto lleva la cuenta**, que es la regla del slice 1
   preguntada al mismo sitio (`carriesInventory`), no reescrita.
3. Las tarjetas dejan de decidir por «quién publicó» y pasan a preguntar `canManagePost`, con el
   `sellerId` de quien mira. Sólo `/tienda/<handle>` necesita bajarlo: en `/u/<username>` todo lo
   que se lista es de la misma cuenta, así que la vía de la tienda no añade nada.

**Criterios de aceptación.**

1. En su perfil y en su tienda, el dueño ve el campo de existencias en la tarjeta de un `producto` y
   guardar desde ahí cambia el número igual que desde la ficha — es la misma acción.
2. Una tarjeta cuyo producto lleva inventario **no** ofrece además «marcar agotado».
3. El dueño de la tienda ve el campo en un producto de su tienda publicado por otra cuenta.
4. Quien no es ni una cosa ni la otra no ve nada, y el servidor lo rechaza igual si lo fuerza.
5. Un anuncio, un evento y un servicio siguen sin campo, y conservan lo que ya tenían.
6. Guardar desde la tarjeta deja la ficha diciendo lo mismo, y en 0 aparece la insignia de agotado.

**Qué NO entra.** La búsqueda —ni en el panel ni en la tienda— es otra rebanada; que la tienda no
tenga buscador hoy es cierto y no lo arregla ésta.

### Slice 5 — Buscar dentro del inventario y dentro de la tienda

- **Problem:** `Hazlo Sano` tiene 418 productos y ninguna de las dos pantallas donde se recorren
  deja buscar. El panel sólo ordena alfabéticamente, así que llegar a uno concreto son varias
  páginas de 20; la tienda sólo filtra por pilar, y quien busca «masa madre» entre 418 tarjetas no
  lo encuentra: se rinde. La búsqueda del sitio (`/buscar`) es semántica y global — sirve para
  descubrir, no para filtrar un catálogo que ya estás mirando.
- **Savings:** dejar de paginar a ciegas. Un recuento que hoy cuesta encontrar el producto pasa a
  costar teclear tres letras, y una tienda con catálogo grande deja de ser un muro para quien
  compra.
- **Why:** el inventario sólo se mantiene si mantenerlo es barato, y una tienda sólo vende lo que se
  puede encontrar. Las dos búsquedas son la misma pieza puesta en dos sitios.

**Alcance.**

1. **Un solo campo, reutilizado tres veces.** `OrdersSearchField` ya resuelve esto bien —filtra al
   teclear, con `<form>` que sigue funcionando sin JavaScript, `replace` para no llenar el historial,
   y una referencia a lo último pedido para que la respuesta a la tercera letra no devuelva el campo
   atrás cuando vas por la quinta—. Escribirlo dos veces más sería la tercera copia: se extrae a
   `presentation/search/`, y pedidos pasa a ser uno de sus tres clientes, como ya hizo
   `OrdersPagination` con `QueryPagination`.
2. **Una sola regla para el término.** Hoy el tope de 80 caracteres y el `trim` están escritos dos
   veces —en `/pedidos/page.tsx` y en su campo—. Pasa al dominio y lo comparten los tres.
3. **El panel** (`/cuenta/inventario`) gana `?q=`, que convive con sus tres ámbitos.
4. **La tienda** (`/tienda/<handle>`) gana `?q=`, que convive con el filtro de pilar y viaja en la
   paginación por segmento, igual que ya hace `pillar`.

**Cómo busca.** Por **título**, con `ILIKE`, en cualquiera de sus idiomas: quien teclea «masa madre»
lo espera aunque esté mirando en inglés. No por contenido —un filtro que devuelve cosas cuyo texto
menciona la palabra es ruido— y no semántico: eso ya es `/buscar`, y aquí se filtra lo que ya se
está mirando.

**Criterios de aceptación.**

1. En el panel, teclear filtra la tabla sin pulsar Enter; el término viaja en la dirección y
   sobrevive a recargar y a compartir el enlace.
2. Buscar y filtrar por ámbito se combinan; cambiar cualquiera de los dos vuelve a la página 1.
3. En la tienda, buscar filtra el catálogo y se combina con el filtro de pilar; la paginación
   conserva los dos.
4. Sin resultados, cada pantalla lo dice con una frase que distingue «no hay nada con ese filtro» de
   «no hay nada».
5. La búsqueda de la tienda la ve **cualquiera**, no sólo su dueño: es un catálogo público.
6. Con JavaScript apagado, el `<form>` sigue funcionando con Enter en las tres pantallas.
7. Pedidos sigue comportándose exactamente igual: su suite entera vuelve a pasar.

## Riesgos

- **La base es compartida.** La migración la administra Alembic en el backend Python
  (`bot-whatsapp/backend`, head `0047_2026_08_29`). El espejo Drizzle se edita a mano después.
- **Dos fuentes de verdad para "¿está disponible?"** es el riesgo real de esta entrega, y se cierra
  con la regla derivada: `is_available` nunca se escribe a mano en un producto que lleva inventario.
