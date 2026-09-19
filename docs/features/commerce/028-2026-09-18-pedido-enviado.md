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

## Slice 2 (futuro, `@future`) — Última posición del repartidor

**Alcance (grueso, se detalla cuando el slice 1 esté verde):** columnas `lat`/`lng`/
`locationUpdatedAt` en `customer_orders` (migración en `bot-whatsapp`, mirror aquí), una vista
para que el repartidor mande su posición (`navigator.geolocation.watchPosition`, cada ~10-15 s,
solo mientras el pedido está `SHIPPED`), y un mapa para el comprador que hace polling mientras
dure esa ventana. Se apaga solo al pasar a `DELIVERED`/`CANCELLED`.
