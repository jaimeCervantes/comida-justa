# Bitacora - Asistencia a eventos

## 2026-08-18 - Slice 1: avisar al creador por WhatsApp con sesion

### Objetivo

Convertir la ficha de un evento en una accion concreta: una persona interesada puede avisar por
WhatsApp que quiere asistir, pero primero debe tener sesion para que la intencion no venga de un
visitante anonimo.

### Decisiones y rationale

- El slice 1 no persiste asistencia. Solo abre el canal correcto con un mensaje prellenado; la
  persistencia queda para el slice 2.
- El CTA se muestra para eventos contactables. Si falta telefono util, no se pinta para evitar un
  enlace roto.
- Sin sesion, el CTA sigue visible pero apunta a `/auth/signin` con `callbackUrl` de regreso a la
  ficha. La intencion no se pierde y se mantiene el filtro de interesados reales.
- El mensaje de WhatsApp vive en dominio (`whatsappEventAttendance`) igual que pedidos, para que el
  texto estructural no quede mezclado con React.
- El horario se formatea antes de construir el mensaje, en el idioma de la ruta y la zona
  `America/Mexico_City`, porque el dominio no debe depender de `next-intl`.

### Archivos tocados

- Roadmap/spec:
  - `docs/features/asistencia-eventos.md`
  - `docs/features/asistencia-eventos-bitacora.md`
  - `src/e2e/eventos/asistencia-eventos.feature`
- Dominio:
  - `src/domain/entities/post/whatsappEventAttendance.ts`
  - `src/domain/entities/post/whatsappEventAttendance.test.ts`
- Presentacion:
  - `src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.tsx`
  - `src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.test.tsx`
  - `src/app/[locale]/[slug]/ui/PostDetail.tsx`
- i18n:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
- E2E/test data:
  - `src/e2e/eventos/asistencia-eventos.spec.ts`
  - `src/e2e/testUtils/seedPost.ts`

### Comandos clave

- `pnpm exec vitest --run src/domain/entities/post/whatsappEventAttendance.test.ts src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.test.tsx`
- `pnpm exec playwright test src/e2e/eventos/asistencia-eventos.spec.ts --reporter=dot`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run lint`

### Validacion

- Vitest focal del slice: 7 tests passed.
- Playwright focal del slice: 3 tests passed.
- `pnpm run typecheck`: passed.
- `pnpm run test:run`: 183 files passed, 1919 tests passed.
- `pnpm run lint`: passed.
- Se intento `pnpm run test:e2e:run` completo y se corto por timeout. Queda cancelado por decision
  operativa: la suite e2e completa se corre solo al terminar todos los slices y en shards.

### Escrituras en recursos compartidos

- El e2e focal escribio publicaciones `e2e-*` y una sesion de prueba en la base compartida; su
  `afterEach` las borro.
- El intento de e2e completo pudo haber arrancado escenarios de otros specs antes del timeout. El
  barrido global del proyecto esta preparado para borrar residuos `e2e-*` en la siguiente corrida
  e2e; si hiciera falta revisarlo manualmente, la consulta documentada del repo es
  `SELECT slug FROM post_translations WHERE slug LIKE 'e2e-%';`.

### Desviaciones del roadmap

- Ninguna funcional. El slice mantiene el alcance acordado: CTA visible, login gate y WhatsApp solo
  para usuario con sesion.
- La suite e2e completa no queda como validacion de este slice; se difiere al cierre de todos los
  slices y en shards.

### Follow-ups

- Slice 2: persistir "Voy a asistir" con contador y cancelacion.
- Slice 3: mostrar lista de asistentes al creador.
- Al cierre del bloque completo: correr Playwright en shards, no como `pnpm run test:e2e:run`
  monolitico.

### Recap

El evento ya ofrece una salida clara para quien quiere asistir: la ficha muestra "Avisar que quiero
asistir"; sin sesion lleva a login y con sesion abre WhatsApp al contacto del evento con titulo,
horario y enlace. No se guarda asistencia todavia; eso queda reservado para el siguiente slice.

### Proximos pasos (opciones)

- Opcion A: avanzar al slice 2 para guardar "Voy a asistir" y mostrar contador.
- Opcion B: ajustar antes el copy visual del CTA si quieres otra redaccion.
- Opcion C: revisar manualmente un evento real en navegador antes de empezar persistencia.

Accion pendiente del usuario: elegir si seguimos con el slice 2 o si se ajusta copy/diseño del CTA.

## 2026-08-18 - Ajuste slice 1: el CTA anonimo no depende del telefono

### Objetivo

Corregir el caso detectado en revision manual: el boton del primer slice podia no verse aunque fuera
un evento, porque la misma guarda que protege el enlace de WhatsApp tambien estaba ocultando el
enlace a iniciar sesion.

### Decisiones y rationale

- Separar "se ofrece asistencia" de "ya existe un href de WhatsApp". Un evento con fecha debe
  mostrar el CTA de login a visitantes anonimos; el enlace real de WhatsApp se arma despues, cuando
  ya hay sesion y numero util.
- Mantener `posts.contact_phone` como el telefono correcto. Aunque una publicacion cuelgue de una
  tienda, el telefono capturado al publicar es el numero de quien publica para esa ficha; no se
  reemplaza por `sellers.phone`.
- Mantener oculto el CTA autenticado si no hay ningun numero util. WhatsApp sin destino seria un
  enlace roto.

### Archivos tocados

- Detalle/lectura:
  - `src/app/[locale]/[slug]/ui/PostDetail.tsx`
- Presentacion/test:
  - `src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.tsx`
  - `src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.test.tsx`
- Spec e2e:
  - `src/e2e/eventos/asistencia-eventos.feature`
  - `src/e2e/eventos/asistencia-eventos.spec.ts`

### Comandos clave

- `pnpm exec vitest --run src/domain/entities/post/whatsappEventAttendance.test.ts src/presentation/post/EventAttendanceWhatsapp/EventAttendanceWhatsapp.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/eventos/asistencia-eventos.spec.ts --reporter=dot`
- `$env:E2E_PORT='3100'; pnpm exec playwright test src/e2e/eventos/asistencia-eventos.spec.ts --reporter=dot`

### Validacion

- Vitest focal del slice: 9 tests passed.
- `pnpm run typecheck`: passed.
- `pnpm run lint`: passed.
- Playwright focal no se pudo repetir en esta revision porque ya habia un `next dev` del mismo repo
  corriendo en `localhost:3000`; al intentar puerto 3100, Next bloqueo otro dev server por el lock
  existente (`PID 10652`). No se mato el servidor del usuario.

### Desviaciones del roadmap

- Se amplio la regla de visibilidad anonima: el CTA de login se ve en eventos aunque el telefono se
  resuelva despues o falte en `posts.contact_phone`.
- No se corrio e2e completo por la restriccion acordada: completo solo al final de todos los slices
  y en shards.

### Follow-ups

- Probar manualmente en el dev server abierto, o liberar el puerto y correr el spec focal.
- Slice 2 sigue igual: persistir asistencia y contador.

### Recap

El boton del slice 1 no se veia en eventos sin `contact_phone` porque el componente trataba "no hay
href de WhatsApp" como "no hay CTA". Ahora la oferta de asistencia y el enlace real estan separados:
anonimos ven el CTA de login en eventos con fecha, y usuarios autenticados abren WhatsApp cuando la
publicacion tiene el telefono que se capturo al publicar.

### Proximos pasos (opciones)

- Opcion A: refrescar/reiniciar el dev server y revisar de nuevo el evento real.
- Opcion B: liberar `localhost:3000` y correr el e2e focal de asistencia.
- Opcion C: avanzar al slice 2 una vez confirmado el CTA.

Accion pendiente del usuario: recargar la ficha del evento; si sigue sin aparecer, compartir el slug
exacto para revisar si su `kind` o `starts_at` no corresponden a evento.

## 2026-08-18 - Slice 2: confirmar y cancelar asistencia

### Objetivo

Guardar la intención "Voy a asistir" dentro de la plataforma: una persona con sesión puede confirmar
o cancelar asistencia desde la ficha del evento, y el contador queda persistido al recargar.

### Decisiones y rationale

- La tabla nueva es `event_attendances`, administrada por Alembic en el backend Python porque ese
  repo sigue siendo el dueño del schema compartido. En Next solo se agregó el espejo Drizzle.
- La clave de negocio es `UNIQUE(post_id, user_id)`: el contador solo significa algo si una persona
  no puede aparecer dos veces en el mismo evento.
- La acción lee `auth()` en el servidor. El formulario manda `postId` y `path`, no manda `userId` ni
  el estado actual; así no se puede confirmar a nombre de otra persona ni pisar dos pestañas con
  estados distintos.
- El botón público sigue visible sin sesión, pero lleva a login. El contador también se ve sin
  sesión porque es información pública del evento.
- El caso de uso valida que la publicación exista, sea `evento` y tenga horario usable. La UI ya lo
  filtra, pero la Server Action se puede invocar sin pasar por la pantalla.

### Archivos tocados

- Backend Python:
  - `alembic/versions/0046_2026-08-18_add_event_attendances.py`
- Schema/infra Next:
  - `src/infra/dataAccess/db/schema/posts.ts`
  - `src/infra/dataAccess/eventAttendances/PostgresEventAttendanceRepository.ts`
  - `src/infra/dataAccess/eventAttendances/readEventAttendanceState.ts`
- Dominio/use case:
  - `src/domain/eventAttendance/eventAttendance.ts`
  - `src/domain/eventAttendance/eventAttendance.test.ts`
  - `src/use_cases/eventAttendance/ports/IEventAttendanceRepository.ts`
  - `src/use_cases/eventAttendance/toggleEventAttendanceUseCase.ts`
  - `src/use_cases/eventAttendance/toggleEventAttendanceUseCase.test.ts`
- Presentación/app:
  - `src/presentation/post/EventAttendance/EventAttendanceButton.tsx`
  - `src/presentation/post/EventAttendance/EventAttendanceButton.test.tsx`
  - `src/presentation/post/EventAttendance/eventAttendanceAction.ts`
  - `src/app/[locale]/[slug]/page.tsx`
  - `src/app/[locale]/[slug]/ui/PostDetail.tsx`
- i18n/e2e:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
  - `src/e2e/eventos/asistencia-eventos.feature`
  - `src/e2e/eventos/asistencia-eventos.spec.ts`
  - `src/e2e/testUtils/testData.ts`

### Comandos clave

- Backend:
  - `uv run alembic upgrade head`
  - `uv run alembic current`
  - `uv run ruff check alembic/versions/0046_2026-08-18_add_event_attendances.py`
  - `uv run ruff format --check alembic/versions/0046_2026-08-18_add_event_attendances.py`
- Frontend:
  - `pnpm exec biome check --write ...`
  - `pnpm exec vitest --run src/domain/eventAttendance/eventAttendance.test.ts src/use_cases/eventAttendance/toggleEventAttendanceUseCase.test.ts src/presentation/post/EventAttendance/EventAttendanceButton.test.tsx`
  - `pnpm run typecheck`
  - `pnpm run test:run`
  - `pnpm run lint`
  - `pnpm exec playwright test src/e2e/eventos/asistencia-eventos.spec.ts --reporter=dot`

### Validación

- Alembic: `0046_2026_08_18 (head)`.
- Ruff backend focal: passed; format check: passed.
- Vitest focal del slice: 3 files passed, 16 tests passed.
- `pnpm run typecheck`: passed.
- `pnpm run test:run`: 186 files passed, 1937 tests passed.
- `pnpm run lint`: 926 files checked, passed.
- Playwright focal de eventos: 4 tests passed. La primera corrida dentro del sandbox se cortó por
  `ETIMEDOUT/EACCES` contra la DB; repetida con permisos elevados pasó.

### Escrituras en recursos compartidos

- Se aplicó la migración Alembic `0046_2026_08_18`, creando `event_attendances` con FK a `posts` y
  `users`, `UNIQUE(post_id, user_id)` e índice por `post_id`.
- Deshacerlo, si hiciera falta antes de que alguien use la tabla, es `uv run alembic downgrade -1`
  desde el backend Python; eso elimina la tabla y sus asistencias.
- El e2e focal escribió publicaciones `e2e-*`, una sesión de prueba y filas temporales en
  `event_attendances`; el `afterEach` y el barrido global las limpiaron. Además se actualizó
  `testData.ts` para borrar asistencias de la cuenta suite si una corrida cae a mitad.

### Desviaciones del roadmap

- Ninguna funcional. El slice cubre confirmar, cancelar, contador y persistencia al recargar.
- No se corrió e2e completa por la restricción acordada: se reserva para el final de todos los
  slices y en shards.

### Follow-ups

- Slice 3: mostrar al creador la lista de personas que confirmaron asistencia.
- Al cierre de todos los slices: correr Playwright completo en shards.

### Recap

La ficha de evento ahora tiene dos acciones complementarias: avisar por WhatsApp al creador y
confirmar asistencia dentro de la plataforma. La confirmación requiere sesión, se guarda en
`event_attendances`, no duplica por persona, actualiza el contador y sobrevive a reload; cancelar
borra la fila y baja el contador.

### Próximos pasos (opciones)

- Opción A: avanzar al slice 3 para enseñar la lista de asistentes al creador.
- Opción B: revisar visualmente la convivencia de los dos CTAs ("Avisar por WhatsApp" y "Voy a
  asistir") antes de abrir la lista.
- Opción C: hacer commit del slice 2 ahora y seguir con slice 3 después.

Acción pendiente del usuario: ninguna para este slice; solo decidir si seguimos directo con la lista
de asistentes o si primero revisas el layout en navegador.

## 2026-08-18 - Slice 3: lista de asistentes para el creador

### Objetivo

Mostrar al creador del evento quién confirmó asistencia, sin hacer pública la lista para visitantes
u otros usuarios. El resto del sitio mantiene visible solo el contador.

### Decisiones y rationale

- La autorización vive en dominio (`canViewEventAttendees`): la lista es privada para el autor del
  post. Un admin no recibe acceso especial en este slice porque el roadmap hablaba del creador, no
  de moderación.
- La lectura usa un caso de uso separado (`ListEventAttendeesUseCase`) en vez de meter la lista en
  el toggle. Confirmar asistencia y revisar asistentes son intenciones distintas.
- La página ya tiene `viewerId` y el post cargado; aun así, el use case vuelve a leer el post para
  validar que exista, sea evento y tenga horario. Es el mismo criterio que protege la Server Action.
- La UI muestra nombre y correo cuando existen; si faltan ambos, usa un fallback traducido. El
  contador sigue público y la lista se oculta devolviendo `null`, no una lista vacía falsa.
- Se corrigió una aserción e2e previa en `eventos-publicos.spec.ts`: contaba todos los `event-date`
  del grid y fallaba si la DB compartida tenía otro evento real. Ahora afirma los eventos sembrados,
  la ausencia de producto/servicio y el orden relativo.

### Archivos tocados

- Dominio/use case:
  - `src/domain/eventAttendance/eventAttendance.ts`
  - `src/domain/eventAttendance/eventAttendance.test.ts`
  - `src/use_cases/eventAttendance/ports/IEventAttendanceRepository.ts`
  - `src/use_cases/eventAttendance/listEventAttendeesUseCase.ts`
  - `src/use_cases/eventAttendance/listEventAttendeesUseCase.test.ts`
  - `src/use_cases/eventAttendance/toggleEventAttendanceUseCase.test.ts`
- Infra:
  - `src/infra/dataAccess/eventAttendances/PostgresEventAttendanceRepository.ts`
  - `src/infra/dataAccess/eventAttendances/readEventAttendees.ts`
- Presentación/app:
  - `src/presentation/post/EventAttendance/EventAttendeeList.tsx`
  - `src/presentation/post/EventAttendance/EventAttendeeList.test.tsx`
  - `src/app/[locale]/[slug]/page.tsx`
  - `src/app/[locale]/[slug]/ui/PostDetail.tsx`
- i18n/e2e:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
  - `src/e2e/eventos/asistencia-eventos.feature`
  - `src/e2e/eventos/asistencia-eventos.spec.ts`
  - `src/e2e/eventos/eventos-publicos.spec.ts`

### Comandos clave

- `pnpm exec biome check --write ...`
- `pnpm exec vitest --run src/domain/eventAttendance/eventAttendance.test.ts src/use_cases/eventAttendance/toggleEventAttendanceUseCase.test.ts src/use_cases/eventAttendance/listEventAttendeesUseCase.test.ts src/presentation/post/EventAttendance/EventAttendanceButton.test.tsx src/presentation/post/EventAttendance/EventAttendeeList.test.tsx`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run lint`
- `pnpm exec playwright test --shard=1/4 --reporter=dot`
- `pnpm exec playwright test --shard=2/4 --reporter=dot`
- `pnpm exec playwright test --shard=3/4 --reporter=dot`
- `pnpm exec playwright test --shard=4/4 --reporter=dot`

### Validación

- Vitest focal del módulo: 5 files passed, 24 tests passed.
- `pnpm run typecheck`: passed.
- `pnpm run test:run`: 188 files passed, 1945 tests passed.
- `pnpm run lint`: 931 files checked, passed.
- Playwright completo en shards:
  - Shard 1/4: primera corrida detectó la aserción frágil de eventos públicos; después del ajuste,
    80 passed, 3 skipped.
  - Shard 2/4: 83 passed.
  - Shard 3/4: 83 passed.
  - Shard 4/4: 82 passed.

### Escrituras en recursos compartidos

- Los e2e escribieron publicaciones `e2e-*`, sesiones, cuentas `pw.*@example.com` y asistencias
  temporales en `event_attendances`. Los `afterEach` y el `globalTeardown` limpiaron esos datos.
- No hubo migraciones nuevas en este slice; usa la tabla aplicada en slice 2.

### Desviaciones del roadmap

- Se mantiene la lista privada para el creador. No se abrió a visitantes ni a otros usuarios.
- Se corrigió un test e2e existente que asumía que la DB compartida no tenía más eventos.

### Follow-ups

- Revisar visualmente si conviene reagrupar los dos CTAs del evento en una banda propia cuando haya
  más acciones.
- Si más adelante moderación necesita ver asistentes, debe ser otro criterio explícito, no herencia
  accidental del permiso de creador.

### Recap

El flujo de eventos queda completo según el roadmap: la ficha muestra horario, permite avisar por
WhatsApp, permite confirmar/cancelar asistencia con sesión, muestra contador persistente y enseña
al creador la lista de asistentes identificados por nombre o correo. La lista no aparece a usuarios
no autorizados.

### Próximos pasos (opciones)

- Opción A: revisar en navegador un evento real con una cuenta de creador.
- Opción B: hacer PR/revisión de la rama completa.
- Opción C: decidir si el siguiente bloque de producto será notificaciones automáticas al creador o
  mejoras visuales del módulo de eventos.

Acción pendiente del usuario: ninguna técnica; el bloque de los tres slices ya quedó validado.
