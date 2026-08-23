# 026 · La semana que vuelve

## Contexto

- **Problema:** la práctica de los cuatro pilares muere a los siete días. La ventana se escribe una
  vez y no se mueve nunca, así que al octavo día no hay nada que registrar ni nada que empezar.
- **Ahorro:** deja de perderse la gente que ya empezó. El pilar retiene en vez de expirar, y deja de
  ser vergonzoso invitar a alguien a algo que caduca solo.
- **Por qué:** los cuatro pilares son la promesa de práctica sostenida de Hazlo Sano. Una práctica
  que solo se puede hacer una semana no es una práctica.

## Lo que dice la base de datos (23 de agosto de 2026)

| reto | personas | ventanas vencidas | completaron |
| --- | --- | --- | --- |
| `nutrition-one-plant-v1` | 3 | 3 | 0 |
| `sleep-evening-to-morning-v1` | 3 | 2 | 1 |
| `mind-one-connection-v1` | 2 | 2 | 0 |
| `movement-two-minutes-v1` | 1 | 1 | 0 |

Las nueve inscripciones empezaron el **martes 11 de agosto**. **La última repetición de toda la base
es del 16 de agosto**: llevan una semana sin poder marcar nada. Hay 12 repeticiones, 6 celebraciones
de primer ciclo y 1 de reto completado.

## Los tres defectos, y por qué son uno solo

1. **La ventana se congela.** `PostgresHabitChallengeRepository.start()` guarda el periodo con
   `coalesce(periodo_guardado, periodo_nuevo)`, así que la primera ventana es la única que existirá.
   `evaluateCycleDate` solo acepta fechas dentro de ella.
2. **El contador cuenta la vida entera.** `findProgress` trae *todas* las repeticiones sin filtro de
   fecha y `buildPeriodHabitProgress` cuenta `completedDates.length` sin mirar el periodo. Hoy da
   igual porque solo existe una ventana; en cuanto haya semana 2, el contador arrancaría en «12 de 7»
   y `succeeded` vendría en verdadero de nacimiento. **Renovar la ventana sin acotar la lectura
   cambia un bug por otro peor.**
3. **Hay dos ideas de semana que no se hablan.** La personal empieza el día que le diste a empezar
   (`createLocalChallengePeriod`); la de la liga es lunes a domingo en UTC (`createUtcLeagueWeek`),
   que en México salta a las 18:00 del domingo.

## El modelo acordado

**La ventana es la semana de la comunidad; sumarse sigue siendo una decisión.**

- La ventana deja de nacer el día que empezaste y pasa a ser `[lunes, lunes)`, **la misma para
  todos**, anclada en `America/Mexico_City` — es una comunidad mexicana y una semana compartida solo
  significa algo si es la misma semana.
- Cuando la semana guardada ya cerró, el panel **invita** a sumarse a la semana en curso. No inscribe
  solo: volver es una decisión, y una decisión sostiene mejor que un contador que se reinicia en la
  cara de alguien que no lo pidió.
- **Sumarse nunca reescribe una semana en curso.** Solo se reescribe la ventana que ya cerró; si no,
  «empezar de nuevo» sería el botón para borrar un mal miércoles.
- Las repeticiones se leen **acotadas a la ventana vigente**. Las anteriores no se borran: siguen en
  `habit_repetitions` con su fecha, siguen alimentando el jardín y siguen siendo historia.
- El contrato de rango se mantiene `[inicio, fin)`, como manda `AGENTS.md`.

### Cabe sin migración

`period_start_date`, `period_end_date` y `habit_repetitions.cycle_date` ya existen. **El slice 1 no
toca el esquema**, lo cual importa: la base es compartida con el backend Python y cualquier cambio de
esquema es trabajo de Alembic allá, no de Drizzle aquí. El slice 4 sí lo pediría, y por eso queda al
final y marcado.

## Slices

### Slice 1 — La semana vuelve

Lo mínimo que revive la práctica para las nueve inscripciones atoradas.

- La ventana comunitaria `[lunes, lunes)` en `America/Mexico_City` entra al dominio.
- `start()` reescribe la ventana **solo si la guardada ya cerró**; deja intacta la que está en curso.
- El progreso se calcula sobre las repeticiones **de la ventana vigente**.
- El panel, ante una ventana cerrada, ofrece sumarse a la semana en curso en vez de pintar los días
  de la semana pasada.

**Aceptación:** alguien que empezó el 11 de agosto abre su pilar hoy, se suma, y ve los siete días de
la semana en curso con su contador en «0 de 7» — sin que sus repeticiones anteriores desaparezcan del
jardín. Registrar una fecha de la semana pasada deja de ser posible.

### Slice 2 — Quien llega tarde no arranca perdiendo

- La meta de una semana parcial es la que quepa: `min(5, días que quedan contando hoy)`.
- La celebración final reconoce la meta de esa semana, no un 5 fijo. Hoy `canPublishHabitCelebration`
  tiene el 5 y el 1 escritos a mano, duplicando `HABIT_CHALLENGE_TARGET`.

**Aceptación:** quien se suma un domingo tiene una meta de 1, alcanzable, y no una de 5 imposible.

### Slice 3 — La semana es de todos, y se nota

- El jardín y el aviso comunitario hablan de **la semana en curso**, no de la historia acumulada.
- `createUtcLeagueWeek` se ancla en `America/Mexico_City` y pasa a ser la **misma** función que abre
  la ventana de la práctica. Deja de haber dos semanas.

**Aceptación:** una sola definición de semana en el dominio, y el jardín dice cuántas personas están
practicando *esta* semana.

### Slice 4 — Las semanas se suman (reescrito el 2026-08-23, sin migración)

Se planteó como **una racha**: «tres semanas seguidas». Dos cosas lo tumbaron al mirarlo de cerca.

**Pedía tabla nueva.** Para saber si cumpliste la meta de una semana pasada hace falta saber cuál era
esa meta, y con la meta proporcional del slice 2 depende del día en que te sumaste. Esa ventana se
sobrescribe al reincorporarse, y aproximarla con la primera repetición de la semana marcaría como
«se sumó el jueves» a quien se sumó el lunes y tardó en arrancar, bajándole la meta a posteriori.

**Y una racha contradice el resto del producto.** Este producto tiene un reconocimiento entero
dedicado a regresar (`comeback`), celebra «sin borrar los días imperfectos», se niega a afirmar que
formaste un hábito y no enseña una clasificación vacía. Una racha es aversión a la pérdida: vuelve a
cero justo a quien faltó una semana y regresó — la única persona a la que el resto del producto se
esfuerza en no castigar.

Lo que se hizo en su lugar: **contar en cuántas semanas distintas hubo práctica**. Acumulado, nunca
baja, no castiga a nadie, y sale entero de `habit_repetitions.cycle_date`, que ya está guardado.
**Sin migración.** Se anuncia a partir de la segunda semana, porque «1 semana sostenida» todavía no
dice nada y su estreno reconoce justo lo que cuesta: haber vuelto.

La racha estricta sigue siendo posible si algún día se quiere, y entonces sí sería una tabla nueva y
una conversación con el backend de Python.

## Archivos que toca el slice 1

| Zona | Archivos |
| --- | --- |
| Dominio | `src/domain/habits/habitChallenge.ts` (+ su test) |
| Caso de uso | `src/use_cases/habits/habitChallengeUseCase.ts` (+ su test) |
| Puerto | `src/use_cases/habits/ports/HabitChallengeRepository.ts` |
| Infraestructura | `src/infra/dataAccess/habits/PostgresHabitChallengeRepository.ts` |
| Presentación | `src/presentation/habits/HabitChallengePanel.tsx` (+ su test) |
| Catálogo | `src/i18n/messages/{es,en}.json` |
| Especificación | `src/e2e/habits/laSemanaQueVuelve.feature` + su spec |

## Riesgos

- **Las nueve inscripciones vivas.** Ninguna se toca por migración: la ventana se reescribe la
  primera vez que la persona se sume desde el panel. Quien no vuelva se queda como está, que es
  exactamente donde está hoy.
- **La repetición huérfana.** Las 12 repeticiones existentes caen fuera de toda ventana futura. Se
  conservan (jardín, historia) y dejan de contar para la meta semanal. Es lo correcto y hay que
  decirlo en la interfaz, no dejar que se note como una resta.
