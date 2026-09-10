# Bitacora - Citas de servicios

## 2026-09-09 - Slice 1: Mis citas aparecen separadas de pedidos genericos

### Objetivo

Hacer que los servicios agendados dejen de perderse dentro de la lista generica de pedidos. La
primera rebanada crea una vista de cliente para sus citas y una vista de proveedor dentro de su
agenda, sin introducir una nueva tabla ni partir el flujo de pedidos existente.

### Decisiones y razonamiento

- Mantener el modelo acordado: una cita es un `customer_order` con `during`. Esto evita duplicar
  estados, acciones y autorizacion mientras el producto todavia esta madurando.
- Leer `lower(o.during)` y `upper(o.during)` en el repositorio de pedidos. La tabla ya contiene el
  rango; la UI solo necesitaba recibirlo como dato de dominio.
- Separar citas proximas de pasadas/cerradas en dominio. La regla se usa igual para cliente y
  proveedor: una cita vencida o un pedido finalizado ya no pide accion inmediata.
- Promover `BuyerOrders` y `SellerOrders` a `src/presentation/orders/OrderLists/`, porque ahora las
  usan tanto `/pedidos` como `/citas` y `/cuenta/agenda`.
- Agregar "Mis citas" a la navegacion de cuenta, menu de usuario y tarjeta movil. La vista no debe
  depender de que la persona recuerde una URL nueva.
- En e2e, sembrar los pedidos directamente con `customer_orders.during`. El selector de horarios ya
  tiene su propia cobertura; aqui la promesa es que una reserva existente se recuerda y se lista
  correctamente.

### Archivos tocados

- Documentacion: `docs/features/commerce/027-2026-09-09-citas-de-servicios.md`,
  `docs/features/commerce/027-2026-09-09-citas-de-servicios-bitacora.md`.
- Dominio y puertos: `src/domain/order/order.ts`, `src/domain/order/ports.ts`,
  `src/domain/order/appointments.ts`, `src/domain/order/appointments.test.ts`.
- Infraestructura: `src/infra/dataAccess/orders/PostgresOrderRepository.ts`.
- Rutas y UI: `src/app/[locale]/citas/page.tsx`,
  `src/app/[locale]/cuenta/agenda/page.tsx`, `src/app/[locale]/pedidos/page.tsx`,
  `src/presentation/orders/OrderCard/OrderCard.tsx`,
  `src/presentation/orders/OrderLists/BuyerOrders.tsx`,
  `src/presentation/orders/OrderLists/SellerOrders.tsx`.
- Navegacion e i18n: `src/i18n/routing.ts`, `src/i18n/messages/es.json`,
  `src/i18n/messages/en.json`, `src/app/[locale]/cuenta/ui/AccountNav.tsx`,
  `src/presentation/chrome/Header/UserMenu.tsx`,
  `src/presentation/chrome/Header/MobileAccountCard.tsx`,
  `src/presentation/chrome/BottomNav/bottomNavTabs.ts`.
- Pruebas: `src/e2e/serviceAppointments/serviceAppointments.feature`,
  `src/e2e/serviceAppointments/serviceAppointments.spec.ts`,
  `src/e2e/testUtils/warmRoutes.ts`,
  `src/app/[locale]/cuenta/ui/AccountNav.test.tsx`,
  `src/presentation/chrome/Header/UserMenu.test.tsx`,
  `src/presentation/chrome/BottomNav/bottomNavTabs.test.ts`,
  `src/use_cases/advanceOrder/advanceOrderUseCase.test.ts`,
  `src/use_cases/placeOrder/placeOrderUseCase.test.ts`.

### Comandos clave

- `pnpm run format`
- `pnpm exec vitest --run src/domain/order/appointments.test.ts src/app/[locale]/cuenta/ui/AccountNav.test.tsx src/presentation/chrome/Header/UserMenu.test.tsx src/presentation/chrome/BottomNav/bottomNavTabs.test.ts`
- `pnpm run typecheck:tests`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- Limpieza verificada de `.next` antes de cada corrida e2e.
- `pnpm exec playwright test src/e2e/serviceAppointments --reporter=line`
- `pnpm exec playwright test src/e2e/accountSchedule --reporter=line`

### Validacion

- Vitest focalizado: 4 archivos, 43 pruebas pasadas.
- `pnpm run typecheck:tests`: pasado.
- `pnpm run test:run`: 277 archivos, 2900 pruebas pasadas.
- `pnpm run typecheck`: pasado.
- `pnpm run lint`: 1204 archivos revisados, sin cambios pendientes.
- Playwright `serviceAppointments`: 24/24 rutas calientes, 3/3 pruebas pasadas.
- Playwright `accountSchedule`: 24/24 rutas calientes, 2/2 pruebas pasadas.

Las pruebas e2e escribieron datos reversibles en la base compartida: usuarios
`pw.service.appointments.provider@example.com` y `pw.service.appointments.buyer@example.com`, tienda
`e2e-agenda-sana`, publicaciones y pedidos de prueba. La propia suite los borra en `afterEach`, y el
`globalTeardown` los vuelve a barrer si una corrida queda a medias.

### Desviaciones del roadmap

No hubo desviacion funcional. La unica decision adicional fue promover las listas de pedidos a
presentacion compartida al reutilizarlas desde una segunda ruta.

### Follow-ups

- Slice 2: mejorar la eleccion de horario en la ficha del servicio con un selector por dias y horas.
- Slice 3: convertir la pestaña de citas del proveedor en una vista semanal cuando haya suficiente
  densidad de citas para justificar calendario.
- Evaluar recordatorios/exportacion despues de observar si la lista resuelve la mayor parte del
  olvido.

### Recap

La plataforma ya distingue operacionalmente una cita de un pedido normal sin cambiar el modelo de
datos: cliente y proveedor ven los pedidos con `during` en una superficie dedicada, con hora,
contraparte, estado y enlace al pedido; los pedidos sin horario siguen viviendo solo en `/pedidos`.

### Proximos pasos (opciones)

- Implementar slice 2: calendario ligero en la ficha del servicio para elegir primero dia y despues
  hora.
- Implementar slice 3: vista semanal del proveedor, mezclando citas reales y ausencias.
- Dejar esta rebanada en revision visual/manual y avanzar a commits semanticos cuando se pida.

## 2026-09-09 - Slice 2: Los pedidos agendados hablan como citas

### Objetivo

Corregir el lenguaje alrededor de un servicio agendado: despues de reservar, en el detalle y en el
mensaje de WhatsApp debe decir cita, no pedido generico. El modelo interno se mantiene como pedido
con `during`, pero la experiencia debe seguir el modelo mental de quien agenda y de quien atiende.

### Decisiones y razonamiento

- La confirmacion de `SlotPicker` ahora lleva a `/citas` y usa "Mis citas". Si ya existe una vista
  dedicada, mandar a `/pedidos` obliga a la persona a traducir el concepto ella sola.
- El detalle `/pedido/[id]` revisa `order.appointment`: con horario titula "Cita agendada", muestra
  la fecha/hora reservada como dato principal y cambia el texto previo al WhatsApp.
- El builder de WhatsApp sigue siendo de dominio y recibe la fecha ya formateada como label
  opcional. Asi no mete i18n ni `Intl` dentro del dominio, pero el mensaje puede decir cita con dia
  y hora.
- Las listas y el bloque de compra heredan el mensaje de cita cuando el pedido trae `appointment`.
  No hay dos builders ni dos caminos de WhatsApp.
- Los pedidos sin horario conservan el texto anterior: pedido registrado, pedido, aviso de pedido.

### Archivos tocados

- Roadmap/spec: `docs/features/commerce/027-2026-09-09-citas-de-servicios.md`,
  `src/e2e/serviceAppointments/serviceAppointments.feature`.
- Confirmacion de agenda: `src/app/[locale]/[slug]/ui/SlotPicker.tsx`,
  `src/app/[locale]/[slug]/bookActions.ts`.
- Detalle y WhatsApp: `src/app/[locale]/pedido/[id]/page.tsx`,
  `src/app/[locale]/pedido/[id]/ui/CheckoutOrders.tsx`,
  `src/domain/order/whatsappOrderNotice.ts`,
  `src/presentation/orders/OrderLists/BuyerOrders.tsx`.
- Textos: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- Pruebas: `src/domain/order/whatsappOrderNotice.test.ts`,
  `src/e2e/serviceAppointments/serviceAppointments.spec.ts`,
  `src/e2e/serviceBooking/serviceBooking.spec.ts`.

### Comandos clave

- `pnpm run format`
- `pnpm run typecheck`
- `pnpm exec vitest --run src/domain/order/whatsappOrderNotice.test.ts src/presentation/orders/NotifySellerButton/NotifySellerButton.test.tsx src/presentation/orders/OrderCard/OrderCard.test.tsx`
- `pnpm run typecheck:tests`
- `pnpm run test:run`
- `pnpm run lint`
- Limpieza verificada de `.next`.
- `pnpm exec playwright test src/e2e/serviceAppointments src/e2e/serviceBooking --reporter=line`

### Validacion

- `pnpm run typecheck`: pasado.
- Vitest focalizado: 3 archivos, 17 pruebas pasadas.
- `pnpm run typecheck:tests`: pasado.
- `pnpm run test:run`: 277 archivos, 2901 pruebas pasadas.
- `pnpm run lint`: 1204 archivos revisados, sin cambios pendientes.
- Playwright scoped: 24/24 rutas calientes, 6/6 pruebas pasadas.

Las pruebas e2e escribieron datos reversibles en la base compartida: tiendas `e2e-agenda-sana`,
usuarios `pw.service.appointments.provider@example.com` y
`pw.service.appointments.buyer@example.com`, publicaciones de prueba y pedidos/citas de prueba. La
suite los borra en `afterEach`; `globalTeardown` vuelve a barrer residuos si una corrida se corta.

### Desviaciones del roadmap

No hubo desviacion funcional. El slice originalmente futuro de calendario ligero se movio a slice 3
para dejar este cambio de lenguaje como una entrega separada y verificable.

### Follow-ups

- Revisar visualmente el detalle de cita en movil con datos reales de una cita reciente.
- Slice 3: reemplazar el selector plano de huecos por dias y horas.
- Slice 4: vista semanal del proveedor cuando ya haya suficiente uso de citas.

### Recap

Los servicios agendados ahora se presentan como citas en los puntos donde mas importaba: la
confirmacion posterior a reservar, el detalle que respalda la cita y el WhatsApp al prestador. Los
pedidos sin horario mantienen el lenguaje de pedido, asi que el cambio no contamina productos ni
pedidos comunes.

### Proximos pasos (opciones)

- Commit semantico y merge/push a `dev` si esta rebanada ya queda aprobada.
- Revisión visual local de `/citas` y de una ficha `/pedido/<id>` con cita.
- Avanzar al selector de horarios por dia como siguiente slice.
