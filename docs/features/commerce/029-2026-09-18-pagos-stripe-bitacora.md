# Bitácora — Pagos con Stripe Connect

## Slice 1 — Base de dominio/infra, sin nada visible todavía (2026-09-18)

**Objetivo:** wirear `PAID` en la máquina de estados de pedido y dejar el puerto de pagos
(`IPaymentGateway`) + su adapter de Stripe + el caso de uso del webhook, listos para cuando exista la
cuenta Connect del vendedor. Sin onboarding ni checkout real — eso depende de una migración en
`bot-whatsapp` que todavía no existe.

### Decisiones y por qué

- **`PAID` es opcional, igual que `SHIPPED`.** `CONFIRMED → PREPARING` sigue directo en
  `TRANSITIONS`: no todo vendedor va a tener cobro en línea de entrada. A `PAID` no se entra por el
  mapa de transiciones del vendedor (`OrderAction` sigue excluyéndolo) sino por una puerta propia,
  `canMarkPaid(status)`, que solo el webhook dispara. Una vez dentro, `PAID` sí es un estado normal
  con salidas vendedor-drivables (`PREPARING`, `CANCELLED`), reutilizando `AdvanceOrderUseCase` sin
  tocarlo.
- **Puerto en `src/use_cases/payment/ports/`, no en `src/domain/order/ports.ts`.** Se siguió el
  patrón de "proveedor externo intercambiable" (`ITranslationService`/`IEmbeddingService`), no el de
  "repositorio de datos propios": una pasarela de pago es justo eso, una pieza reemplazable con
  varias operaciones, no un almacén del dominio del pedido.
- **El puerto solo tiene el método que este slice usa.** `constructWebhookEvent` es lo único
  implementado; crear la sesión de checkout y el link de onboarding de vendedor son operaciones del
  mismo puerto pero se añaden con el slice que las llame — no hay superficie sin quien la use.
- **Se prefirió el SDK oficial de `stripe` sobre REST directo**, a diferencia del patrón de
  `GeminiTranslationService` (que evita SDKs). La verificación de firma de webhook (HMAC con
  tolerancia de reloj) es código de seguridad que no vale la pena reimplementar a mano cuando Stripe
  ya lo mantiene probado.
- **`stockEffectOf(current.status, "PAID")` se reutiliza tal cual**, sin rama especial: como `PAID`
  solo se alcanza desde `CONFIRMED` (que ya reservó), la función existente ya devuelve `"none"` sin
  ningún cambio de lógica — solo hubo que sumar `"PAID"` a `STOCK_APPLIED` para que cancelar desde
  ahí sí libere.
- **El webhook responde 200 también en los errores de negocio** (`not-found`/`invalid-transition`),
  y 400 solo si la firma no verifica: un pedido que ya no admite el cobro no lo arregla un reintento
  de Stripe, así que insistir no tiene sentido — 400 sí, porque ahí no hay ningún evento de fiar que
  procesar.
- **`orders.feature` se actualizó de paso**, no por evitarlo: la fila "Pagado" de la tabla de
  `canNotifySeller` (slice 7) decía "no participa todavía", que dejó de ser cierto con este slice —
  y el esqueleto `@slice-13 @future` de pago se reescribió para reflejar la decisión real (Stripe
  Connect, ya no condicionado al volumen) sin dejar de ser un esqueleto.

### Archivos tocados

**Dominio:**
- `src/domain/order/order.ts` — `TRANSITIONS.PAID`, `canMarkPaid`, `OPEN_STATUSES`, comentarios
- `src/domain/order/orderStock.ts` — `STOCK_APPLIED`
- `src/domain/errors/PaymentProviderError.ts` (nuevo)

**Casos de uso:**
- `src/use_cases/payment/ports/IPaymentGateway.ts` (nuevo)
- `src/use_cases/payment/handlePaymentWebhook/handlePaymentWebhookUseCase.ts` (nuevo)

**Infra:**
- `src/infra/payments/StripePaymentGateway.ts` (nuevo)
- `src/infra/payments/factory.ts` (nuevo)
- `src/app/api/payments/stripe/webhook/route.ts` (nuevo)

**Dependencias:**
- `package.json`/`pnpm-lock.yaml` — se agregó `stripe` (`pnpm add stripe -w`)

**Tests:**
- `src/domain/order/order.test.ts`, `orderStock.test.ts`, `scope.test.ts`
- `src/infra/payments/StripePaymentGateway.test.ts` (nuevo) — firma verificada con el propio helper
  de pruebas de Stripe (`Stripe.webhooks.generateTestHeaderString`), no una firma inventada a mano
- `src/use_cases/payment/handlePaymentWebhook/handlePaymentWebhookUseCase.test.ts` (nuevo)

**Specs/docs:**
- `src/e2e/orders/orders.feature` — fila "Pagado" del slice 7 corregida; esqueleto `@slice-13
  @future` reescrito
- `docs/features/commerce/029-2026-09-18-pagos-stripe.md` (roadmap)
- Esta bitácora

### Validación

- `pnpm run typecheck` → limpio.
- `pnpm run lint` (biome) → dos archivos con formato/orden de imports a corregir
  (`handlePaymentWebhookUseCase.ts`/`.test.ts`, `IPaymentGateway.ts`), arreglado con
  `biome check --write`; segunda corrida limpia.
- `pnpm exec vitest run` scoped a `src/domain/order src/domain/errors src/infra/payments
  src/use_cases/payment` → **8 archivos, 133 tests, todos en verde** (incluye los 17 tests nuevos de
  `StripePaymentGateway.test.ts` + `handlePaymentWebhookUseCase.test.ts`).
- `pnpm run test:run` completo → **281 archivos, 2992 tests, todos en verde** (279/2975 antes de
  este slice; suma los dos archivos nuevos y sus 17 tests, sin ninguna regresión en el resto).
- No hay Playwright en este slice — no hay ningún comportamiento observable en pantalla (ver "Por qué
  no hay `.feature`" en el roadmap).

### Desviaciones del roadmap

Ninguna respecto al plan acordado en el gate de alineación — el alcance se cerró explícitamente sin
onboarding de vendedor antes de escribir código, así que no hubo recorte a mitad de camino.

### Recap

El slice 1 deja el dominio de pedido con `PAID` completamente wireado (transiciones, inventario,
puerta de entrada) y la plomería de pagos lista del lado del código: puerto, adapter de Stripe,
factory, caso de uso del webhook y la ruta que lo recibe — todo testeado y sin ninguna pantalla
nueva. No es usable en producción todavía: falta la migración en `bot-whatsapp` que le dé a cada
vendedor una cuenta Connect, y con ella el slice 2 (onboarding + checkout real).

### Próximos pasos (opciones)

1. **Coordinar la migración en `bot-whatsapp`** (columna de cuenta Connect en `sellers` + tabla de
   registro de pago) — es lo único que bloquea el slice 2, y no se puede avanzar en el checkout real
   sin ella.
2. **Configurar las claves de Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) cuando haya una
   cuenta de Stripe (modo test primero) — el código ya las lee vía `createPaymentGateway()`, pero no
   se tocó `.env.development` en este slice.
3. **Nada más pendiente de tu parte** en el slice 1: código y validación de Vitest están listos.
   Falta decidir si quieres commitear estos cambios (no se hizo commit todavía).
