# Rituales concurrentes

Roadmap para permitir que una persona practique varios pilares al mismo tiempo y consulte siempre
su progreso guardado. La especificacion de comportamiento vive en
`src/e2e/habits/concurrentHabitRituals.feature` y la bitacora del slice vivira en
`docs/features/wellbeing/012-2026-08-12-rituales-concurrentes-bitacora.md`.

## Alineacion

- **Problem:** iniciar un ritual desactiva los demas. El progreso no se borra, pero el pilar lo
  sustituye por un boton `Continuar`, lo que parece una perdida de avance y obliga a reactivar para
  volver a verlo.
- **Savings:** se eliminan reactivaciones, confusion y riesgo de abandonar un ritual por creer que
  desaparecio. La persona puede distribuir su semana entre los cuatro pilares.
- **Why:** el modelo de salud de Hazlo Sano depende de cuatro pilares complementarios; convertirlos
  en opciones mutuamente excluyentes contradice ese objetivo.

## Modelo acordado

- Los cuatro rituales pueden estar iniciados y avanzar simultaneamente.
- Cada ritual conserva su propia ventana de siete dias, fechas, repeticiones, puntos, hitos,
  consentimiento de jardin y celebraciones.
- Una fila de progreso significa que el ritual fue iniciado. La bandera historica
  `active_for_onboarding` deja de decidir si el progreso puede verse o registrarse.
- Todo progreso existente se vuelve visible y utilizable sin backfill ni sobrescritura de datos,
  aunque una activacion anterior haya dejado su bandera en `false`.
- Los puntos personales se suman por ritual. La liga conserva el limite actual de un punto por dia,
  aunque se practiquen varios pilares en esa fecha.
- Entrar a un pilar es una lectura: nunca inicia, reactiva ni desactiva un ritual implicitamente.
- Un ritual que alcanza su meta permanece visible como completado.
- Reiniciar una ventana vencida, pausar rituales y repetir una campana completada quedan fuera de
  este slice; requieren una politica de ciclo de vida propia.
- El feed de varias celebraciones y la bandeja de notificaciones son features separadas.

## Roadmap

### Slice 1 - Progreso concurrente y siempre visible

**Alcance**

- Preparar en el backend Alembic una migracion no destructiva que elimine unicamente el indice
  parcial `uq_habit_one_active_onboarding`.
- Mantener temporalmente la columna `active_for_onboarding` para no destruir informacion ni exigir
  un backfill; retirarla sera una limpieza posterior cuando no tenga consumidores.
- Actualizar el espejo Drizzle para reflejar la ausencia del indice unico.
- Evitar que `start` o `activate` desactive los otros rituales de la cuenta.
- Dejar de proyectar la bandera de onboarding en el progreso que consume la interfaz.
- Mostrar calendario, ciclos, puntos, hitos y controles de privacidad siempre que exista progreso.
- Retirar de `/habitos` el resumen y distintivo singulares de `practica activa` mientras esa pagina
  espera su consolidacion ya planeada bajo `/pilares`.
- Retirar el camino singular `findActive` y sus adaptadores si quedan sin consumidores.
- Acotar los helpers E2E por `challengeKey`, para que preparar Sueño no altere ni cuente otros
  rituales de la misma cuenta.
- Conservar sin cambios las reglas de jardin, celebraciones y liga.

**Criterios de aceptacion**

- Iniciar `Una planta mas` despues de `Del atardecer al amanecer` deja ambos progresos disponibles.
- Volver a Sueño muestra inmediatamente sus ciclos y puntos guardados, sin pulsar `Continuar`.
- Se puede registrar una repeticion independiente en Sueño y Alimentacion el mismo dia.
- Empezar cualquiera de los cuatro rituales no modifica las filas de los otros tres.
- El progreso historico marcado como inactivo por el modelo anterior vuelve a ser visible sin
  cambiarlo al abrir la pagina.
- Dos rituales practicados el mismo dia suman puntos personales independientes y un solo punto de
  liga.
- Un ritual completado sigue mostrando su calendario, recompensa y controles de privacidad.
- Ninguna lectura de un pilar escribe en la base de datos.
- La migracion no altera periodos, repeticiones, puntos, celebraciones ni consentimientos.

## Migracion y despliegue

- Alembic en `C:/Users/S2G52/Desktop/jaimito/HazloSano/bot-whatsapp/backend` sigue siendo la unica
  fuente de verdad del esquema. Antes de crear la revision se confirma su head real.
- El `upgrade` elimina solo `uq_habit_one_active_onboarding`.
- El `downgrade` comprueba primero que ninguna cuenta tenga varias filas marcadas como activas. Si
  las hay, aborta; nunca elige una ni desactiva las demas silenciosamente.
- El codigo deja de escribir `active_for_onboarding`, por lo que puede convivir temporalmente con el
  indice antiguo sin chocar al iniciar un segundo ritual. La migracion sigue siendo necesaria para
  retirar del esquema una garantia que ya no representa al dominio, pero no bloquea el despliegue.
- Aplicar `alembic upgrade head` sobre la base compartida requiere autorizacion explicita separada.

## Validacion

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run typecheck:tests`
- `pnpm run lint`
- `git diff --check`
- El usuario ejecuta manualmente `pnpm run test:e2e:run` despues de aplicar la migracion.
