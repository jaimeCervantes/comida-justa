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

### Slice 2 — El pedido queda registrado y el vendedor lo administra  *(@future)*

Aquí entra la base, y con ella el proceso que el vendedor necesita.

- **Migración Alembic (aditiva)** sobre `orders`, que tiene 0 filas: `seller_id`, renglones
  normalizados con su precio congelado, y el hueco de la referencia de pago **en la misma migración**
  — dos migraciones sobre la base compartida son dos veces el riesgo (misma lección que el slice 1 de
  `vendedores-y-tiendas.md` con `users.username`).
- Confirmar escribe el pedido en `PENDING` antes de abrir WhatsApp.
- Sección "Pedidos" en `/cuenta`, con el flujo `PENDING → CONFIRMED → PREPARING → DELIVERED` y
  `CANCELLED` desde cualquier punto.

> **Es el único paso irreversible del roadmap** y se consulta antes de tocarlo, según `AGENTS.md`.

### Slice 3 — El comprador ve sus pedidos y en qué van  *(@future)*

Sin esto el registro solo sirve al vendedor, y quien pidió sigue preguntando por WhatsApp "¿ya está?".

### Slice 4 — Pago en línea  *(@future, condicionado)*

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

Pago en línea (slice 4, condicionado). Envíos, paquetería y costos de entrega. Inventario y descuento
de existencias — hoy `is_available` es un sí/no, no una cantidad. Cupones y promociones. Facturación.
Calificaciones del vendedor tras la compra.

## Enfoque de pruebas

- **Unit (Vitest):** `groupBySeller` con dos tiendas (el caso que hoy no existe en la base pero que el
  modelo tiene que sostener); subtotales y total; el `parse`/`serialize` de la cookie con entradas
  manipuladas; el armado del mensaje de WhatsApp del grupo.
- **Component (Vitest):** el botón de añadir sobre un anuncio y sobre un producto agotado.
- **Behavior (Playwright):** `src/e2e/orders/orders.feature`. Solo los escenarios de `@slice-1` están
  detallados y conectados; los de los slices 2–4 llevan `@future` y no corren en CI.
