# Pedido enviado + tracking del repartidor

## Contexto

- **Problem:** hoy el pedido salta de "En preparación" directo a "Entregado". Ni el vendedor ni
  el comprador tienen forma de marcar/ver que el pedido ya salió del local y va en camino.
- **Savings:** menos mensajes de "¿ya viene?" que el vendedor contesta a mano por WhatsApp.
- **Why:** es el paso 1 de un tracking en vivo del repartidor con GPS — sin esta "ventana"
  (`SHIPPED`) no existe un estado en el que después mostrar un mapa.

## Dependencia externa (bloqueante, ya resuelta para este slice)

El enum `orderstatus` es una tabla compartida con `bot-whatsapp` (Alembic, no Drizzle). Se
escribió la migración `0057_2026-09-18_add_shipped_value_to_orderstatus_enum.py` en ese repo
(`ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'SHIPPED'`) y se validó con `ruff` + los tests de
`test_order_use_cases.py` (7/7). **No se aplicó** a la base compartida (`alembic upgrade`) — eso
sigue pendiente de tu aprobación explícita, y el slice 1 de aquí no puede probarse contra la base
compartida hasta que se aplique.

## Slice 1 (este) — Estado opcional "Enviado"

**Alcance:** agregar `SHIPPED` entre `PREPARING` y `DELIVERED`. Es **opcional**: quien entrega en
mano o no usa repartidor sigue pudiendo saltar de `PREPARING` a `DELIVERED` directo, exactamente
como hoy. Sin GPS, sin repartidor, sin mapa — eso es el slice 2.

- `src/domain/order/order.ts`: `SHIPPED` se suma a `ORDER_STATUSES`, a `OrderAction`, a
  `OPEN_STATUSES` (sigue siendo un pedido abierto) y a `TRANSITIONS`:
  `PREPARING → [SHIPPED, DELIVERED, CANCELLED]`, `SHIPPED → [DELIVERED, CANCELLED]`.
- `src/domain/order/orderStock.ts`: `SHIPPED` se suma a `STOCK_APPLIED` — el inventario ya se
  descontó al aceptar, y cancelar desde `SHIPPED` debe devolverlo igual que desde `PREPARING`.
- `src/infra/dataAccess/db/schema/orders.ts`: se refleja el valor nuevo en el `pgEnum`
  (mirror, sin migración de Drizzle — la tabla la sigue creando/alterando Alembic).
- UI: botón "Marcar como enviado" en el panel del vendedor (sale solo de `nextStatuses`, sin
  tocar `SellerOrders.tsx`), insignia y fecha del estado para el comprador.
- Catálogo `orders` en `es.json`/`en.json`: `action.SHIPPED`, `status.SHIPPED`, `since.SHIPPED`.

**Acceptance criteria:**
- El vendedor puede llevar un pedido `PREPARING → SHIPPED → DELIVERED`, o seguir saltando
  `PREPARING → DELIVERED` directo.
- Cancelar desde `SHIPPED` devuelve el inventario reservado, igual que desde `PREPARING`.
- El comprador ve la insignia "Enviado" y desde cuándo, en la lista y en la ficha del pedido.
- Las transiciones no permitidas (`SHIPPED → PREPARING`, `PENDING → SHIPPED`, etc.) se rechazan
  igual que las demás, con el mismo mensaje de error.

**Decisión de diseño abierta — color de la insignia:** hoy solo existen tres tonos de marca
(`brand-green`, `brand-clay`, `brand-honey`), cada uno ya asignado. Propongo sumar un cuarto tono
(`brand-sky` o similar, validado en `brandPalette.contrast.test.ts` junto a los otros tres) para
que "Enviado" no se confunda con "En preparación" (honey) — el mismo criterio que ya separó esos
dos colores. Dilo si prefieres reutilizar un tono existente en vez de sumar uno nuevo.

## Slice 2 (este) — Última posición del repartidor

**El repartidor no es usuario de Hazlo Sano, y es deliberado.** En esta etapa el repartidor es
ocasional —un mototaxi, un familiar, el propio vendedor en su moto—, no una flotilla fija. Obligar
a crear cuenta para mandar una coordenada mata la función antes de empezar. En vez de eso, el
pedido lleva un **token propio**: el vendedor comparte un enlace y quien lo abra puede mandar su
posición **de ese pedido y de ninguno más**.

**Alcance:**

- **Migración en `bot-whatsapp`** (columnas nuevas en `customer_orders`): `tracking_token`,
  `courier_lat`, `courier_lng`, `courier_location_updated_at`. Todas nulables: un pedido que nunca
  se despacha no las usa nunca.
- **Tipos simples (`double precision`), no PostGIS.** `branches.location` sí es
  `geography(POINT,4326)` porque se consulta por distancia en SQL (`ST_Distance`), y por eso vive
  fuera de Drizzle con SQL crudo. Aquí no hay ninguna consulta por distancia: es un punto que se
  escribe y se pinta. El precedente que aplica es `users.lastLatitude`/`lastLongitude`/
  `locationUpdatedAt`, que es exactamente el mismo caso —última posición conocida de alguien— y es
  un par de `doublePrecision` en Drizzle.
- **El token nace al marcar "Enviado"**, aleatorio y no adivinable. No hace falta invalidarlo
  aparte: la escritura exige `status === "SHIPPED"`, así que deja de servir solo en cuanto el
  pedido se entrega o se cancela.
- **La página del repartidor**, `/pedido/[id]/repartidor/[token]`, es pública y sin sesión. Valida
  el token contra el pedido, y un botón "Compartir mi ubicación" arranca
  `navigator.geolocation.watchPosition` mandando la posición cada ~15 s mientras la pestaña siga
  abierta. Reutiliza el patrón de `useShareLocation`, pero escribiendo al pedido por token en vez
  de al usuario por sesión.
- **El mapa del comprador**, en `/pedido/[id]`, solo mientras el pedido esté `SHIPPED` y ya haya
  una posición. Reutiliza el patrón de `StoresMap`/`StoresMapCanvas` (Leaflet con `next/dynamic`,
  `ssr: false`, marcador `divIcon`), con un marcador y *polling*, no websockets: un pedido de
  comida no necesita actualización sub-segundo y el stack no tiene conexiones persistentes hoy.

**Acceptance criteria:**

- Al marcar un pedido como "Enviado", el vendedor obtiene un enlace para el repartidor y puede
  mandárselo por WhatsApp.
- Quien abre ese enlace puede compartir su ubicación sin iniciar sesión, y el comprador la ve en un
  mapa en la ficha del pedido mientras siga "Enviado".
- Un token que no corresponde al pedido —o uno correcto sobre un pedido ya entregado o
  cancelado— no puede escribir ninguna posición.
- Un pedido "Enviado" sin posición todavía no pinta un mapa vacío: dice que aún no hay ubicación.

**Lo que NO entra:** recorrido histórico (solo se guarda la última posición, no la ruta), distancia
o tiempo estimado de llegada, y notificaciones de "ya llegó". Si algún día se quiere el trazo, se
migra a una tabla aparte; hoy sería guardar datos que nadie mira.

## Slice 3 (este) — Distancia y ETA aproximado

**El sitio no guarda ninguna dirección de entrega**, y ese es el hallazgo que enmarca el slice: la
logística se coordina entera por WhatsApp, fuera de cualquier dato estructurado. `users.lastLatitude`
existe, pero es "la última vez que alguien compartió su ubicación por cualquier motivo" — usarla como
destino de una entrega concreta sería una suposición floja (pudo compartirse hace días, desde otro
lugar). La decisión: **la ubicación de entrega vive en el propio pedido**, no en la cuenta, y se
puede compartir en dos momentos — al confirmar, o después desde la ficha.

**Alcance:**

- **Migración en `bot-whatsapp`** (columnas nuevas en `customer_orders`): `delivery_lat`,
  `delivery_lng`, `delivery_location_updated_at`. Mismo patrón que las de seguimiento del
  repartidor — `double precision`, todas nulables.
- **Compartir al confirmar es de mejor esfuerzo, sin paso nuevo.** El botón "Hacer el pedido a
  {store}" pide la ubicación al navegador (con un plazo corto) en el mismo clic; si el navegador
  contesta a tiempo, viaja con el propio formulario. Si no contesta, se niega, o tarda, el pedido se
  registra igual, sin destino. **No se agrega un paso ni un permiso aparte del que ya existe.**
- **También se puede compartir o actualizar después**, desde la ficha del pedido — el mismo botón
  que ya existe en el sitio para esto (`ShareLocationButton`/`useShareLocation`), pero escribiendo
  en el pedido y no en la cuenta.
- **La distancia la calcula PostGIS, no una fórmula en JavaScript.** Es una regla ya escrita en el
  código (`locationFreshness.ts`): la única aritmética de distancia en JS del proyecto es para
  decidir si vale la pena escribir una actualización, nunca para la cifra que se le enseña a
  alguien. Se calcula con `ST_Distance` sobre puntos armados al vuelo
  (`ST_MakePoint(...)::geography`) a partir de las columnas sueltas — no hace falta convertirlas a
  `geography` para eso.
- **El ETA es una estimación explícita, no una promesa.** Distancia en línea recta ÷ una velocidad
  urbana asumida (repartidor en moto, con paradas y tráfico) — no hay ruteo real (Google
  Directions/OSRM sería otro slice). Se rotula como aproximado.
- **Sin ubicación de entrega, el mapa se queda exactamente como en el slice 2**: la posición del
  repartidor, sin distancia — no se pinta un espacio vacío ni un error, y se ofrece el botón para
  compartirla en cualquier momento.

**Acceptance criteria:**

- Al confirmar un pedido, si el navegador entrega una posición a tiempo, ese pedido queda con su
  propio destino guardado — sin pedir permiso dos veces ni añadir un paso.
- Si el comprador no compartió nada al confirmar, puede hacerlo después desde la ficha del pedido,
  en cualquier momento (no solo mientras está "Enviado").
- Con destino guardado y el repartidor en camino, la ficha dice la distancia y un tiempo estimado,
  marcado como aproximado.
- Sin destino guardado, la ficha sigue exactamente como en el slice 2: mapa con la posición del
  repartidor, sin distancia, con la invitación a compartir la ubicación.
- Actualizar la ubicación desde la ficha cambia la distancia mostrada en la siguiente carga.

**Lo que NO entra:** ruteo real (calles, tráfico en vivo), notificación de "ya casi llega", y
recorrido histórico del comprador (solo su última posición, igual que el repartidor).
