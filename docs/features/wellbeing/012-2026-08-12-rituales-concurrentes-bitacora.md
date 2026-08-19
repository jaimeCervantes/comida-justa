# Bitacora - Rituales concurrentes

## 2026-08-11 - Slice 1: progreso concurrente y siempre visible

### Objetivo

Permitir que una persona inicie y practique varios rituales sin que el ultimo oculte los anteriores,
manteniendo independientes sus ventanas, ciclos, puntos, hitos y consentimientos.

### Decisiones y racional

- La existencia de una fila de progreso representa un ritual iniciado. `active_for_onboarding` deja
  de formar parte del contrato de aplicacion y de la decision de renderizado.
- `start` ya no desactiva otras filas ni escribe la bandera historica. Esto permite desplegar el
  codigo aun antes de retirar el indice, porque un segundo ritual usa el default `false` y no choca
  con la restriccion antigua.
- El panel solo muestra `Empezar` o `Continuar` cuando no existe una ventana. Una bandera antigua en
  `false` no vuelve a esconder calendario, puntos ni controles.
- Se retiro el adaptador generico singular, su puerto y su caso de uso. Los cuatro pilares ya usan el
  repositorio parametrizado por `challengeKey`; conservar dos caminos habria permitido que la
  exclusividad reapareciera por accidente.
- `/habitos` deja de afirmar que hay una unica practica activa. Su retiro completo sigue perteneciendo
  al slice 3 de la fusion con `/pilares`.
- Los puntos personales siguen siendo independientes por ritual y la liga conserva su tope de un
  punto por fecha local.

### Archivos tocados

**Comportamiento y persistencia**

- `HabitChallengePanel.tsx` y su prueba colocada junto al componente.
- `PostgresAtomicSleepChallengeRepository.ts`.
- `AtomicSleepChallengeRepository.ts` y `atomicSleepChallengeUseCase.ts`.
- `schema/habits.ts`, como espejo Drizzle del indice retirado.
- Se eliminaron `PostgresCuratedHabitRepository.ts`, `CuratedHabitRepository.ts`,
  `curatedHabitUseCase.ts` y su prueba singular.

**Presentacion e idiomas**

- `/habitos/page.tsx` deja de consultar y rotular una unica practica.
- `es.json` y `en.json` retiran las claves singulares sin romper su paridad estructural.

**Especificacion y pruebas**

- `docs/features/wellbeing/012-2026-08-12-rituales-concurrentes.md`.
- `concurrentHabitRituals.feature` y la especificacion historica de retos atomicos.
- `atomicSleepChallenge.spec.ts` comprueba Sueño y Alimentacion en paralelo.
- `testData.ts` filtra backdating y conteos por `challengeKey`.

**Base compartida y documentacion**

- Backend externo: `alembic/versions/0038_2026-08-11_allow_concurrent_habit_rituals.py`.
- `docs/data/001-2026-06-19-database.md` refleja el head y las migraciones de habitos.

### Comandos clave

- `pnpm run test:run -- "src/presentation/habits/HabitChallengePanel.test.tsx"`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `uv run ruff check alembic/versions/0038_2026-08-11_allow_concurrent_habit_rituals.py`
- `uv run ruff format --check alembic/versions/0038_2026-08-11_allow_concurrent_habit_rituals.py`
- `uv run alembic upgrade 0037_2026_08_11:0038_2026_08_11 --sql`
- `uv run alembic upgrade head`
- `uv run alembic current`

### Resultados de validacion

- Prueba roja inicial: 1 fallo esperado; el progreso marcado `active: false` solo mostraba
  `Continuar`.
- Pruebas enfocadas: 3 archivos, 22 pruebas aprobadas.
- Suite Vitest completa: 138 archivos, 1,300 pruebas aprobadas y 0 fallos.
- TypeScript de produccion: aprobado sin errores.
- TypeScript de pruebas y Playwright: aprobado sin errores.
- Biome: 754 archivos revisados, 0 errores; conserva un aviso informativo preexistente en
  `IndexingStatusPanel.tsx`.
- Alembic: SQL offline revisado; el upgrade contiene `DROP INDEX` y actualiza la version.
- Ruff: migracion aprobada por lint y formato.
- Base compartida: migrada de `0037_2026_08_11` a `0038_2026_08_11`; no se actualizaron ni
  eliminaron filas y no se retiro ninguna columna. Se elimino `uq_habit_one_active_onboarding`.
- Playwright E2E: actualizado pero no ejecutado; el usuario mantiene la corrida manual.

### Desviaciones del roadmap

- El roadmap proponia inicialmente migracion antes que codigo. Se descubrio una secuencia mas segura:
  dejar de escribir la bandera hace que el codigo concurrente pueda convivir temporalmente con el
  indice antiguo. La migracion se aplico igualmente para que el esquema deje de expresar una regla
  retirada.
- No se creo una lectura plural para `/habitos`: se retiro su resumen singular porque esa pagina sera
  eliminada en el slice 3 de la fusion. Construir un indice temporal habria sido trabajo desechable.

### Seguimientos

- Ejecutar manualmente Playwright y confirmar que Sueño y Alimentacion conservan progreso simultaneo.
- Definir en otro feature el reinicio de ventanas vencidas, pausa y nuevas campañas.
- Implementar por separado el feed de varias celebraciones y la bandeja para usuarios seguidos.

### Recap

Los cuatro rituales ya pueden coexistir: iniciar uno no toca los otros y cada pilar muestra de
inmediato cualquier progreso guardado, incluso si el modelo anterior lo habia desplazado. La base
compartida retiro la garantia exclusiva sin alterar datos, mientras puntos, liga, jardin y
celebraciones conservan sus reglas actuales.

### Próximos pasos (opciones)

- Accion del usuario: ejecutar `pnpm run test:e2e:run` y compartir cualquier fallo.
- Si Playwright queda verde, continuar el slice 3 de fusion para retirar `/habitos`.
- Abrir despues un roadmap independiente para celebraciones multiples y notificaciones por
  seguimiento.
