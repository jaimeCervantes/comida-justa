# Bitacora - Editar cualquier tipo de publicacion

## 2026-08-18 - Slice 1: eventos y servicios editables

### Objective

Hacer que `/editar/[slug]` cargue y guarde los campos propios de `evento` y `servicio`, sin permitir cambiar el tipo de publicacion y sin perder los campos compartidos que ya funcionaban.

### Decisions + rationale

- El `kind` se muestra como selector deshabilitado. La persona ve claramente que esta editando un evento o servicio, pero se conserva la regla existente: editar no cambia lo que la publicacion es.
- El use case normaliza los campos por tipo antes de validar y guardar. Eventos reciben `startsAt`/`endsAt` y limpian `durationMinutes`; servicios reciben `durationMinutes` y limpian fechas; productos siguen siendo los unicos con `origin`.
- La lectura de administracion ahora trae `starts_at`, `ends_at` y `duration_minutes` desde `posts`; antes la pantalla no podia hidratar esos datos aunque existieran.
- La escritura de administracion actualiza esos campos en la misma transaccion que texto, precio, categoria y media, para que una edicion no deje la publicacion en un estado intermedio.
- Se corrigio `min="1"` + `step="5"` a `min="5"` en duracion. Con el minimo anterior, duraciones normales como 45 o 60 eran invalidas para la validacion nativa del navegador.

### Files touched

- Specs y documentacion:
  - `docs/features/editar-tipos-publicacion.md`
  - `src/e2e/editPublicationTypes/editPublicationTypes.feature`
  - `src/e2e/editPublicationTypes/editPublicationTypes.spec.ts`
- Edicion de publicaciones:
  - `src/app/[locale]/editar/[slug]/page.tsx`
  - `src/app/[locale]/editar/[slug]/actions.ts`
  - `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
- Caso de uso y persistencia:
  - `src/use_cases/managePost/updateOnePostUseCase.ts`
  - `src/use_cases/managePost/ports/IPostAdminRepository.ts`
  - `src/infra/dataAccess/managePost/PostgresPostAdminRepository.ts`
- Tests/helpers:
  - `src/use_cases/managePost/managePost.test.ts`
  - `src/e2e/testUtils/seedPost.ts`
  - `src/e2e/testUtils/readPostRow.ts`
  - `src/app/[locale]/publicar/PublishForm.tsx`

### Key commands

- `pnpm exec vitest --run src/use_cases/managePost/managePost.test.ts`
- `pnpm run typecheck`
- `pnpm exec playwright test src/e2e/editPublicationTypes/editPublicationTypes.spec.ts --reporter=line`
- `pnpm exec biome check --write "src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx" src/e2e/editPublicationTypes/editPublicationTypes.spec.ts src/use_cases/managePost/updateOnePostUseCase.ts`
- `pnpm run test:run`
- `pnpm run lint`
- `$env:E2E_PORT='3101'; pnpm exec playwright test src/e2e/editPublicationTypes/editPublicationTypes.spec.ts --reporter=line`
- `$env:E2E_PORT='3102'; pnpm exec playwright test src/e2e/eventos src/e2e/editPublicationTypes/editPublicationTypes.spec.ts src/e2e/multimedia/editarMedia.spec.ts src/e2e/sellerStore/managePost.spec.ts src/e2e/localProducers/fixProvenance.spec.ts --reporter=line`

### Validation results

- Use case focal: 1 file, 19 tests passed.
- Typecheck: passed.
- Lint: passed after Biome formatting.
- Vitest completo: 180 files, 1896 tests passed.
- E2E focal de editar tipos: 2 tests passed.
- E2E relacionado en puerto limpio: 16 tests passed.
- E2E completo: `pnpm run test:e2e:run` fue intentado, pero hizo timeout tras 904 segundos sin resultados finales. Despues de ese timeout, el puerto 3000 quedo dando senales de estado stale; por eso las verificaciones concluyentes se repitieron en `E2E_PORT=3101` y `E2E_PORT=3102`.

### Deviations from roadmap

- El slice 1 tambien toca `PublishForm.tsx` para corregir la validacion nativa de duracion. No cambia el modelo ni agrega alcance funcional nuevo: evita que el mismo bug de `min`/`step` bloquee duraciones normales.
- El slice 2 de ruta GPX queda pendiente. Este slice conserva la ruta existente cuando no se toca por no modificar `post_routes`, pero no agrega UI para quitar o reemplazar recorridos desde editar.

### Follow-ups

- Implementar slice 2: conservar, reemplazar o quitar explicitamente el recorrido GPX desde la edicion de eventos.
- Considerar una corrida e2e completa en puerto alterno o limpiar manualmente el proceso Node viejo antes de correr todo en 3000.

### Recap

La edicion ya hidrata y persiste los campos propios de eventos y servicios: fechas para eventos, precio y duracion para servicios, y validacion de dominio coherente con publicar. El tipo queda visible pero bloqueado, y los campos que no aplican se limpian antes de guardar.

### Proximos pasos (opciones)

- Opcion A: cerrar este slice y probar manualmente editar un evento y un servicio.
- Opcion B: avanzar al slice 2 para editar recorridos GPX de eventos.
- Opcion C: limpiar el proceso Node viejo y correr la suite e2e completa en 3000.

## 2026-08-18 - Slice 4: agenda junto a las acciones del servicio

### Objective

Hacer que los espacios disponibles de un servicio se vean como parte de la decision principal de compra/contacto en el detalle de la publicacion, no enterrados despues de comentarios.

### Decisions + rationale

- `PostDetail` recibe un `bookingSlot` como contenido opcional. La pagina sigue calculando disponibilidad porque ahi ya vive la carga de datos del post y del vendedor; el componente de detalle solo decide la posicion visual.
- La agenda se renderiza despues del bloque de acciones (`agregar al carrito`, WhatsApp y compartir) y antes de controles del dueno, descripcion extendida, reportes, comentarios y relacionados. Asi el usuario primero entiende el servicio, luego ve como actuar, y justo despues elige horario.
- No se cambio el modelo de carrito ni el calculo de espacios. El boton de carrito sigue sin pedir horario; la seleccion de espacios queda visible en el detalle como flujo independiente.
- El e2e valida orden real en el DOM con `data-testid` para evitar depender de posiciones visuales fragiles o texto duplicado.

### Files touched

- Specs y documentacion:
  - `docs/features/editar-tipos-publicacion.md`
  - `docs/features/editar-tipos-publicacion-bitacora.md`
  - `src/e2e/editPublicationTypes/editPublicationTypes.feature`
  - `src/e2e/editPublicationTypes/editPublicationTypes.spec.ts`
- Detalle de publicacion:
  - `src/app/[locale]/[slug]/page.tsx`
  - `src/app/[locale]/[slug]/ui/PostDetail.tsx`

### Key commands

- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `pnpm exec playwright test src/e2e/editPublicationTypes/editPublicationTypes.spec.ts --reporter=line`

### Validation results

- Typecheck: passed.
- Lint: passed.
- Vitest completo: 180 files, 1896 tests passed.
- E2E focal de editar tipos/publicacion: 3 tests passed.

### Deviations from roadmap

- No hubo cambios de alcance. El primer intento del e2e fallo porque el `data-testid` real del trigger de compartir es `share-post-trigger`, no `share-post`; se corrigio el test y la corrida final paso.
- Antes de la corrida final habia un proceso ocupando el puerto 3000. Se uso la limpieza manual que hizo el usuario y despues se valido en el puerto esperado.

### Follow-ups

- Probar manualmente `/descanso-reparador` con datos locales para confirmar que la agenda se percibe en el lugar correcto dentro del flujo visual.
- Decidir si el siguiente slice debe conectar la seleccion de horario con carrito/checkout, porque hoy el carrito no requiere espacio y esa regla se mantuvo.

### Recap

La agenda de servicios ya queda integrada al detalle de la publicacion: aparece despues de los botones de accion y antes de comentarios, reportes y relacionados. El calculo de espacios se conserva donde estaba, pero la posicion deja de hacer que el usuario tenga que bajar hasta despues de comentarios para encontrar disponibilidad.

### Proximos pasos (opciones)

- Opcion A: revisar manualmente `/descanso-reparador` y cerrar el ajuste de posicion.
- Opcion B: avanzar a conectar horario seleccionado con carrito/checkout si la compra de servicios debe reservar un espacio.
- Opcion C: continuar con otro slice pendiente del roadmap de edicion de publicaciones.

## 2026-08-18 - Slice 5: validaciones coherentes por tipo en publicar y editar

### Objective

Corregir la friccion donde un servicio con campos incompletos podia terminar señalando el precio
cuando lo que faltaba era la duracion, y revisar la matriz completa de campos propios por tipo en
publicar y editar.

### Decisions + rationale

- `PublishForm` ahora usa la misma matriz que `EditPostForm`: anuncio sin precio, producto con
  precio/procedencia, evento con inicio obligatorio y precio opcional, servicio con precio/duracion.
- Se oculto precio en `anuncio`. El dominio ya dice que un anuncio no se vende; mostrar precio hacia
  que el formulario prometiera un dato que la edicion no ofrece y que no tiene regla de negocio.
- La Server Action de publicar pre-valida `price` y `origin` igual que ya hacia con `startsAt` y
  `durationMinutes`, para que el error caiga en el campo correcto y no como mensaje generico del
  validador.
- La Server Action de edicion recibe `kind` como hidden solo para UX de validacion. El caso de uso
  sigue usando el tipo guardado en base, asi que manipular ese hidden no cambia el modelo ni autoriza
  cambiar tipo.
- Edicion conserva `errorMessage` por compatibilidad, pero ahora tambien puede pintar errores de
  campo (`price`, `origin`, `startsAt`, `endsAt`, `durationMinutes`).

### Files touched

- Publicar:
  - `src/app/[locale]/publicar/PublishForm.tsx`
  - `src/app/[locale]/publicar/PublishForm.test.tsx`
  - `src/app/[locale]/publicar/actions.ts`
- Editar:
  - `src/app/[locale]/editar/[slug]/actions.ts`
  - `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
  - `src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- Textos y tipos:
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
  - `src/infra/types/Actions.d.ts`
- Docs:
  - `docs/features/editar-tipos-publicacion.md`
  - `docs/features/editar-tipos-publicacion-bitacora.md`

### Key commands

- `pnpm exec vitest --run src/app/[locale]/publicar/PublishForm.test.tsx src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- `pnpm exec biome check src/app/[locale]/publicar/PublishForm.tsx src/app/[locale]/publicar/PublishForm.test.tsx src/app/[locale]/publicar/actions.ts src/app/[locale]/editar/[slug]/actions.ts src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx src/infra/types/Actions.d.ts src/i18n/messages/es.json src/i18n/messages/en.json`
- `pnpm run typecheck`
- `pnpm run test:run`

### Validation results

- Vitest focal: 2 files, 18 tests passed.
- Typecheck: passed.
- Vitest completo: 190 files, 1969 tests passed.
- Lint: 935 files checked.
- E2E completo: no corrido por instruccion del usuario; queda para el cierre por shards.

### Deviations from roadmap

- Este slice correctivo no estaba en el roadmap original. Se agrego porque al revisar servicios se
  encontro una divergencia real entre publicar y editar: publicar mostraba precio para anuncios y no
  lo marcaba requerido para servicios.

### Follow-ups

- Validar en navegador el flujo exacto de publicar servicio sin duracion/precio cuando toque correr
  el shard e2e.
- Decidir si el telefono debe tener tambien validacion server-side de formato; hoy el navegador lo
  valida con `pattern`, y la Server Action solo exige presencia.

### Recap

Publicar y editar ya presentan la misma matriz por tipo: anuncio no vende, producto pide precio y
procedencia, evento pide fecha y servicio pide precio y duracion. Las acciones devuelven errores de
campo antes de caer a mensajes genericos, por lo que faltar duracion en un servicio ya no se mezcla
con el error de precio.

### Proximos pasos (opciones)

- Opcion A: probar manualmente publicar un servicio dejando vacia la duracion.
- Opcion B: correr el shard e2e de publicar/editar cuando cierres los slices.
- Opcion C: revisar validacion server-side del telefono.
