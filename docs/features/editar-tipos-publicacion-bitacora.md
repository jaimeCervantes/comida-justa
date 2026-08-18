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

