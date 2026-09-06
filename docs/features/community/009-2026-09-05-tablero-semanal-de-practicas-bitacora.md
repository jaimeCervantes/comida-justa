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
