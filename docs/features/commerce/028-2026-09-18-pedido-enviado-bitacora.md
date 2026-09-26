# Bitácora — Pedido enviado + tracking del repartidor

## Slice 1 — Estado opcional "Enviado" (2026-09-18)

**Objetivo:** agregar `SHIPPED` entre `PREPARING` y `DELIVERED`, opcional, para que el vendedor
pueda decir (y el comprador ver) que el pedido ya salió del local con un repartidor. Es el paso 1
de un futuro tracking en vivo por GPS.

### Decisiones y por qué

- **La migración del enum vive en `bot-whatsapp`, no aquí.** `orderstatus` es una tabla compartida
  administrada por Alembic; se escribió `0057_2026-09-18_add_shipped_value_to_orderstatus_enum.py`
  en ese repo siguiendo el patrón exacto de la migración anterior que agregó valores al mismo enum
  (`af4dcd1f9a17`), y se sumó `SHIPPED` al `OrderStatus` (Python) para no romper la paridad que ese
  repo ya mantenía entre su enum y la columna. **No se aplicó** a la base compartida — eso es una
  acción irreversible sobre un recurso compartido y queda pendiente de tu aprobación explícita.
- **`SHIPPED` es opcional por diseño.** `TRANSITIONS.PREPARING` tiene tres destinos
  (`SHIPPED`, `DELIVERED`, `CANCELLED`) en vez de reemplazar el camino directo: quien entrega en
  mano sigue pudiendo saltar de `PREPARING` a `DELIVERED`, sin repartidor de por medio.
- **El inventario no se toca dos veces.** `SHIPPED` se sumó a `STOCK_APPLIED` en `orderStock.ts`:
  el pedido ya descontó al aceptarse, así que cancelar desde `SHIPPED` devuelve inventario igual
  que cancelar desde `PREPARING`.
- **Un cuarto tono de marca (`brand-sky`).** Los tres tonos existentes (verde, barro, miel) ya
  estaban asignados; reutilizar cualquiera habría confundido "Enviado" con otro estado, el mismo
  problema que ya resolvió la miel frente al verde de "Aceptado". Validado con la misma fórmula de
  contraste que la paleta de marca (`brandPalette.contrast.test.ts`): 7.15:1 en claro, 8.03:1 en
  oscuro, ambos sobre el mínimo AA de 4.5.
- **Cero cambios en componentes de UI más allá del catálogo de colores/textos.** El botón del
  vendedor sale solo de `nextStatuses()` (`SellerOrders.tsx` no se tocó), y la insignia/fecha salen
  de `Record<OrderStatus, …>` tipados — TypeScript obligó a declarar `SHIPPED` en los tres sitios
  (`TONE`, catálogos `action`/`status`/`since`) y nada más.

### Archivos tocados

**`bot-whatsapp` (repo hermano, sin aplicar a la base):**
- `alembic/versions/0057_2026-09-18_add_shipped_value_to_orderstatus_enum.py` (nuevo; renumerada de
  `0056` a `0057` — ver "Desviaciones")
- `app/domain/models/order.py` (enum Python)
- `AGENTS.md` — documentado el comando de aplicar migraciones (`uv run alembic upgrade head`) y el
  prerequisito del certificado `certs/prod-ca-2021.crt`, que no estaban documentados

**Dominio:**
- `src/domain/order/order.ts` — `ORDER_STATUSES`, `OrderAction`, `TRANSITIONS`, `OPEN_STATUSES`
- `src/domain/order/orderStock.ts` — `STOCK_APPLIED`

**Mirror de schema:**
- `src/infra/dataAccess/db/schema/orders.ts` — `pgEnum`

**Tokens de diseño:**
- `src/presentation/design_system/tokens/colors.css` — `--brand-sky-soft`/`-ink` (claro y oscuro)
- `src/presentation/design_system/tokens/brandPalette.contrast.test.ts` — nuevo par medido

**i18n:**
- `src/i18n/messages/es.json`, `src/i18n/messages/en.json` — `action.SHIPPED`, `status.SHIPPED`,
  `since.SHIPPED`

**UI:**
- `src/presentation/orders/OrderStatusBadge/OrderStatusBadge.tsx` — tono nuevo, comentarios
  actualizados ("los ocho")
- `src/presentation/orders/OrderStatusSince/OrderStatusSince.tsx` — comentario actualizado

**Tests:**
- `src/domain/order/order.test.ts`, `orderStock.test.ts`, `scope.test.ts`
- `src/use_cases/advanceOrder/advanceOrderUseCase.test.ts`
- `src/presentation/orders/OrderStatusSince/OrderStatusSince.test.tsx`
- `src/presentation/orders/NotifySellerButton/NotifySellerButton.test.tsx`
- `src/e2e/orders/orders.feature` — filas nuevas en las tablas existentes + escenarios `@slice-11`
  + esqueleto `@slice-12 @future` (mapa) + pago empujado a `@slice-13 @future`
- `src/e2e/orders/orderShipped.spec.ts` (nuevo, no ejecutado — ver validación)

**Docs:**
- `docs/features/commerce/028-2026-09-18-pedido-enviado.md` (roadmap)
- Esta bitácora

### Validación

- `pnpm run typecheck` → limpio.
- `pnpm run lint` (biome) → un error de formato en `orderShipped.spec.ts`, corregido con
  `biome format --write`; segunda corrida limpia.
- `pnpm run test:run` (Vitest) → **279 archivos, 2958 tests, todos en verde** (incluye los ocho
  archivos de test tocados arriba).
- **Migración aplicada** (`uv run alembic upgrade head` en `bot-whatsapp`, corrida por el usuario).
  Confirmado con `alembic current` → `0057_2026_09_18 (head)`.
- `pnpm exec playwright test src/e2e/orders/orderShipped.spec.ts` → **2/2 en verde**, en dos
  corridas. La primera dejó un escenario en rojo por una condición de carrera en el propio spec:
  el segundo test navegaba a la ficha del pedido justo después del clic en "Marcar como enviado",
  y `page.goto` cancelaba esa Server Action a medio camino — el pedido se quedaba en `PREPARING` sin
  ningún error que lo delatara. Se corrigió extrayendo un helper `advance()` (mismo patrón que
  `orderHistory.spec.ts`) que espera a que la insignia refleje cada paso antes de seguir. No fue un
  defecto del código de producción, sino del spec.

### Desviaciones del roadmap

- Se corrigieron dos comentarios ya desactualizados ("los siete" → "los ocho") en
  `OrderStatusBadge.tsx` y `OrderStatusSince.tsx`, encontrados de paso al tocar esas mismas líneas.
- **La migración se renumeró de `0056` a `0057` tras un hallazgo en `bot-whatsapp`.** Al intentar
  `uv run alembic upgrade head`, la base compartida rechazó la migración: su `alembic_version`
  apuntaba a `0056_2026_09_16`, una revisión que no existía en ningún commit ni rama de ese repo —
  ni local ni en `origin`. Antes de tocar nada se verificó, con una consulta de solo lectura
  aprobada explícitamente, que `orderstatus` seguía con sus siete valores originales (nada de
  `SHIPPED` ni ningún otro fantasma) y que el resto del schema coincidía con lo último aplicado
  (`0055_2026_09_07`). Resultó que la migración sí existía — en otra máquina, sin subir todavía.
  Con `git pull` ya trajo `0056_2026-09-16_add_recommendation_accepted_at.py` (ajena a este slice),
  así que la propia se renumeró a `0057_2026-09-18_...` con `down_revision = "0056_2026_09_16"`, y
  `alembic heads` vuelve a mostrar una sola cabeza lineal.

### Recap

El slice 1 está **completo y cerrado**: `SHIPPED` existe en la base compartida (migración
`0057_2026-09-18_...` aplicada), el sitio lo transita de punta a punta (dominio, inventario, UI,
i18n) y las dos pruebas de Playwright del escenario lo confirman contra la base real, además de los
2958 tests de Vitest y typecheck/lint en verde.

## Slice 2 — Última posición del repartidor (2026-09-25)

**Objetivo:** que el repartidor —sin cuenta, sin sesión— pueda compartir su ubicación para un
pedido "Enviado" mediante un enlace con token, y que el comprador la vea en un mapa mientras dure
esa ventana.

### Decisiones y por qué

- **El repartidor no es usuario de Hazlo Sano.** Es ocasional en esta etapa —mototaxi, familiar, el
  propio vendedor—; pedirle cuenta mata la función. El pedido lleva su propio token, generado al
  marcar "Enviado" y guardado en la misma transacción que el cambio de estado (mismo diseño que
  `stockEffect` en `AdvanceOrderUseCase`: decidido en el caso de uso, aplicado por el repositorio).
- **El token nunca viaja en el `Order` de dominio.** Es una credencial de escritura, y `Order` se
  pasa entero a `NotifySellerButton` —un componente de cliente que también ve el comprador— en
  `/pedido/[id]`. Ponerlo ahí lo habría filtrado al navegador de quien compró. Vive aparte, en tres
  métodos nuevos del puerto (`getCourierTrackingToken`, `findByCourierToken`,
  `saveCourierLocation`) y solo se resuelve dentro de la rama `isSeller` de la página de detalle, o
  en el resultado inmediato de `advanceOrder` (seguro ahí porque `SellerOrders`/`SellerOrderCard`
  es exclusivamente la vista del vendedor, nunca la comparte el comprador).
- **La escritura de la posición exige token + `status = 'SHIPPED'` en el mismo `WHERE`** —
  `saveCourierLocation`—, no en un `if` previo: el enlace deja de servir solo en cuanto el pedido se
  entrega o se cancela, sin ningún proceso que lo invalide aparte.
- **Columnas sueltas (`double precision`), no PostGIS.** `branches.location` es
  `geography(POINT,4326)` porque se consulta por distancia en SQL; aquí solo se escribe y se pinta
  un punto. El precedente que aplica es `users.lastLatitude/lastLongitude/locationUpdatedAt` —
  exactamente el mismo caso, última posición conocida de alguien.
- **El mapa del comprador hace *polling*, no websockets** (`router.refresh()` cada 15 s): es el
  mismo criterio que ya se decidió para todo el tracking, y el sitio no tiene conexiones
  persistentes hoy.
- **`CourierMapCanvas` no reutiliza `StoresMapCanvas`.** Aquella resuelve "dónde caben N tiendas más
  un visitante" (`viewFor`, ajuste de límites); aquí hay un solo punto fijo, así que reutiliza el
  patrón (`divIcon`, `next/dynamic` con `ssr:false`, `Surface`+`isolate z-0`) y no el componente —
  forzar la misma API habría sido más código, no menos.
- **Sin sesión, sin `useActionState`.** El hook `useShareCourierLocation` no es un envío único con
  pendiente/resultado como `useShareLocation`; repite el envío solo cada 15 s mientras la pestaña
  siga abierta, y se detiene solo si el servidor contesta que el token ya no vale.

### Archivos tocados

**`bot-whatsapp` (repo hermano, sin aplicar a la base):**
- `alembic/versions/0058_2026-09-25_add_courier_tracking_to_customer_orders.py` (nuevo): 4 columnas
  nulables en `customer_orders` — `tracking_token`, `courier_lat`, `courier_lng`,
  `courier_location_updated_at`.

**Dominio:**
- `src/domain/order/order.ts` — `isTrackable`, `CourierLocation`, `Order.courierLocation`
- `src/domain/order/ports.ts` — `getCourierTrackingToken`, `findByCourierToken`,
  `saveCourierLocation`, `updateStatus.courierTrackingToken`

**Mirror de schema:**
- `src/infra/dataAccess/db/schema/orders.ts` — las 4 columnas
- `src/infra/dataAccess/orders/PostgresOrderRepository.ts` — los tres métodos nuevos, `updateStatus`
  extendido, `listWhere` trae `courier_lat/lng/updated_at`

**i18n:**
- `src/i18n/routing.ts` — pathname `/pedido/[id]/repartidor/[token]`
- `src/i18n/messages/es.json`, `en.json` — `courier.*`, `courierLink*`, `courierMap*`

**Casos de uso:**
- `src/use_cases/courierTracking/shareCourierLocation/shareCourierLocationUseCase.ts` (nuevo)
- `src/use_cases/advanceOrder/advanceOrderUseCase.ts` — genera el token al pasar a `SHIPPED`

**UI:**
- `src/presentation/orders/ShareCourierLinkNotice/ShareCourierLinkNotice.tsx` (nuevo) — enlace +
  botón de WhatsApp sin número de destino (`wa.me/?text=`, WhatsApp ofrece el selector de contacto)
- `src/presentation/orders/CourierMap/CourierMap.tsx` + `CourierMapCanvas.tsx` (nuevos)
- `src/presentation/orders/OrderLists/SellerOrders.tsx` — enseña el enlace justo tras marcar Enviado
- `src/app/[locale]/pedido/[id]/page.tsx` — mapa (comprador) y enlace durable (vendedor)
- `src/app/[locale]/pedido/[id]/repartidor/[token]/` (ruta nueva): `page.tsx`, `actions.ts`,
  `ui/CourierLocationSharer.tsx`, `ui/useShareCourierLocation.ts`
- `src/infra/UI/mappers/absoluteCourierTrackingUrl.ts` (nuevo)
- `src/app/styles/utility-patterns.css` — tono `.map-marker--courier`

**Tests:**
- `src/domain/order/order.test.ts` — `isTrackable`
- `src/use_cases/courierTracking/shareCourierLocation/shareCourierLocationUseCase.test.ts` (nuevo)
- `src/use_cases/advanceOrder/advanceOrderUseCase.test.ts` — genera/no genera token
- `src/presentation/orders/ShareCourierLinkNotice/ShareCourierLinkNotice.test.tsx` (nuevo)
- Dobles de `OrderRepository` actualizados en `handlePaymentWebhookUseCase.test.ts` y
  `placeOrderUseCase.test.ts` (tres métodos nuevos del puerto)
- `src/e2e/orders/orders.feature` — 5 escenarios `@slice-12` + tabla de autorización `@component`
- `src/e2e/orders/courierTracking.spec.ts` (nuevo)
- `src/e2e/testUtils/warmRoutes.ts` — la ruta nueva

### Validación

- `pnpm run typecheck` → limpio.
- `pnpm run lint` (biome) → limpio tras `biome format --write` en los archivos que lo pidieron.
- **Migración aplicada** (`uv run alembic upgrade head` en `bot-whatsapp`). Confirmado con
  `alembic current` → `0058_2026_09_25 (head)`.
- `pnpm exec playwright test src/e2e/orders/courierTracking.spec.ts` → **4/4 en verde**, en tres
  corridas. Dos escenarios cayeron en la primera y se corrigieron:
  1. `useShareCourierLocation` pasaba a `"sharing"` **en cuanto se llamaba a `start()`**, antes de
     que `getCurrentPosition` y el propio `shareCourierLocation` terminaran. El test esperaba ese
     texto y cerraba el contexto del repartidor justo después — exactamente la misma clase de
     carrera que ya apareció en el slice 1 (`orderShipped.spec.ts`), aquí un paso más adelante en
     la cadena. Cerrar el contexto con el envío todavía en vuelo además dejó al servidor de
     desarrollo en mal estado (`ECONNRESET`/`uncaughtException`), lo que arrastró un segundo
     escenario a un fallo que no tenía que ver con él. Se corrigió con `await` real: el estado sólo
     pasa a `"active"` cuando el servidor ya confirmó el guardado (nuevo estado intermedio
     `"sending"`, con el botón en `isLoading`).
  2. El helper `advance()` no tenía el caso especial de `DELIVERED` que sí tiene el de
     `orderHistory.spec.ts`: al entregarse, el pedido sale del filtro "abiertos" de `/pedidos` y la
     lista se vacía, así que esperar la insignia en un renglón que ya no está nunca se cumplía.
     Se copió el mismo criterio (`seller-orders-empty` para ese paso).
- `pnpm run test:run` (Vitest) → **283 archivos, 3008 tests, todos en verde**, tras los cambios de
  arriba.

### Recap

El slice 2 está **completo y cerrado**: el repartidor comparte su ubicación sin cuenta con un
enlace por pedido, el comprador la ve en un mapa mientras el pedido está Enviado, y el enlace deja
de aceptar posiciones solo al entregarse o cancelarse — las cuatro pruebas de Playwright lo
confirman contra la base real, además de los 3008 tests de Vitest y typecheck/lint en verde.

### Próximos pasos (opciones)

1. **Arrancar el slice 3** (distancia y ETA) — el roadmap ya lo deja esbozado en grueso en este
   mismo documento.
2. **Nada pendiente de tu parte** en el slice 2: código, migración y validación end-to-end están
   listos. Falta solo que decidas si quieres commitear/subir estos cambios (no se hizo commit
   todavía, ni en `comida-justa` ni en `bot-whatsapp`).
