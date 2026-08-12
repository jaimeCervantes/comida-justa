# Bitacora - Lista de celebraciones publicas

## 2026-08-11 - Slice 1: ocho celebraciones recientes en el inicio

### Objetivo

Hacer visibles varios hitos compartidos de los cuatro pilares sin que la celebracion mas reciente
reemplace visualmente a las anteriores.

### Decisiones y racional

- El puerto publico ahora devuelve una coleccion limitada y ordenada. El home pide ocho resultados y
  el mensaje global reutiliza el mismo contrato con limite uno, evitando dos definiciones de
  "celebracion reciente".
- Conteo de reacciones y estado del visitante se resuelven con subconsultas correlacionadas dentro de
  la lectura principal. La lista completa usa una consulta, no una consulta adicional por tarjeta.
- El orden `published_at DESC, id DESC` mantiene una salida determinista incluso ante timestamps
  iguales.
- `PublicHabitCelebrationList` agrupa semanticamente las tarjetas, usa H2 propio y baja cada tarjeta
  a H3. En movil conserva una columna y en escritorio usa dos.
- La lista desaparece por completo cuando no hay celebraciones; no muestra un bloque vacio ni
  actividad inventada.
- El aviso superior permanece singular. Convertirlo en bandeja personalizada requiere destinatarios,
  estado leido y reglas de seguimiento, y sigue fuera de este slice.

### Archivos tocados

**Contrato y datos**

- `AtomicSleepChallengeRepository.ts`.
- `PostgresAtomicSleepChallengeRepository.ts`.
- `readLatestPublicCelebration.ts` y `readRecentPublicCelebrations.ts`.

**Presentacion**

- `src/app/[locale]/page.tsx`.
- `PublicHabitCelebrationList.tsx` y `PublicHabitCelebrationCard.tsx`.
- Catalogos `es.json` y `en.json` con el titulo de seccion.

**Especificacion y pruebas**

- `docs/features/lista-celebraciones.md`.
- `publicCelebrationList.feature` y ajuste de la especificacion historica.
- `PublicHabitCelebrationList.test.tsx`.
- `readRecentPublicCelebrations.test.ts`.
- `atomicSleepChallenge.spec.ts` agrega el recorrido con Sueño y Alimentacion compartidos.

### Comandos clave

- `pnpm run test:run -- "src/presentation/habits/PublicHabitCelebrationList.test.tsx"`
- `pnpm run test:run -- "src/presentation/habits/PublicHabitCelebrationList.test.tsx" "src/infra/habits/readRecentPublicCelebrations.test.ts"`
- `pnpm exec tsx -e "...findRecentPublicCelebrations(8, null)..."`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`

### Resultados de validacion

- Prueba roja inicial: el componente de lista aun no existia y Vitest no podia resolverlo.
- Pruebas enfocadas finales: 2 archivos, 5 pruebas aprobadas.
- Suite Vitest completa: 140 archivos, 1,305 pruebas aprobadas y 0 fallos.
- TypeScript de produccion: aprobado sin errores.
- TypeScript de pruebas y Playwright: aprobado sin errores.
- Biome: 758 archivos revisados, 0 errores; conserva un aviso informativo preexistente en
  `IndexingStatusPanel.tsx`.
- Consulta PostgreSQL de solo lectura: devolvio tres celebraciones publicas en orden, con sus pilares
  y conteos de reaccion, mediante la nueva consulta plural.
- Playwright E2E: actualizado pero no ejecutado; el usuario mantiene la corrida manual.
- Recursos compartidos: no se insertaron, actualizaron ni eliminaron filas.

### Desviaciones del roadmap

- Ninguna de comportamiento. El escenario de limite se protege en Vitest con nueve resultados,
  comprobando tanto que el home pide ocho como que nunca expone el noveno; la consulta PostgreSQL
  aplica ademas su propio `LIMIT`.

### Seguimientos

- Ejecutar Playwright manualmente y confirmar dos tarjetas de la cuenta E2E en orden multipilar.
- Medir si ocho celebraciones son insuficientes antes de implementar cursor y `Cargar mas`.
- Abrir un feature separado para bandeja personal basada en personas seguidas.

### Recap

El inicio ya presenta hasta ocho celebraciones publicas en una lista responsive. Cada hito conserva
su pilar, enlace, contador y reaccion, los retirados no aparecen y el mensaje global continua
mostrando solamente el evento mas reciente sin convertirse todavia en notificacion personal.

### Próximos pasos (opciones)

- Accion del usuario: ejecutar `pnpm run test:e2e:run` y compartir cualquier fallo.
- Si la lista resulta suficiente, continuar con la consolidacion pendiente de `/pilares`.
- Si hace falta historial, activar el slice 2 con cursor estable y `Cargar mas`.
- Diseñar despues la bandeja de notificaciones para hitos de personas seguidas.

## 2026-08-11 - Slice 2: compartir progreso heredado

### Objetivo

Permitir que los rituales con repeticiones validas pero marcadores derivados vacios puedan publicar
sus hitos cuando la persona lo solicita explicitamente.

### Decisiones y racional

- Las repeticiones persistidas pasan a ser la fuente de elegibilidad para publicar, igual que ya lo
  son para calendario, puntos y nivel. Una repeticion habilita `first_cycle` y cinco habilitan
  `challenge_completed`.
- La regla vive en `habitCommunity.ts`, no dentro de SQL, para que los limites 1 y 5 sean explicitos,
  probables y comunes a los cuatro pilares.
- PostgreSQL cuenta repeticiones del par `user_id + challenge_key` antes del upsert. Los marcadores
  `first_cycle_completed_at` y `final_completed_at` siguen disponibles como datos derivados, pero ya
  no pueden contradecir el progreso visible.
- No se hizo backfill ni publicacion automatica. Compartir sigue siendo consentimiento voluntario y
  requiere volver a pulsar el boton.

### Archivos tocados

**Dominio y contrato**

- `src/domain/habits/habitCommunity.ts` y `habitCommunity.test.ts`.
- `AtomicSleepChallengeRepository.ts` mueve el tipo de milestone al dominio.

**Persistencia**

- `PostgresAtomicSleepChallengeRepository.ts` valida hitos por conteo de repeticiones.

**Especificacion y E2E**

- Roadmap y `publicCelebrationList.feature` detallan el slice 2.
- `atomicSleepChallenge.spec.ts` cubre Alimentacion con marcador vacio.
- `testData.ts` puede vaciar el marcador solo para datos reversibles de la cuenta E2E.

### Comandos clave

- Consultas PostgreSQL de solo lectura para comparar progreso, repeticiones y celebraciones de
  Alimentacion.
- `pnpm run test:run -- "src/domain/habits/habitCommunity.test.ts"`
- `pnpm run test:run -- "src/domain/habits/habitCommunity.test.ts" "src/use_cases/habits/atomicSleepChallengeUseCase.test.ts"`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`

### Resultados de validacion

- Diagnostico: la fila existente de Alimentacion tenia una repeticion, marcadores de primer/final
  hito vacios y ninguna celebracion; el boton era visible por el conteo, pero el repositorio la
  rechazaba por el marcador.
- Prueba roja inicial: 5 casos fallaron porque `canPublishHabitCelebration` aun no existia.
- Pruebas enfocadas: 2 archivos, 16 pruebas aprobadas.
- Suite Vitest completa: 140 archivos, 1,310 pruebas aprobadas y 0 fallos.
- TypeScript de produccion: aprobado sin errores.
- TypeScript de pruebas y Playwright: aprobado sin errores.
- Biome: 758 archivos revisados, 0 errores; conserva el aviso informativo preexistente en
  `IndexingStatusPanel.tsx`.
- Playwright E2E: actualizado pero no ejecutado; el usuario mantiene la corrida manual.
- Recursos compartidos: solo se leyeron filas para el diagnostico; no se publico, actualizo ni
  elimino ningun dato real.

### Desviaciones del roadmap

- Ninguna de comportamiento. No se agrego una migracion porque la inconsistencia puede resolverse
  usando la fuente de verdad existente sin reescribir datos historicos.

### Seguimientos

- Volver a pulsar `Compartir con la comunidad` en Alimentacion para crear la celebracion que antes
  fue rechazada.
- Ejecutar Playwright manualmente para validar el marcador vacio sobre datos E2E reversibles.

### Recap

Compartir Alimentacion ahora funciona incluso para avances creados por el flujo anterior: el
repositorio reconoce la repeticion que ya produce puntos y permite publicar el primer hito. La regla
se aplica tambien a los demas pilares y al hito final de cinco repeticiones, sin publicar nada sin
consentimiento.

### Próximos pasos (opciones)

- Accion del usuario: abrir Alimentacion y pulsar nuevamente `Compartir con la comunidad`.
- Ejecutar `pnpm run test:e2e:run` para validar el recorrido completo.
- Si la tarjeta aparece, continuar con la bandeja de notificaciones o el historial paginado.
