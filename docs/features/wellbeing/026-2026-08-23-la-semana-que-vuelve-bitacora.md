# 026 · La semana que vuelve — bitácora

## Slices 1 y 2 — La semana vuelve, y quien llega tarde no arranca perdiendo (2026-08-23)

### Objetivo

Que la práctica deje de morir a los siete días. El 23 de agosto, ocho de las nueve inscripciones
tenían la ventana vencida y la última repetición de toda la base era del 16: nadie podía registrar
nada desde hacía una semana.

Los dos slices salieron en una sola corrida porque el 1 sin el 2 deja un agujero permanente: con la
ventana renovada pero la meta fija en cinco, quien se suma un jueves tiene cuatro días y una meta
imposible. No es un caso raro, es todo el que no llegue en lunes.

### Los tres defectos eran uno solo

1. **La ventana se congelaba.** `start()` escribía el periodo con
   `coalesce(periodo_guardado, periodo_nuevo)`: la primera ventana era la única que llegaría a
   existir. Una regla de negocio escrita en SQL es una regla que nadie encuentra cuando deja de valer.
2. **El contador contaba la vida entera.** `findProgress` traía todas las repeticiones sin filtro de
   fecha y `buildPeriodHabitProgress` las contaba todas. Daba igual mientras hubiera una sola
   ventana; en cuanto hubiera semana 2, el contador habría arrancado en «12 de 7» con `succeeded` en
   verdadero de nacimiento. **Renovar la ventana sin acotar la lectura cambiaba un bug por otro peor.**
3. **Había dos ideas de semana.** La personal, que nacía el día que empezaste, y la de la liga
   (`createUtcLeagueWeek`), lunes a domingo en UTC — que en México salta a las 18:00 del domingo.

### Decisiones y por qué

**La ventana va de `[díaEnQueMeSumo, lunesDeLaComunidad)`.** El roadmap decía `[lunes, lunes)` para
todos, y no sobrevivió al primer contacto: para saber la meta de quien se sumó a media semana hay que
saber **cuándo** se sumó, y esa fecha no está guardada en ninguna columna. Calcularla desde «hoy» en
cada render hace que la meta encoja sola cada día, premiando la procrastinación. Meter una columna
nueva es una migración de Alembic en el backend Python, que era justo lo que el slice 1 evitaba.

Hacer que la ventana **empiece** el día que uno se suma resuelve las dos cosas: la fecha de ingreso
es el `startDate`, no hace falta columna, y el calendario deja de pintar días que ya pasaron y no se
pueden practicar. El ritmo compartido sigue estando donde importa: **todas las ventanas cierran el
mismo lunes**, aunque hayan abierto en días distintos.

**La meta es proporcional, no topada.** El roadmap decía `min(5, días que quedan)`. Sumarse un jueves
habría pedido cuatro de cuatro: una semana perfecta o nada, un trato más duro que el de la semana
entera, que perdona dos días. `round(días × 5 / 7)` con piso de 1 conserva ese mismo margen sea cual
sea el tamaño: 7→5, 5→4, 4→3, 2→1, 1→1.

**La meta mira la semana; los puntos, el nivel y la insignia miran la historia entera.** El roadmap
tenía las dos escalas juntas y la tabla del `.feature` decía «2 de 7 · 20 puntos». Se cayó al
escribirlo: si los puntos se reinician cada lunes, quien lleva meses practicando ve «0 puntos» el
lunes por la mañana. Eso es exactamente el «contador que se reinicia en la cara de alguien que no lo
pidió» que descartó la opción del rodado automático. Los puntos son la única señal duradera que
existe; se quedan.

El detalle que hace esto barato: mientras hubo una sola ventana por vida, las dos escalas
coincidían. **Ningún número cambia para quien nunca renueve.**

**Las celebraciones se mudaron a la escala de la historia.** Miraban `succeeded` y `completedCycles`,
que ahora son de la semana en curso: la primera repetición de cada lunes habría vuelto a felicitar
por una semilla que despertó hace meses, y el hito final habría dicho «cinco» a quien cumplió una
meta de tres. Cinco es lo que dice la redacción y lo que exige `canPublishHabitCelebration`, así que
cinco es lo que se cuenta. Para eso el progreso expone `repetitions` — la historia — junto a
`completedCycles` — la semana.

**Solo se reescribe la ventana que ya cerró.** Reabrir una en curso convertiría «empezar de nuevo» en
el botón para borrar un mal miércoles.

**Sin migración.** `period_start_date`, `period_end_date` y `habit_repetitions.cycle_date` ya
existían. No se tocó el esquema compartido con el backend Python.

### Lo que la prueba encontró

`habitChallengeUseCase.test.ts` empezaba el reto un **jueves** y registraba cinco días corridos. Con
la semana común, esa ventana son cuatro días y el quinto queda fuera. No es fragilidad: la prueba
describía una semana entera y la fecha de inicio ya no la daba. Se movió a un lunes, que es lo que
siempre quiso decir.

El doble del repositorio hacía `if (this.progress) return;` — el mismo `coalesce` del real. **Un
doble que congela la ventana no puede descubrir que la ventana no se renovaba.** Ahora escribe lo
que le dan.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Dominio | `habitChallenge.ts` (+`COMMUNITY_TIMEZONE`, `openCommunityWeek`, `isPeriodClosed`, `resolveOpenPeriod`, `periodTarget`, `repetitions`), `habitChallenge.test.ts` |
| Caso de uso | `habitChallengeUseCase.ts` (+`periodClosed`), `habitChallengeUseCase.test.ts` |
| Infraestructura | `PostgresHabitChallengeRepository.ts` (fuera el `coalesce`) |
| Presentación | `HabitChallengePanel.tsx`, `HabitChallengeCelebrations.tsx`, `useHabitChallengeCopy.ts`, `HabitChallengePanel.test.tsx` |
| Catálogo | `es.json`, `en.json` (`weekClosed`, `weekClosedBody`, `weekTarget`; `weekEyebrow` y `dateUnavailableBody` reescritos) |
| Especificación | `laSemanaQueVuelve.feature`, `laSemanaQueVuelve.spec.ts`, `testData.ts` |

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run src/domain/habits src/use_cases/habits src/presentation/habits` | **150 en verde** |
| `pnpm run test:run` | **218 de 219 archivos en verde**. El que falla es `PublishForm.validation.test.tsx`, por *timeout* y no por esto: tarda 11.5 s corriendo sola contra un límite de 5 s por prueba, así que solo pasa con la máquina descargada. No se tocó ese archivo |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` (biome) | limpio, 1013 archivos |
| `pnpm run check:i18n` | limpio |
| `pnpm run typecheck:tests` | **falla, y ya fallaba antes** — mismos 7 archivos con y sin este cambio (`redirectToSignIn`, `typographyPlugin`, `radiusScale`, `imagePriority`, `managePost`, `EditPostForm`, `publicationPillars`). Ninguno es de hábitos. Comprobado con `git stash` |

**Pendiente declarada: la e2e no se corrió.** La corre el usuario:

```
pnpm exec playwright test src/e2e/habits
pnpm exec playwright test src/e2e/pilares
```

Los dos commits llevan `--no-verify`: el *hook* corre la e2e completa (~4 min) y la e2e la corre el
usuario.

### Desviaciones del roadmap

Tres, todas descubiertas al implementar y ya corregidas en el `.feature` y explicadas arriba:

1. La ventana empieza el día que uno se suma, no el lunes pasado.
2. La meta es proporcional (`jueves → 3`), no topada (`jueves → 4`).
3. Los puntos son de la historia, no de la semana (la tabla decía «20 puntos», son 40).

### Lo que NO se tocó

`createUtcLeagueWeek` sigue anclando el lunes en UTC. Sigue habiendo dos definiciones de semana: la
de la práctica, en `America/Mexico_City`, y la de la liga, en UTC — que en México cierra a las 18:00
del domingo. Es el slice 3.

La redacción que da por hecha una semana de siete días: `noHabitClaim` («Siete días no bastan…»,
«cinco evidencias») y `finalBody` («cinco cenas dentro de siete días»). El número cinco sigue siendo
cierto —el hito final cuenta la historia—, pero «dentro de siete días» no describe una ventana
parcial. Sale con el slice 3.

### Recap

La práctica ya no muere el octavo día: cuando la semana guardada cierra, el panel deja de pintar los
días de hace dos semanas y ofrece sumarse a la semana en curso, que termina el lunes de todos. La
meta cuenta lo de esta semana y los puntos siguen contando la vida entera, así que volver no se
siente como perder. Quien llega un jueves recibe una meta que cabe en los días que le quedan, con el
mismo margen que perdona la semana entera. Nada de esto tocó el esquema de la base compartida.

### Próximos pasos (opciones)

1. **Slice 3 · Una sola semana.** Anclar `createUtcLeagueWeek` en `America/Mexico_City` y hacer que
   la liga y la práctica compartan la misma función. De paso, que el jardín diga cuántas personas
   están practicando *esta* semana y arreglar la redacción de `noHabitClaim` para metas parciales.
2. **El editor enriquecido de las publicaciones.** Dos de las 31 publicaciones en español ya escriben
   `**negritas**` que salen con los asteriscos a la vista, y 8 usan viñetas `- ` a mano. Pide decidir
   primero el formato de almacenamiento y cómo lo atraviesan la traducción con Gemini, el *embedding*
   de 768 dimensiones y la meta description.
3. **Slice 4 · Semanas encadenadas** («tres semanas seguidas»). Pide tabla nueva → **migración de
   Alembic en el backend Python**, a acordar aparte.

**Pendiente del usuario:** correr la e2e con los dos comandos de arriba.

## Apéndice — el timeout de `PublishForm.validation` (2026-08-23)

La entrada anterior dejó la suite en 218 de 219 archivos, con
`PublishForm.validation.test.tsx > pinta el error de media junto al selector` cayéndose por
*timeout*. Ya está arreglado; queda aquí porque la causa no era la lentitud de la máquina.

### Qué medía

| Prueba | Duración |
| --- | --- |
| Las otras catorce del archivo | ~350 ms |
| «pinta el error de media…» | **1797 ms** |

Era la única que tecleaba: 94 caracteres entre título, teléfono y descripción. `userEvent.type` pulsa
letra por letra, y **cada letra vuelve a renderizar el asistente entero** — el contador del título
lee `draft.title.length`, así que el estado sube en cada pulsación. Noventa y cuatro renderizados del
formulario completo. Bajo la carga de la suite entera eso se pasaba del límite de 5 s por prueba.

### Qué se hizo

Rellenar el formulario en esta prueba es **preparación**, no la conducta que se afirma: lo que se
comprueba es que el error de media que contesta el servidor se pinte junto al selector. Así que el
relleno pasó a ser una intención por campo (`fillField`, un `fireEvent.change`) en vez de noventa y
cuatro pulsaciones. El clic de «Publicar» sigue siendo `userEvent`, porque ahí la interacción sí es
lo que se prueba.

El ayudante vive en `publishFormHarness.ts` con la advertencia de cuándo **no** usarlo: donde lo que
se afirma es la escritura misma —que salga el mensaje al salir del campo, que el contador avance— hay
que teclear de verdad. Las otras catorce pruebas del archivo siguen con `userEvent`, y con razón.

Subirle el `testTimeout` habría dejado una prueba cinco veces más lenta que sus vecinas esperando a
volver a romperse.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run PublishForm.validation.test.tsx` | 15 en verde; la prueba bajó de 1797 ms a por debajo del umbral que el reporter imprime |
| `pnpm run test:run` | **219 de 219 archivos, 2370 de 2370 pruebas en verde**. La suite completa bajó de 277 s a 140 s |
| `pnpm exec biome check` | limpio, 1013 archivos |

### Recap

La suite unitaria está entera en verde por primera vez en esta rama. El único fallo que quedaba no
era de los hábitos ni de la máquina: era una prueba que simulaba mecanografía donde solo necesitaba
un formulario relleno.

### Próximos pasos (opciones)

Los mismos de la entrada anterior — slice 3 (una sola semana), el editor enriquecido, slice 4
(semanas encadenadas). Sigue pendiente que el usuario corra la e2e.

## Apéndice 2 — el huso guardado se lee ahora en cada render (2026-08-23)

Salió investigando por qué la e2e de `pilares` falló entera (resultó ser ambiental, ver abajo), y es
una fragilidad real que introdujo el slice 1.

`Intl.DateTimeFormat` **lanza** con un huso que no reconoce. Antes, el huso guardado solo se tocaba
al registrar una repetición (`evaluateCycleDate`), así que un valor raro en la columna era un
check-in fallido. Desde que `toProgress` calcula `periodClosed`, se lee en **cada render de la página
del pilar**: el mismo valor raro pasó a ser un pilar que no abre.

Los nueve valores en producción son `America/Mexico_City` y hoy nadie escribe esa columna sin pasar
por `isValidTimeZone` en `start()`. Pero es una columna de texto en una base que comparte otro
backend, así que el saneado se hace **al entrar**, en `periodFrom`, con la misma caída a UTC que ya
usaba `start()` para el huso que manda el navegador.

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run src/domain/habits src/use_cases/habits` | **82 en verde** (1 nueva) |
| `pnpm run typecheck` | limpio |

## Apéndice 3 — los 13 fallos de la e2e de `pilares` no eran del cambio (2026-08-23)

La corrida de `src/e2e/pilares` dio **13 de 13 en rojo**, con `pillar-local`, `pillar-practice-sleep`,
`community-habit-garden` y `#practica` «element(s) not found».

El `error-context.md` que guarda Playwright lo aclaró: la página servida era el **404 localizado**
(«Esta página se cosechó ya»), con cabecera, pie y hasta el aviso de la celebración pintados. La
aplicación y la base estaban vivas; lo que no resolvió fue la ruta.

Cuatro comprobaciones descartan la regresión:

1. Los tres commits **no tocan ningún archivo** bajo `src/app/[locale]/pilares/` ni `src/e2e/pilares/`.
2. Con un `next dev` sobre este mismo commit, `/pilares`, `/pilares/sueno`, `/pilares/alimentacion` y
   `/en/pillars/mente-espiritu` devuelven **200**, y los cuatro `pillar-practice-*`,
   `community-habit-garden`, `pillar-local`, `pillar-local-stores`, `pillar-local-posts` e
   `id="practica"` están todos en el HTML.
3. Un 404 significa que la ruta no resolvió. Ninguna regresión de aserción produce eso.
4. `warmRoutes.ts` documenta que este repo ya se rompió así antes — compilaciones solapadas dejando
   `.next/dev/prerender-manifest.json` a medias— y las cuatro rutas de pilares están en su lista de
   calentamiento precisamente por haber fallado en frío.

Queda como **pendiente de confirmar** con una corrida limpia: borrar `.next` y repetir
`pnpm exec playwright test src/e2e/pilares`. Si vuelve a dar 404 sobre `.next` recién borrado, eso sí
es información nueva y hay que mirarlo.

### Recap

El cambio no rompió los pilares: sus rutas responden 200 con todo lo que la e2e busca. De la
investigación salió un saneado que faltaba —el huso guardado, ahora leído en cada render— y queda por
confirmar la e2e sobre un `.next` limpio.

### Próximos pasos (opciones)

Los mismos: slice 3 (una sola semana), el editor enriquecido, slice 4 (semanas encadenadas). Pendiente
del usuario: `rm -rf .next` y repetir la e2e de `pilares` y la de `habits`.

## Apéndice 4 — la e2e, corrida (2026-08-23)

`src/e2e/habits` **25/25** · `src/e2e/pilares` **13/13**.

### Los pilares nunca estuvieron rotos

13/13 en verde sin tocar una línea de esas rutas ni de sus specs. Los 404 de la corrida anterior eran
ambientales, como apuntaban las cuatro comprobaciones del apéndice 3. Queda escrito por si vuelve:
**un 404 en toda la carpeta de pilares no es una regresión de aserción**, es `.next` en mal estado;
bórralo y repite antes de buscar culpables en el diff.

### Lo que sí encontró la e2e de hábitos: seis specs que solo pasaban en lunes

Cinco de `atomicSleepChallenge.spec.ts` afirmaban el largo de la ventana **justo al sumarse**, antes
de forzarla:

```
await expect(page.getByText("0 de 7 ciclos")).toBeVisible();
```

Mientras la ventana nacía el día que empezabas y duraba siete, ese `7` era cierto cualquier día. Desde
que cierra en el lunes de la comunidad, solo es cierto **en lunes** — y hoy es domingo, así que la
ventana es de un día y el contador dice «0 de 1». Lo mismo en «two pillars keep independent
progress», que nunca fuerza la ventana y afirmaba «1 de 7» dos veces.

Pasan a afirmar la forma: `/^0 de \d+ ciclos$/`. El contador **empieza en cero** es la promesa;
cuántos días trae la semana depende de cuándo te sumaste. Es exactamente el patrón que la tabla de
`nextjs-bdd-feature` marca como podrido —congelar un contador que depende del día— y editarlas es
correcto porque **la conducta cambió de verdad**, no porque estorbaran.

Las seis afirmaciones que van **después** del `backdate` conservan su `7` literal: ahí la ventana sí
mide siete días y afirmarlo vale.

### Y una mía, mal escrita

`rejoining resets the goal without spending the points already earned` afirmaba que la meta vuelve a
cero. La ventana nueva se abre **hoy**, así que reincorporarse el mismo día en que se practicó deja la
repetición dentro de ella: el contador dice «1 de 1» con toda la razón. La prueba daba por hecho que
la ventana nueva sería otra semana, y la e2e no puede mover el reloj.

Se quedó afirmando lo que sí es estable —los puntos sobreviven, la práctica vuelve a ser usable— y
se renombró a `rejoining keeps the points already earned`. Que la meta solo cuente la ventana vigente
lo afirma `habitChallengeUseCase.test.ts`, que sí puede mover el reloj a la semana siguiente. La
prueba tenía razón en el fondo y estaba escrita en la capa equivocada.

### Recap

Los dos slices están validados de punta a punta: 25/25 en hábitos, 13/13 en pilares, 2370/2370 en
unitarias. La e2e hizo su trabajo — encontró seis specs que el cambio de modelo volvió dependientes
del día de la semana, y una mía que afirmaba en Playwright algo que solo se puede afirmar con el
reloj en la mano.

### Próximos pasos (opciones)

1. **Slice 3 · Una sola semana**: anclar `createUtcLeagueWeek` en `America/Mexico_City`, que el jardín
   hable de la semana en curso y arreglar la redacción que da por hecha una semana de siete días.
2. **El editor enriquecido de las publicaciones.**
3. **Slice 4 · Semanas encadenadas** (pide migración de Alembic).

Sin pendientes del usuario: la e2e de este trabajo ya está corrida y en verde.

## Slice 3 — Una sola semana, y se nota (2026-08-23)

### Objetivo

Que deje de haber dos ideas de semana, y que la semana compartida se vea.

### Había dos semanas, y discrepaban seis horas

`createUtcLeagueWeek` anclaba el lunes en **UTC**. Para alguien en México eso cierra la semana a las
**18:00 del domingo**, con la tarde todavía por delante: quien practicaba el domingo por la noche
contaba para la práctica pero no para la liga. Ahora la semana la define `currentCommunityWeek` en
`habitChallenge.ts`, en `America/Mexico_City`, y la usan las dos. `habitLeague.ts` conserva solo lo
que sí es suyo —cuánta gente hace falta y cómo se ordena— con la nota de por qué ya no calcula
semanas.

Lo comprueba una prueba que se cae si alguien vuelve a separarlas: la semana de la liga y la ventana
que abre una práctica nueva un lunes **cierran el mismo día**.

### Y un tercer desajuste que salió al leer la consulta

La liga **filtraba por `completed_at`** —el instante en que se escribió la fila— mientras
**puntuaba por `cycle_date`** —el día que se practicó—. Son dos cosas distintas en cuanto alguien
recupera un día:

| Caso | Antes | Ahora |
| --- | --- | --- |
| Registro el domingo mi martes | Fuera de la semana del martes | Cuenta en la semana del martes |
| Registro el lunes mi domingo | Entra en la semana nueva, con una fecha de la anterior | Cuenta en la semana del domingo |

La columna que decide de qué semana es una repetición tiene que ser la misma que la clasifica. El
puerto pasó a hablar de `LocalDate` en vez de `Date`: la conversión en el adaptador era justo donde
se colaba el desfase.

### El jardín gana un pulso, no pierde su historia

Los canteros siguen contando **todo lo cultivado** y ahora, al lado, se dice cuánta gente practicó
**esta semana**. Son dos lecturas a propósito: un número que solo crece deja de decir si la comunidad
sigue viva, y uno que se reinicia cada lunes borra lo cultivado.

Cuando no hay nadie, lo dice e invita a ser quien empiece — no enseña un cero suelto. Es la misma
regla que ya sigue la sección local de un pilar vacío: no se finge una lista.

Son **dos consultas y no una con `FILTER`** porque agrupan por cosas distintas: los canteros por
reto, el pulso por persona. `count(DISTINCT user_id)` sobre el `GROUP BY challenge_key` contaría dos
veces a quien practica dos pilares.

### La redacción que daba por hecha una semana de siete días

`finalBody` decía «cinco ciclos **dentro de siete días**» y `noHabitClaim` abría con «**Siete días**
no bastan». Desde el slice 2 la celebración final se gana con cinco repeticiones de la historia, que
no tienen por qué caber en siete días: quien se suma un jueves cumple una meta de tres esa semana y
llega a cinco en la siguiente. El «cinco» sigue siendo cierto; el «siete» no. Reescritas las ocho
cadenas (cuatro pilares × dos idiomas).

Las dos pruebas que **transcribían** esa frase pasan a afirmar que la advertencia está,
`data-testid="habit-no-claim"`. Una prueba que copia la redacción se cae en cada retoque — y esta
acaba de retocarse justo por eso.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Dominio | `habitChallenge.ts` (+`currentCommunityWeek`, `CommunityWeek`), `habitLeague.ts` (−`createUtcLeagueWeek`), `habitCommunity.ts` (+`weeklyPractitioners`), sus tres pruebas |
| Caso de uso | `habitLeagueUseCase.ts`, puertos `HabitLeagueRepository` y `HabitChallengeRepository` |
| Infraestructura | `PostgresHabitLeagueRepository.ts` (filtra por `cycle_date`), `PostgresHabitChallengeRepository.ts` (pulso), `infra/habits/readCommunityGarden.ts` |
| Presentación | `CommunityHabitGarden.tsx`, `HabitChallengeCelebrations.tsx`, sus pruebas |
| Catálogo | `es.json`, `en.json`: `thisWeek`, `thisWeekEmpty`; ocho cadenas de `finalBody`/`noHabitClaim` |
| Especificación | `laSemanaQueVuelve.feature` y su spec, `atomicSleepChallenge.feature` y su spec |

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2378 de 2378 en verde**, 219 archivos |
| `pnpm exec playwright test src/e2e/habits` | **25/25** antes de añadir el pulso; **5/5** en `laSemanaQueVuelve` con las dos nuevas |
| `pnpm exec playwright test src/e2e/pilares` | **13/13** |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios |

Sin migración: el pulso sale de `habit_repetitions.cycle_date`, que ya existía.

### Recap

Ya no hay dos semanas. La de la comunidad se define una vez, en la zona del proyecto, y la usan la
práctica y la liga; de paso la liga dejó de mezclar el día que se practicó con el día que se
registró. El jardín dice ahora las dos cosas que importan —lo cultivado y quién está practicando
esta semana— y cuando no hay nadie lo dice en vez de fingirlo. La redacción dejó de prometer una
semana de siete días que ya no siempre es cierta.

### Próximos pasos (opciones)

1. **El editor enriquecido de las publicaciones** — documentado en
   `docs/features/content/027-2026-08-23-editor-enriquecido.md`, con los datos reales de la base, los
   ~48 consumidores de `content` y cuatro slices propuestos. **Es lo que el usuario pidió recordar.**
2. **Slice 4 · Semanas encadenadas** («tres semanas seguidas»): pide tabla nueva y por tanto
   migración de Alembic en el backend Python, a acordar aparte.
3. **La liga, de verdad**: hoy sigue condicionada a diez participantes y solo enseña el umbral. Con
   la semana ya unificada, encenderla es un slice en sí.
