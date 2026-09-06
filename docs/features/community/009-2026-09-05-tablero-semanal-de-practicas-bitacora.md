# Bitacora - Tablero semanal de practicas

## 2026-09-05 - Slice 1: avance semanal visible en Habitos

### Objetivo

Hacer que `/habitos` funcione como la pantalla diaria de regreso: la persona ve arriba su avance de
la semana, entiende cuantos pilares ya cuido hoy y puede marcar una practica activa sin ir al
catalogo. La gamificacion se mantiene cooperativa: avance personal + jardin colectivo, sin campeones
semanales ni podios.

### Decisiones y rationale

- El tablero cuenta pilares, no practicas individuales. Esto evita que dos practicas del mismo pilar
  parezcan dos aportes y mantiene el mensaje de salud sostenible.
- El calculo semanal vive en el caso de uso de adopciones, usando la semana comunitaria existente.
  Asi la UI no conoce SQL ni reglas de calendario.
- La accion de marcar practica se movio a un modulo compartido bajo `[locale]` para que `/practicas`
  y `/habitos` usen exactamente la misma mutacion.
- La vista de `Mis practicas` muestra ancla, minimo y estado de hoy porque esos datos convierten una
  practica elegida en una accion concreta.
- No se agrego migracion: se reutilizaron `user_practices`, `habit_challenge_progress` y
  `habit_repetitions`.

### Archivos tocados

- Dominio y casos de uso: `src/domain/pillars/pillarKey.ts`,
  `src/use_cases/practices/ports/PracticeAdoptionRepository.ts`,
  `src/use_cases/practices/practiceAdoptionUseCase.ts`.
- Infraestructura: `src/infra/dataAccess/practices/PostgresPracticeAdoption.ts`.
- App y presentacion: `src/app/[locale]/habitos/page.tsx`,
  `src/app/[locale]/habitos/ui/MyPractices.tsx`,
  `src/app/[locale]/habitos/ui/WeeklyPracticeProgress.tsx`,
  `src/app/[locale]/practiceActions.ts`, `src/app/[locale]/practicas/page.tsx`,
  `src/app/[locale]/practicas/practiceActions.ts`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- Tests y specs: `src/use_cases/practices/practiceAdoptionUseCase.test.ts`,
  `src/app/[locale]/habitos/ui/MyPractices.test.tsx`,
  `src/app/[locale]/habitos/ui/WeeklyPracticeProgress.test.tsx`,
  `src/e2e/habits/tableroSemanalDePracticas.feature`,
  `src/e2e/habits/tableroSemanalDePracticas.spec.ts`,
  `src/e2e/habits/testData.ts`.
- Roadmap: `docs/features/community/009-2026-09-05-tablero-semanal-de-practicas.md`.

### Comandos clave

- `pnpm exec vitest --run src/use_cases/practices/practiceAdoptionUseCase.test.ts src/app/[locale]/habitos/ui/MyPractices.test.tsx src/app/[locale]/habitos/ui/WeeklyPracticeProgress.test.tsx src/domain/habits/gardenTableCopy.test.ts`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/habits/tableroSemanalDePracticas.spec.ts --reporter=line`

### Validacion

- Vitest focal: 4 archivos, 22 tests pasaron.
- Typecheck: paso.
- Suite Vitest completa: 263 archivos, 2800 tests pasaron.
- Lint: paso en 1164 archivos.
- Playwright focal: 3 escenarios pasaron en Chromium. La primera corrida dentro del sandbox fue
  detenida por `EACCES` al intentar consultar la base; se limpio `.next` y se repitio fuera del
  sandbox como e2e focalizado.

### Datos compartidos tocados por e2e

La corrida Playwright creo datos reversibles para el usuario de suite: practicas adoptadas,
progreso de reto y repeticiones del dia en las tablas de habitos. El helper de e2e limpia esos datos
en `afterEach` mediante `deleteHabitChallengeTestData`.

### Desviaciones del roadmap

- Ninguna desviacion de producto. El unico ajuste fue corregir una expectativa e2e sensible a
  mayuscula/minuscula despues de comprobar que la UI mostraba el texto correcto.

### Follow-ups

- La slice 2 puede abrir `sharing_enabled` para decidir que practicas aparecen en el perfil publico.
- El perfil publico y los enlaces desde nombres deben esperar a que esa decision de privacidad este
  visible para la persona.

### Recap

La slice 1 queda implementada: `/habitos` ahora abre con avance semanal por pilar, permite marcar
practicas activas desde la misma pantalla y evita prometer doble aporte cuando varias practicas
pertenecen al mismo pilar. El jardin sigue siendo colectivo y no se introdujeron campeones
semanales.

### Próximos pasos (opciones)

- Implementar la slice 2: control explicito para compartir o retirar practicas del futuro perfil
  publico.
- Afinar copy/visual del tablero despues de verlo con datos reales de usuarios.
- Dejar esta slice como cierre actual y medir si aumenta el regreso semanal antes de abrir perfiles.

## 2026-09-05 - Slice 2: control de compartir practicas

### Objetivo

Dar a cada persona control explicito sobre que practicas activas quedaran disponibles para su futuro
perfil publico, sin mezclar esa decision con empezar, dejar o marcar una practica como hecha.

### Decisiones y rationale

- El control vive en `/habitos`, dentro de `Mis practicas`, porque esa pantalla es privada y ya
  representa "lo mio". El catalogo `/practicas` sigue dedicado a descubrir y adoptar.
- La practica nace privada y el usuario la cambia con un switch. Esta forma hace visible que es una
  preferencia binaria, no un logro ni una publicacion.
- La mutacion usa la sesion del servidor y no acepta identidad desde el formulario. El formulario
  solo manda `practiceKey` e `intent`.
- El repositorio actualiza `sharing_enabled` solo si la adopcion sigue activa (`stopped_at IS NULL`).
  Una fila historica no debe filtrarse al perfil publico por accidente.
- No se agrego migracion: la columna ya existia y estaba preparada para este paso.

### Archivos tocados

- Dominio y casos de uso: `src/domain/practices/adoption.ts`,
  `src/domain/practices/adoption.test.ts`,
  `src/use_cases/practices/ports/PracticeAdoptionRepository.ts`,
  `src/use_cases/practices/practiceAdoptionUseCase.ts`,
  `src/use_cases/practices/practiceAdoptionUseCase.test.ts`.
- Infraestructura: `src/infra/dataAccess/practices/PostgresPracticeAdoption.ts`.
- App y presentacion: `src/app/[locale]/habitos/page.tsx`,
  `src/app/[locale]/habitos/ui/MyPractices.tsx`,
  `src/app/[locale]/habitos/ui/MyPractices.test.tsx`,
  `src/app/[locale]/practiceActions.ts`, `src/app/[locale]/practicas/practiceActions.ts`.
- Estabilizacion de test ajeno: `src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- E2E y documentacion: `src/e2e/habits/tableroSemanalDePracticas.feature`,
  `src/e2e/habits/tableroSemanalDePracticas.spec.ts`, `src/e2e/habits/testData.ts`,
  `docs/features/community/009-2026-09-05-tablero-semanal-de-practicas.md`.

### Comandos clave

- `pnpm exec vitest --run src/domain/practices/adoption.test.ts src/use_cases/practices/practiceAdoptionUseCase.test.ts src/app/[locale]/habitos/ui/MyPractices.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `pnpm exec vitest --run src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`
- `pnpm exec playwright test src/e2e/habits/tableroSemanalDePracticas.spec.ts --reporter=line`

### Validacion

- Vitest focal: 3 archivos, 24 tests pasaron.
- Typecheck: paso.
- Lint: paso en 1164 archivos.
- Playwright focal: 4 escenarios pasaron en Chromium.
- La primera corrida completa de `pnpm run test:run` expuso una espera fragil en
  `EditPostForm.test.tsx`, fuera del area de producto tocada. Ese archivo paso aislado con 8 de 8;
  se estabilizo esperando explicitamente la llamada a la action antes de buscar el estado renderizado.
- Suite Vitest completa final: 263 archivos, 2804 tests pasaron.

### Datos compartidos tocados por e2e

La corrida Playwright creo y limpio datos reversibles para el usuario de suite: adopciones en
`user_practices`, cambios de `sharing_enabled`, progreso de reto y repeticiones del dia. El helper
`deleteHabitChallengeTestData` borra esas filas al terminar cada escenario.

### Desviaciones del roadmap

- No hubo cambio de alcance. La slice se quedo en control de visibilidad; no se implemento todavia
  el perfil publico ni enlaces desde alias.

### Follow-ups

- La slice 3 ya puede leer solo `sharing_enabled = true` para mostrar practicas compartidas en
  `/u/[username]`.
- Conviene revisar visualmente el switch con varias practicas activas para confirmar densidad y
  escaneo en movil.

### Recap

La slice 2 deja lista la decision de privacidad por practica: cada practica activa en `/habitos`
puede pasar de privada a compartida y volver, sin dejar de practicarse ni alterar el conteo semanal.
El backend persiste esa decision en la fila existente de `user_practices` y evita exponer practicas
detenidas.

### Próximos pasos (opciones)

- Implementar la slice 3: perfil publico con practicas compartidas agrupadas por pilar.
- Revisar el switch en navegador con datos reales antes de construir el perfil publico.
- Mantener la red social sin directorio todavia y esperar a que los perfiles compartidos tengan
  contenido suficiente.

## 2026-09-06 - Slice 3: practicas compartidas en el perfil publico

### Objetivo

Hacer que `/u/[username]` muestre una parte social concreta sin convertir salud en competencia:
las practicas activas que la persona eligio compartir desde `/habitos`, agrupadas por pilar y con
datos accionables para que otra persona pueda imitarlas.

### Decisiones y rationale

- La lectura publica vive en el caso de uso de adopciones como `sharedActiveFor`. El perfil ya
  resuelve `profile.id`, asi que no hizo falta crear una busqueda nueva por username dentro del
  repositorio de practicas.
- El repositorio filtra `sharing_enabled`, `stopped_at IS NULL` y practicas publicadas. Asi una fila
  historica o una practica retirada no aparece por accidente.
- El perfil cruza las adopciones compartidas con el catalogo localizado existente. Esto conserva el
  orden, los textos y el fallback de idioma del catalogo, en vez de duplicar otra consulta de
  traducciones.
- La tarjeta publica muestra titulo, resumen, ancla, minimo y fecha de inicio. Cuando `minimum` es
  nulo, la UI lo explica como "la practica completa ya es el minimo"; esconder la fila hacia que el
  perfil pareciera incompleto.
- La seccion se renderiza tambien en la pagina paginada del perfil para que no desaparezca al pasar
  a `/u/[username]/page/[page]`.
- No se agregaron puntos, ranking, campeones ni comparaciones personales.

### Archivos tocados

- Dominio y casos de uso: `src/use_cases/practices/ports/PracticeAdoptionRepository.ts`,
  `src/use_cases/practices/practiceAdoptionUseCase.ts`,
  `src/use_cases/practices/practiceAdoptionUseCase.test.ts`.
- Infraestructura: `src/infra/dataAccess/practices/PostgresPracticeAdoption.ts`.
- Perfil publico: `src/app/[locale]/u/[username]/data.ts`,
  `src/app/[locale]/u/[username]/types.ts`, `src/app/[locale]/u/[username]/page.tsx`,
  `src/app/[locale]/u/[username]/page/[page]/page.tsx`,
  `src/app/[locale]/u/[username]/ui/ProfileSharedPractices.tsx`,
  `src/app/[locale]/u/[username]/ui/ProfileSharedPractices.test.tsx`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- E2E y documentacion: `src/e2e/habits/tableroSemanalDePracticas.feature`,
  `src/e2e/habits/tableroSemanalDePracticas.spec.ts`, `src/e2e/habits/testData.ts`,
  `docs/features/community/009-2026-09-05-tablero-semanal-de-practicas.md`.

### Comandos clave

- `pnpm exec vitest --run src/use_cases/practices/practiceAdoptionUseCase.test.ts src/app/[locale]/u/[username]/ui/ProfileSharedPractices.test.tsx src/app/[locale]/habitos/ui/MyPractices.test.tsx`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run test:run`
- `pnpm exec playwright test src/e2e/habits/tableroSemanalDePracticas.spec.ts --reporter=line`

### Validacion

- Vitest focal final: 3 archivos, 23 tests pasaron.
- Lint final: paso en 1167 archivos.
- Typecheck final: paso.
- Typecheck de tests final: paso.
- Suite Vitest completa final: 264 archivos, 2809 tests pasaron.
- Playwright focal final: 5 escenarios pasaron en Chromium.
- La primera corrida Playwright dentro del sandbox no fue valida: el servidor no pudo consultar la
  base por `EACCES`/`ETIMEDOUT` y se detuvo manualmente tras quedar sin salida. Se limpio `.next` y
  se repitio fuera del sandbox.
- Una corrida Playwright posterior encontro un defecto real: "Penumbra total" no tenia minimo
  propio y la UI escondia la etiqueta "Lo que basta". Se corrigio con el fallback explicito y la
  corrida final paso.

### Datos compartidos tocados por e2e

La corrida Playwright escribio datos reversibles para el usuario de suite: adopto dos practicas,
activo `sharing_enabled` en una, mantuvo otra privada y asigno temporalmente el username
`e2e-practicas-ana`. El `afterEach` borra las adopciones/progreso de habitos y restaura el username
previo de la cuenta.

### Desviaciones del roadmap

- No se implementaron "semanas sostenidas" por practica. La fuente actual cuenta repeticiones por
  pilar y dia, no por practica concreta; mostrar semanas por practica habria inventado precision que
  el modelo no guarda todavia.

### Follow-ups

- La slice 4 puede enlazar alias de celebraciones/aportes hacia `/u/[username]` cuando exista
  username.
- Si mas adelante se quiere "semanas sostenidas por practica", hace falta modelar repeticiones por
  practica o aceptar que el dato sea por pilar, no por practica individual.

### Recap

La slice 3 queda implementada: el perfil publico ahora muestra una seccion de practicas compartidas
activas, agrupadas por pilar, con ancla, minimo o fallback honesto y fecha de inicio. La decision de
privacidad sigue naciendo en `/habitos`; el perfil solo lee lo que la persona ya compartio y no
introduce campeones, ranking ni puntos.

### Próximos pasos (opciones)

- Implementar la slice 4: convertir alias visibles en celebraciones y aportes del jardin en enlaces
  al perfil publico cuando exista username.
- Revisar visualmente el perfil con varias practicas compartidas de distintos pilares para ajustar
  densidad y orden si hace falta.
- Cerrar aqui la parte de perfiles y medir si los switches de compartir empiezan a producir perfiles
  con contenido suficiente antes de abrir descubrimiento de personas.
