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
