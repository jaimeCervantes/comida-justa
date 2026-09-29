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

## Slice 3 — Distancia y ETA aproximado (2026-09-28)

**Objetivo:** con el pedido Enviado y el repartidor compartiendo su posición, decirle al comprador a
qué distancia va y un tiempo aproximado — a partir de un destino guardado en el propio pedido.

### Decisiones y por qué

- **El destino vive en el pedido, no en la cuenta.** El sitio no guarda direcciones de entrega, y
  `users.lastLatitude` es "la última vez que compartiste tu ubicación por cualquier motivo", no a
  dónde va este pedido. Migración `0059_2026-09-26_add_delivery_location_to_customer_orders.py` en
  `bot-whatsapp` (`delivery_lat`, `delivery_lng`, `delivery_location_updated_at`, nulables,
  `double precision` como las del repartidor), **aplicada a la base compartida** el 2026-09-28.
- **Compartir al confirmar sin permiso ni paso nuevo** (`readGrantedPosition`): se consulta
  `navigator.permissions` y solo si ya está `granted` se lee la posición, con un plazo de 3 s. Si el
  permiso está en `prompt`, no se pregunta — preguntar en medio de la compra sería justo el paso
  extra que el roadmap descarta. Así el primer pedido de alguien que nunca compartió sale sin
  destino, y lo comparte desde la ficha.
- **La distancia la calcula PostGIS** en la consulta común (`listWhere`): `ST_Distance` sobre
  `ST_MakePoint(...)::geography` armados al vuelo; con cualquier coordenada nula sale `NULL`, sin
  `CASE`. Verificado contra la base: dos puntos de Mérida → 1 845,87 m, y `NULL` con un nulo.
- **El ETA es una suposición explícita** (`ASSUMED_COURIER_SPEED_KMH = 20`, línea recta), hacia
  arriba y nunca menos de 1 min — "0 min" se leería como "ya llegó". Se rotula "aproximado, en
  línea recta".
- **Se puede compartir mientras el pedido siga abierto, no solo Enviado**
  (`DELIVERY_SHAREABLE_STATUSES = OPEN_STATUSES`), y la condición va en el `WHERE` de la escritura
  junto con el comprador, mismo criterio que `saveCourierLocation`. No se ofrece en citas.
- **Se reutilizó `useShareLocation`** (ahora recibe a dónde mandar la posición, por defecto a la
  cuenta como antes) y `describeDistance` + las cadenas `distance.meters/kilometers`, en vez de un
  segundo trámite con el navegador y un segundo formateador.
- **Los pasos de Playwright que ya repetía `courierTracking.spec.ts`** (hacer el pedido, avanzarlo,
  leer el enlace, compartir como repartidor) se extrajeron a `src/e2e/testUtils/orderFlow.ts`.

### Archivos tocados

**Dominio:** `src/domain/order/delivery.ts` (nuevo: `deliveryProgress`, `etaMinutes`,
`canShareDeliveryLocation`, `DELIVERY_SHAREABLE_STATUSES`), `order.ts` (`DeliveryLocation`,
`Order.deliveryLocation`, `Order.courierDistanceMeters`), `ports.ts` (`NewOrder.deliveryLocation`,
`saveDeliveryLocation`).

**Casos de uso:** `src/use_cases/deliveryLocation/shareDeliveryLocation/` (nuevo),
`placeOrder/placeOrderUseCase.ts` (destino de mejor esfuerzo, validado con `areValidCoordinates`).

**Infra:** `db/schema/orders.ts` (espejo de la 0059), `PostgresOrderRepository.ts` (lectura con
`ST_Distance`, `createAll` con destino, `saveDeliveryLocation`).

**UI:** `presentation/location/readGrantedPosition.ts` (nuevo), `useShareLocation.ts` (destino
parametrizable), `presentation/orders/DeliveryLocationShare/` (nuevo), `CourierMap.tsx` (distancia
y ETA), `orderActions.ts` (`shareDeliveryLocation`, destino en `placeOrder`),
`carrito/ui/ConfirmOrderButton.tsx`, `pedido/[id]/page.tsx`, `i18n/messages/{es,en}.json`.

**Tests:** `delivery.test.ts`, `shareDeliveryLocationUseCase.test.ts`,
`DeliveryLocationShare.test.tsx` (nuevos); `placeOrderUseCase.test.ts` (+4); dobles de
`OrderRepository` con `saveDeliveryLocation`; `src/e2e/orders/deliveryEta.spec.ts` (nuevo),
`courierTracking.spec.ts` (usa `orderFlow.ts`).

### Validación

- `pnpm run typecheck` → limpio. `pnpm run lint` → limpio.
- `pnpm run test:run` → **286 archivos, 3043 tests, todos en verde**.
- `rm -rf .next && pnpm exec playwright test src/e2e/orders/deliveryEta.spec.ts
  src/e2e/orders/courierTracking.spec.ts` → **10/10 en verde** a la primera (6 del slice 3 + los
  4 del slice 2 tras extraer los pasos compartidos).
- Escritura en la base compartida: solo la migración 0059 (reversible con `alembic downgrade
  0058_2026_09_25`); los e2e borran su tienda y pedidos en `afterEach`.

### Desviaciones del roadmap

- El roadmap decía "pide la ubicación al navegador en el mismo clic". Se precisó: **solo si el
  permiso ya está concedido**; con `prompt` no se pregunta, para no convertir el clic de compra en
  un diálogo del navegador.
- El mapa sigue con un solo marcador (el repartidor); el destino no se pinta. No lo pide ningún
  escenario.

### Recap

El slice 3 está completo: el pedido guarda su propio destino (al confirmar si el navegador ya tiene
permiso, o después desde la ficha mientras siga abierto), y con el repartidor en camino la ficha
dice a qué distancia va —calculada por PostGIS— y un tiempo aproximado rotulado como tal. Sin
destino, el mapa queda como en el slice 2 y se invita a compartir la ubicación. Migración 0059
aplicada; Vitest, typecheck, lint y los 10 e2e en verde.

### Próximos pasos (opciones)

1. **Empujar**: `comida-justa` tiene `dev` 2 commits por delante (slice 2) y esta rama
   `feat/pedido-enviado-eta`; `bot-whatsapp` (`hazlo-sano-bot`) tiene `main` 2 por delante (0058 y
   0059). Nada se ha empujado.
2. Pintar también el destino en el mapa y encuadrar los dos puntos.
3. Aviso de "ya casi llega" o ruteo real (Directions/OSRM) — fuera de este roadmap por ahora.

## Slice 3, ajuste — Al confirmar sí se pide la ubicación (2026-09-28)

**Objetivo:** que el primer pedido de alguien que nunca compartió su ubicación también salga con
destino, en vez de depender de que lo comparta después desde la ficha.

### Decisiones y por qué

- **Decisión del usuario:** al confirmar, si el navegador todavía no tiene permiso, se le pide en
  ese mismo clic. Revierte la desviación anotada en la entrada anterior ("solo si ya está
  `granted`"). Sigue sin haber un paso propio del sitio: la única pregunta es el diálogo del
  navegador.
- `readGrantedPosition` pasa a `readDeliveryPosition`: con `denied` no insiste (el navegador
  tampoco preguntaría); con `granted` espera 3 s; con `prompt` (o sin API de permisos) espera como
  mucho 20 s **en total**, porque el `timeout` de `getCurrentPosition` no cuenta el rato que la
  persona tarda en contestar el diálogo, y un diálogo ignorado no puede dejar la compra colgada.
- Escenario y roadmap actualizados: "el único paso extra fue, si hacía falta, el permiso del propio
  navegador".

### Archivos tocados

`src/presentation/location/readDeliveryPosition.ts` (renombrado desde `readGrantedPosition.ts`) +
`readDeliveryPosition.test.ts` (nuevo, 5 casos), `carrito/ui/ConfirmOrderButton.tsx`,
`src/e2e/orders/orders.feature`, `src/e2e/orders/deliveryEta.spec.ts` (textos),
`docs/features/commerce/028-2026-09-18-pedido-enviado.md`.

### Validación

- `pnpm run typecheck` y `pnpm run lint` → limpios.
- `pnpm run test:run` → **287 archivos, 3048 tests, en verde**.
- `rm -rf .next && pnpm exec playwright test src/e2e/orders/deliveryEta.spec.ts` → **6/6**. El
  escenario sin permiso ahora sí pregunta, y Playwright contesta que no: el pedido sale sin destino.

### Recap

El slice 3 queda igual salvo por el clic de confirmar: ahora pide la ubicación si hace falta, con un
tope de 20 s para que un diálogo sin contestar no detenga la compra.

### Próximos pasos (opciones)

1. Revisar y fusionar el PR de `feat/pedido-enviado-eta` hacia `dev`.
2. Pintar también el destino en el mapa y encuadrar los dos puntos.

## Slice 4 — Que la posición no mienta (2026-09-28)

**Objetivo:** una página web no puede leer el GPS con el teléfono bloqueado ni en segundo plano, y
hasta ahora el comprador veía el último punto congelado como si fuera actual. Que se congele menos
(pantalla encendida, reanudar al volver), que nunca se presente algo viejo como actual, y que el
mapa enseñe los dos puntos.

### Decisiones y por qué

- **Textos que explican el para qué**: el aviso del vendedor dice que el cliente verá al repartidor
  en un mapa; el mensaje de WhatsApp y la página del repartidor le piden dejarla abierta y a la
  vista, y qué la pausa.
- **Screen Wake Lock** en `src/infra/UI/hooks/useScreenWakeLock.ts` (genérico, sin saber de
  pedidos): se pide al pasar a "compartiendo", se vuelve a pedir en cada `visibilitychange` a
  visible (el navegador lo suelta solo al ocultarse la página) y se libera al dejar de compartir. Si
  no hay soporte o se niega, el repartidor lee que mantenga la pantalla encendida él mismo.
- **Reanudar al volver**: `useShareCourierLocation` manda la posición en cuanto la página vuelve a
  estar visible, sin esperar al siguiente turno de 15 s. El intervalo y el regreso comparten una ref
  (`repeat`) para usar siempre la versión del render actual.
- **Posición vieja a partir de 2 min** (`COURIER_LOCATION_STALE_AFTER_MS`, ocho envíos perdidos):
  `isCourierLocationStale` / `staleMinutes` en el dominio. `deliveryProgress` recibe ahora `now` y,
  con la posición vieja, da la distancia con `staleMinutes` y `etaMinutes: null`. La hora la pone el
  servidor (`page.tsx`), una sola por render, y se recalcula en cada `refresh` de 15 s.
- **Mapa con los dos puntos**: el destino usa el mismo marcador que "Aquí estás tú"; los une una
  `Polyline` **punteada** (`.courier-straight-line`) para que no se lea como un camino por calles; se
  encuadran con `fitBounds` (tope de zoom 15). Sin destino, como antes.
- **"La ruta"**: el usuario pidió **camino por calles**. Necesita un proveedor externo con clave y
  costo, así que queda como slice 5 con esa decisión pendiente; la recta punteada se queda como
  respaldo para cuando no haya camino.

### Archivos tocados

**Dominio:** `src/domain/order/delivery.ts` (+ test). **Infra UI:**
`src/infra/UI/hooks/useScreenWakeLock.ts` (nuevo). **Repartidor:**
`pedido/[id]/repartidor/[token]/ui/useShareCourierLocation.ts`, `CourierLocationSharer.tsx` (+
`CourierLocationSharer.test.tsx`, nuevo). **Comprador:** `CourierMap.tsx`, `CourierMapCanvas.tsx`,
`pedido/[id]/page.tsx`, `utility-patterns.css`. **Vendedor:** textos de `ShareCourierLinkNotice` (+
2 tests). **i18n:** `es.json`, `en.json`. **E2E:** `orders.feature` (8 escenarios `@slice-15`),
`deliveryEta.spec.ts` (+3), `courierTracking.spec.ts` (texto del repartidor).

### Validación

- `pnpm run typecheck` y `pnpm run lint` → limpios.
- `pnpm run test:run` → **288 archivos, 3064 tests, en verde**.
- `rm -rf .next && pnpm exec playwright test src/e2e/orders/deliveryEta.spec.ts
  src/e2e/orders/courierTracking.spec.ts` → **13/13** a la primera.
- Sin escrituras nuevas en la base compartida fuera de las que los e2e crean y borran.

### Desviaciones

- El escenario de Wake Lock es `@component`: Playwright no tiene pantalla que apagar. **Falta
  probarlo en un teléfono real**, sobre todo abriendo el enlace dentro del navegador de WhatsApp.

### Recap

El seguimiento ya no presenta una posición congelada como actual: a partir de 2 min el comprador ve
cuánto hace, la distancia en pasado y ningún tiempo estimado. El repartidor sabe que la página tiene
que quedarse abierta, la pantalla no se apaga sola donde el navegador lo permite, y al volver a la
página la posición se manda al instante. El mapa enseña repartidor y destino unidos por una recta.

### Próximos pasos (opciones)

1. **Slice 5, camino por calles**: pendiente de elegir proveedor (clave y costo) — decisión del
   usuario.
2. Probar el recorrido en dos teléfonos reales, con HTTPS, incluido el navegador interno de WhatsApp.

## Slice 5 — Camino por calles con Mapbox Directions (2026-09-28)

**Objetivo:** en vez de la recta punteada, trazar el camino por calles que le falta al repartidor, y
sacar distancia y tiempo de ese camino. Decisión del usuario: Mapbox.

### Decisiones y por qué

- **Se leyeron los términos de Mapbox** (Product Terms, 21 de julio de 2026) antes de diseñar:
  - 2.10.1 prohíbe guardar o cachear resultados de las Navigation APIs → **ninguna ruta se guarda**:
    ni en la base, ni en caché del servidor (`fetch` con `cache: "no-store"`), ni en
    `localStorage`. Vive solo en el estado de `CourierMap`.
  - 1.4.1/1.4.2 exigen logo, "© Mapbox", "© OpenStreetMap" e "Improve this map" →
    `MapboxAttribution`, visible **solo mientras se enseña un camino de Mapbox**. El logo sale del
    control oficial de atribución de `mapbox-gl.css` (`public/brand/mapbox-logo.svg`).
  - 2.2 ("uso vehicular") se interpretó como no aplicable: la app no está pensada para usarse dentro
    del vehículo y la página del repartidor no llama a Mapbox. Queda anotado en el roadmap.
- **Puerto genérico** `RouteProvider` en `src/domain/routing/` (sin pedidos ni Mapbox), adaptador
  `MapboxRouteProvider` en `src/infra/routing/` con perfil `driving-traffic`. Sin
  `MAPBOX_ACCESS_TOKEN`, la fábrica devuelve un proveedor que nunca da camino.
- **Cuándo se pide** (`shouldRequestRoute`): Enviado, con destino y posición fresca. Con posición
  vieja no se gasta consulta.
- **Una consulta por minuto como mucho** por ficha abierta (`useDeliveryRoute`), aunque el mapa se
  refresque cada 15 s; un salto fresca→vieja→fresca dentro del mismo minuto no dispara otra.
- **Autorización en el servidor**: la acción `routeToDestination` saca al comprador de la sesión, y
  `findDeliveryTracking` lo lleva en el `WHERE`.
- **Sin camino, todo queda como en el slice 4**: recta punteada, estimación en línea recta, sin
  error visible.
- **E2E contra un Mapbox falso local** (`src/e2e/testUtils/fakeMapbox.ts`, puerto 4010):
  `playwright.config.ts` fija `MAPBOX_ACCESS_TOKEN`/`MAPBOX_DIRECTIONS_BASE_URL` para el servidor
  de pruebas, así que la suite **nunca** gasta cuota aunque `.env.development` tenga la clave real.

### Variables de entorno

- `MAPBOX_ACCESS_TOKEN` — solo servidor (sin `NEXT_PUBLIC_`). Sin ella, no hay camino por calles.
- `MAPBOX_DIRECTIONS_BASE_URL` — solo para e2e; en producción no se define.

### Archivos tocados

**Dominio:** `src/domain/routing/{route,ports}.ts` (+ test), `order/delivery.ts`
(`shouldRequestRoute`, + tests), `order/ports.ts` (`findDeliveryTracking`). **Caso de uso:**
`src/use_cases/deliveryRoute/routeToDestination/` (+ test). **Infra:**
`src/infra/routing/{MapboxRouteProvider,factory}.ts` (+ test), `PostgresOrderRepository.ts`.
**UI:** `presentation/orders/orderActions.ts` (`routeToDestination`),
`CourierMap/{CourierMap,CourierMapCanvas,MapboxAttribution,useDeliveryRoute}.tsx` (+ test del
hook), `pedido/[id]/page.tsx`, `utility-patterns.css` (`.courier-route-line`), i18n,
`public/brand/mapbox-logo.svg`. **E2E:** `playwright.config.ts`, `testUtils/fakeMapbox.ts`,
`deliveryEta.spec.ts` (+2), `orders.feature` (5 escenarios `@slice-16`). Dobles de
`OrderRepository` con `findDeliveryTracking`.

### Validación

- `pnpm run typecheck` y `pnpm run lint` → limpios.
- `pnpm run test:run` → **292 archivos, 3087 tests, en verde**.
- `rm -rf .next && pnpm exec playwright test src/e2e/orders/deliveryEta.spec.ts
  src/e2e/orders/courierTracking.spec.ts` → **15/15**. La primera corrida dio 14/15: el camino
  llegaba pero la línea conservaba la clase de la recta — las dos `Polyline` condicionales
  compartían posición en el árbol y react-leaflet solo aplica `setStyle`, que no cambia
  `className`. Se corrigió con `key` distintas.
- **Sin probar contra Mapbox real**: todavía no hay `MAPBOX_ACCESS_TOKEN` en `.env.development`.

### Recap

Con destino y repartidor en camino, la ficha pide cada minuto el camino por calles a Mapbox, lo
pinta continuo, da distancia y tiempo "por calles y con tráfico" y enseña la atribución que piden
sus términos; nada de eso se guarda. Si no hay camino, todo queda como en el slice 4.

### Próximos pasos (opciones)

1. **Pendiente del usuario:** crear la cuenta de Mapbox y agregar `MAPBOX_ACCESS_TOKEN` a
   `.env.development` (y al entorno de producción). Después, una prueba manual contra Mapbox real.
2. Probar el recorrido en dos teléfonos reales, con HTTPS.

## Arreglo — El mapa ya no quita el zoom de quien mira (2026-09-29)

**Visto en producción por el usuario:** al acercar el mapa, al rato se quitaba el zoom y se volvía a
centrar. Con destino, cada posición nueva llamaba a `fitBounds`, que recalcula el zoom para encuadrar
los dos puntos y pisaba el que había puesto la persona.

### Decisión

- Mientras la persona no toque el zoom, se encuadra como antes. En cuanto lo ajusta (botones, rueda
  o pellizco), una posición nueva **solo recentra en el repartidor y conserva su zoom**
  (`setView(…, map.getZoom())`).
- Para distinguir el zoom de la persona del nuestro, nuestros movimientos van con `animate: false`:
  sus eventos llegan dentro de la llamada, marcada con `movingOnOurOwn`, y todo `zoomend` fuera de
  ella es de la persona.
- El contenedor del mapa publica `data-zoom`, que es lo que lee el e2e.

### Validación

- **Reproducido antes de arreglar:** encuadre inicial zoom 14, acercado a 16, y la posición nueva lo
  regresó a 15 (el `maxZoom` de `fitBounds`).
- Escenario `@slice-16` nuevo en `orders.feature` y su e2e en `deliveryEta.spec.ts`: mueve al
  repartidor en la base y espera el refresco de 15 s.
- `pnpm run lint` limpio; `pnpm run test:run` → **292 archivos, 3087 tests**; Playwright
  `deliveryEta.spec.ts` + `courierTracking.spec.ts` → **16/16**.

### Recap

El mapa sigue al repartidor, pero el zoom ya es de quien mira.

### Próximos pasos (opciones)

1. Mergear `fix/mapa-conserva-zoom` a `dev`, empujar y desplegar.
2. Terminar la prueba en dos teléfonos.
