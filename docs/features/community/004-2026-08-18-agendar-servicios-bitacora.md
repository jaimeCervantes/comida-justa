# Bitacora - Agendar servicios

## 2026-08-18 - Slice 1: confirmacion con salida a pedidos

### Objective

Explicar claramente, justo despues de agendar un servicio, que la cita ya quedo registrada como
pedido y que se puede consultar desde pedidos.

### Decisions + rationale

- La accion `bookSlot` ahora devuelve el `orderId` creado. Este slice no lo usa para navegar al
  detalle, pero deja la accion diciendo la verdad completa: agendar creo un pedido real.
- `SlotPicker` reemplaza el formulario por una confirmacion con dos partes: estado principal
  ("Tu cita quedo agendada") y salida concreta a "Mis pedidos".
- El enlace apunta a `/pedidos?vista=placed`, no al carrito, porque la separacion acordada es que un
  servicio con horario se agenda directamente.
- Se agrego mensaje para `no-session`. Ya existia el estado de error en la accion, pero la UI no lo
  pintaba; dejarlo invisible hacia parecer que el boton no hacia nada.
- El e2e siembra su propia tienda, servicio y disponibilidad. No usa `descanso-reparador` para no
  crear citas sobre datos reales.
- La limpieza e2e ahora borra `provider_availability` y `provider_time_off` de tiendas de prueba
  antes de borrar la tienda. Una agenda sembrada no debe dejar residuos ni bloquear el barrido.

### Files touched

- Specs y documentacion:
  - `docs/features/community/004-2026-08-18-agendar-servicios.md`
  - `docs/features/community/004-2026-08-18-agendar-servicios-bitacora.md`
  - `src/e2e/serviceBooking/serviceBooking.feature`
  - `src/e2e/serviceBooking/serviceBooking.spec.ts`
- Ficha/agendado:
  - `src/app/[locale]/[slug]/bookActions.ts`
  - `src/app/[locale]/[slug]/ui/SlotPicker.tsx`
- Textos:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
- Infra de prueba:
  - `src/e2e/testUtils/deleteTestSeller.ts`
  - `src/e2e/testUtils/testData.ts`

### Key commands

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `pnpm exec playwright test src/e2e/serviceBooking/serviceBooking.spec.ts --reporter=line`

### Validation results

- Typecheck: passed.
- Lint: passed, 904 files checked.
- Vitest completo: 180 files, 1896 tests passed.
- E2E focal de agendar servicios: 1 test passed.

### Deviations from roadmap

- El e2e se escribio primero usando el primer slot visible, pero ese slot puede estar recortado al
  instante de render y volverse invalido segundos despues al enviar. El escenario se ajusto al
  siguiente slot completo para probar la confirmacion sin mezclar un borde de disponibilidad
  inmediata.
- El primer intento de e2e dentro del sandbox hizo timeout por errores de acceso a la base
  (`EACCES`/`ETIMEDOUT`). Se repitio con permisos de DB y la corrida focal final paso.

### Follow-ups

- Slice 2: leer `customer_orders.during` y mostrar horario de cita en `/pedidos?vista=placed`,
  `/pedidos?vista=received` y `/pedido/[id]`.
- Revisar si conviene ocultar `Agregar al carrito` en servicios con agenda para que la separacion
  sea visualmente completa.
- Evaluar una regla de anticipacion minima para no ofrecer como primer slot un hueco que empieza
  "ahora mismo".

### Recap

Agendar un servicio ya comunica el modelo correcto: la cita queda registrada y se consulta en
pedidos, no en carrito. El flujo de persistencia no cambio; la mejora esta en la confirmacion, el
enlace de seguimiento y la limpieza e2e necesaria para probar agendas sin dejar residuos.

### Proximos pasos (opciones)

- Opcion A: probar manualmente un servicio y verificar la confirmacion con enlace a Mis pedidos.
- Opcion B: avanzar al slice 2 para mostrar el horario de la cita en las listas y el detalle de
  pedidos.
- Opcion C: ocultar o condicionar el boton de carrito en servicios con agenda.

## 2026-08-18 - Slice 2: las cards de servicio llevan a agendar

### Objective

Hacer que la separacion producto/carrito y servicio/agenda tambien se vea en los listados: una card
de servicio no debe invitar a agregar al carrito, sino a abrir la ficha para elegir horario.

### Decisions + rationale

- La regla se centralizo en `CardForList`, que es la tarjeta compartida por home, busqueda,
  productos/listados y relacionados. Cambiarla ahi evita repetir la misma decision por cada seccion.
- Los productos conservan `AddToCartButton`; los servicios disponibles muestran un enlace "Agendar"
  al detalle. En la card no se calculan slots porque hacerlo por cada item multiplicaria consultas de
  agenda en cada listado.
- El enlace usa el `slug` local cuando viene disponible. Los listados pueden entregar `to` absoluto,
  pero la accion de la app se lee mejor como ruta interna.
- Un servicio agotado no muestra ni agenda ni carrito. Si no se puede pedir, tampoco debe empujar al
  usuario a reservar.

### Files touched

- Specs y documentacion:
  - `docs/features/community/004-2026-08-18-agendar-servicios.md`
  - `docs/features/community/004-2026-08-18-agendar-servicios-bitacora.md`
  - `src/e2e/serviceBooking/serviceBooking.feature`
  - `src/e2e/serviceBooking/serviceBooking.spec.ts`
- Card/listados:
  - `src/presentation/post/CardForList/CardForList.tsx`
  - `src/presentation/post/CardForList/CardForList.test.tsx`

### Key commands

- `pnpm exec vitest --run src/presentation/post/CardForList/CardForList.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/serviceBooking/serviceBooking.spec.ts --reporter=line`

### Validation results

- Componente focal: 1 file, 27 tests passed.
- Typecheck: passed.
- Lint: passed, 904 files checked.
- E2E focal de agendar servicios: 2 tests passed.

### Deviations from roadmap

- La primera corrida focal encontro que el link salia absoluto porque `to` llega absoluto desde el
  mapper de listados. Se ajusto a `slug` para que la accion use una ruta interna.
- La suite e2e completa queda para el cierre de este bloque de trabajo, como validacion final
  solicitada por el usuario.

### Follow-ups

- Slice 3: leer `customer_orders.during` y mostrar horario de cita en pedidos.
- Revisar si la ficha de detalle tambien debe ocultar el boton de carrito para servicios con agenda,
  no solo las cards.

### Recap

Los listados ya expresan la separacion acordada: productos van al carrito y servicios disponibles
llevan a agendar desde el detalle. La card no decide horarios ni reserva espacios; solo dirige al
lugar donde esa decision se puede hacer con disponibilidad real.

### Proximos pasos (opciones)

- Opcion A: correr la suite e2e completa y corregir cualquier falla.
- Opcion B: despues de e2e verde, commit semantico del slice de cards.
- Opcion C: avanzar al horario visible en pedidos como siguiente slice funcional.

## 2026-08-18 - Cierre e2e por lotes

### Objective

Validar el cambio de cards sin saturar la maquina local y dejar la suite e2e verde por lotes, como
pidio el usuario.

### Decisions + rationale

- La corrida monolitica de Playwright hizo timeout despues de unos 20 minutos y dejo muchos tests
marcados como fallidos por interrupcion. Se descarto ese resultado como diagnostico funcional y se
partio la suite por areas.
- Los fallos reales aparecieron solo en `habits`: los specs seguian buscando el jardin y las
celebraciones en `/`, pero el home ya no renderiza esos bloques. La validacion se movio a
`/pilares`, que es el hub vigente de los cuatro pilares.
- Las acciones de compartir celebraciones ahora esperan a que la Server Action confirme el nuevo
estado antes de navegar. Eso elimina carreras donde la prueba abria el hub antes de que la
celebracion se guardara.

### Files touched

- Specs de habitos:
  - `src/e2e/habits/atomicSleepChallenge.spec.ts`
  - `src/e2e/habits/invitacionAPracticar.spec.ts`
- Bitacora:
  - `docs/features/community/004-2026-08-18-agendar-servicios-bitacora.md`

### Key commands

- `pnpm exec playwright test src/e2e/serviceBooking src/e2e/orders src/e2e/products src/e2e/publishProduct --reporter=dot`
- `pnpm exec playwright test src/e2e/busquedaRelevante src/e2e/busquedaEntreIdiomas src/e2e/publicationPillarFilter src/e2e/loadMorePosts src/e2e/unifiedCatalog src/e2e/pilares --reporter=dot`
- `pnpm exec playwright test src/e2e/createPost src/e2e/editPublicationTypes src/e2e/eventos src/e2e/filtroAlPublicar src/e2e/createComments src/e2e/multimedia src/e2e/adminCatalog src/e2e/dimensionesMedia --reporter=dot`
- `pnpm exec playwright test src/e2e/localProducers src/e2e/sellerStore src/e2e/ubicacionFresca src/e2e/menu --reporter=dot`
- `pnpm exec playwright test src/e2e/habits --reporter=dot`
- `pnpm exec playwright test src/e2e/about src/e2e/compartir src/e2e/design-system src/e2e/seo src/e2e/notFound src/e2e/createSession src/e2e/productsReport src/e2e/i18n src/e2e/habits --reporter=dot`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`

### Validation results

- Comercio/agenda/productos: 39 tests passed.
- Busqueda/filtros/listados/catalogo/pilares: 44 tests passed.
- Creacion/edicion/eventos/comentarios/multimedia/admin: 45 tests passed, 2 skipped.
- Productores/tienda/ubicacion/menu: 96 tests passed.
- Habitos aislado, despues del ajuste: 22 tests passed.
- Transversal final: 99 tests passed, 1 skipped.
- Typecheck: passed.
- Lint: passed, 904 files checked.
- Vitest completo: 180 files, 1899 tests passed.

### Deviations from roadmap

- La validacion completa no se hizo como una sola corrida porque la maquina local no aguanto la
duracion y salida acumuladas. La cobertura se mantuvo ejecutando todos los specs por lotes.
- Se corrigieron specs de `habits` aunque no son parte directa de servicios, porque quedaron
desalineados con el home actual que el usuario habia limpiado.

### Follow-ups

- Reducir el ruido de e2e por imagenes remotas 412/404 y avisos LCP para que los fallos reales se
lean mas rapido.
- Revisar el guardado async de traducciones en pruebas de publicar: no fallo la suite, pero a veces
intenta persistir despues de que la limpieza borro el post de prueba.

### Recap

La suite e2e quedo verde por lotes y el cambio de servicios no rompio carrito, productos, busqueda,
listados ni tienda. El unico ajuste fuera de servicios fue alinear `habits` con la estructura actual:
la comunidad de habitos se valida en `/pilares`, no en el home.

### Proximos pasos (opciones)

- Opcion A: commitear el slice de cards de servicio junto con la validacion e2e.
- Opcion B: crear un follow-up para reducir ruido de Playwright por assets remotos.
- Opcion C: avanzar al horario visible de citas en pedidos.

## 2026-08-18 - Slice 4: carrito solo para productos

### Objective

Corregir que el detalle de publicaciones tipo servicio siguiera mostrando "Añadir al carrito" aunque
el modelo acordado dice que un servicio se agenda con horario y crea pedido directo. Se cubrio
tambien evento porque el detalle no debe sugerir carrito para algo que ocurre en una fecha.

### Decisions + rationale

- Se separo `canBeOrdered` de `canBeAddedToCart`. Un servicio sigue siendo pedible porque tiene
precio y disponibilidad, pero no es agregable al carrito porque necesita horario.
- `AddToCartButton` consume la nueva regla de carrito. Esto arregla el detalle y cualquier otra
superficie futura que use el boton directo.
- Se mantuvo `CardForList` como estaba: servicios disponibles muestran "Agendar"; productos
mantienen carrito.

### Files touched

- Dominio:
  - `src/domain/entities/post/availability.ts`
  - `src/domain/entities/post/availability.test.ts`
- Carrito:
  - `src/presentation/cart/AddToCartButton/AddToCartButton.tsx`
  - `src/presentation/cart/AddToCartButton/AddToCartButton.test.tsx`
- E2E:
  - `src/e2e/serviceBooking/serviceBooking.spec.ts`
  - `src/e2e/eventos/eventos.spec.ts`
- Roadmap:
  - `docs/features/community/004-2026-08-18-agendar-servicios.md`
  - `docs/features/community/004-2026-08-18-agendar-servicios-bitacora.md`

### Key commands

- `pnpm exec vitest --run src/domain/entities/post/availability.test.ts src/presentation/cart/AddToCartButton/AddToCartButton.test.tsx src/presentation/post/CardForList/CardForList.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/serviceBooking src/e2e/eventos --reporter=dot`
- `pnpm run test:run`

### Validation results

- Vitest focal: 3 files, 50 tests passed.
- Typecheck: passed.
- Lint: passed, 904 files checked.
- E2E focal servicio/evento: 7 tests passed.
- Vitest completo: 180 files, 1906 tests passed.

### Deviations from roadmap

- El fix se hizo como slice adicional porque el bug aparecio despues de separar las cards: el detalle
seguia usando la regla vieja de "pedible" para decidir carrito.

### Follow-ups

- Revisar si el boton de WhatsApp en servicios tambien debe cambiar de texto o desaparecer cuando
hay agenda disponible, para que el detalle no mezcle "pedir" con "agendar".
- Slice 3 pendiente: mostrar horario de cita en pedidos.

### Recap

El carrito queda limitado a productos disponibles. Los servicios pueden seguir siendo pedibles por el
flujo de agenda, pero `AddToCartButton` ya no se pinta para ellos; los eventos tampoco muestran
carrito en el detalle.

### Proximos pasos (opciones)

- Opcion A: probar manualmente `/descanso-reparador` y un evento publicado para confirmar que no
  aparece "Añadir al carrito".
- Opcion B: decidir si el CTA de WhatsApp debe ocultarse o renombrarse para servicios con agenda.
- Opcion C: continuar con horario visible en pedidos para comprador y proveedor.
