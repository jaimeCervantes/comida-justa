# Bitácora — Base de datos de prácticas

> Append-only. Roadmap: `027-2026-09-04-base-de-datos-de-practicas.md`.

## Slice 1 — El catálogo existe, y los cuatro pilares leen su evidencia de él (2026-09-04)

### Objetivo

Que la práctica deje de ser prosa traducida y la bibliografía deje de ser un vertedero de URLs, y
que las dos cosas queden en tablas que el sitio y el bot de Telegram puedan leer.

### Lo que se descubrió antes de escribir código, y que cambió el plan

**El bot ya piensa en pilares y no tiene con qué contestar.** Los `product_related_intents` de
`app/use_cases/messages/orchestrator.py` son literalmente los cuatro pilares, y **69 de las 92
sesiones** de `product_recommendations` pidieron uno: 48 de alimentación, 13 de sueño, 7 de
movimiento, 1 de mente. En las 69 la única respuesta disponible fue una búsqueda de productos. Su
instrucción de sistema (tabla `prompts`, 5194 caracteres) le ordena apoyarse en conocimiento
científico y no tiene ni un estudio a mano; los 484 mensajes de la base son todos de Telegram.

**`public.users` ya es una sola tabla para los dos canales**: 21 usuarios, 15 de la web (con
`email`) y 6 del bot (sólo `external_id`). Registrar una práctica desde cualquiera de los dos no
costará modelo nuevo, y por eso `practices.author_user_id` nace en esta migración.

**`categories` tiene seis raíces, no cuatro.** Además de los pilares están `cuidado_personal` y
`hogar_y_limpieza`, así que una FK directa a `categories.key` habría dejado que una práctica se
declarara pilar «hogar y limpieza». De ahí la tabla `pillars`, de cuatro filas.

**Y un defecto real que sólo se ve con el modelo delante.** El catálogo de Sueño pedía respirar
«alargando la salida del aire» (`catalogUnloadItem3`) y la nota de Mente decía explícitamente lo
contrario, citando el ensayo de 2024 y su réplica que no hallaron diferencia de HRV entre 1:1 y 1:2
(`MindGroundingAndBreath.tsx:16-20`). Es la misma práctica contradiciéndose en dos páginas porque
está escrita dos veces. Escrita una sola vez, en `sleep-slow-breathing`, no puede volver.

### Decisiones y porqué

**Seis tablas, ninguna existente tocada.** `pillars`, `studies`, `practices`,
`practice_translations`, `practice_pillars`, `practice_studies`. `habit_challenge_progress` y sus 9
inscripciones reales siguen intactas; el puente es `practices.challenge_key`.

**`practice_pillars` es N:N y no una columna.** Respirar despacio es Mente **y** es Sueño. Un índice
parcial único deja una sola primaria por práctica, que es la que decide de qué pilar es portada.

**`practice_studies` no lleva `claim`.** La afirmación que el estudio sostiene es el `summary` de la
práctica; un `claim` por par habría sido texto traducible, o sea otra tabla, para repetirlo.

**Tres columnas existen por el bot, desde la primera migración.** `pillars.bot_intent` (la
equivalencia que hoy vive en tres sitios que no se conocen), `practice_translations.embedding
vector(768)` con su índice HNSW `vector_cosine_ops` —mismo reparto y mismo modelo que
`post_translations`, nula hasta el slice 3— y `practice_translations.safety_note`, porque en un chat
la práctica llega sola y el prompt ya carga con «Avoid Strong Medical Claims».

**Los vínculos estudio→práctica no se inventaron.** Salen de los comentarios de `references.ts`, que
ya explicaban qué afirmación sostenía cada estudio añadido, y de títulos de Crossref que lo dicen sin
ambigüedad. Dos prácticas se quedaron **sin bibliografía** a propósito —la infusión sin cafeína y
notar la claridad al despertar— porque ninguno de los 116 estudios habla de eso. Una bibliografía de
adorno es peor que una lista corta.

**`design` se lee, no se deduce.** Sólo se siembra cuando el propio artículo se nombra así en su
título: 4 metaanálisis, 2 revisiones sistemáticas, 2 guías. Los otros 108 quedan nulos. Adivinar el
diseño a partir del tema habría sido fabricar autoridad, que es justo lo que este catálogo deshace.

### Desviaciones del roadmap

**Una séptima tabla, `pillar_studies` (migración 0050).** La semilla dejó al descubierto que de los
43 estudios del descanso sólo 13 sostienen una práctica concreta. Los otros 30 son bibliografía **del
pilar** —«Sleep is essential to health», la posición de la AASM— y `practice_studies` no los alcanza.
Meterlos ahí habría sido afirmar que un artículo de posición te dice qué hacer esta noche. Son dos
relaciones distintas y las dos son reales; `pillar_studies` es literalmente lo que hoy codifican los
cuatro arrays de `references.ts`. **Se consultó al usuario antes de aplicarla**, por ser migración
sobre la BD compartida.

**Los cuatro pilares leen de la base, no sólo Sueño.** El roadmap dejaba a los otros tres con
`references.ts` hasta el slice 2, pero la bibliografía quedó sembrada para los cuatro (43 · 25 · 24 ·
24) y mantener dos caminos de lectura por tres páginas no compraba nada. Lo que sigue siendo del
slice 2 no cambia: sembrar **sus prácticas** y borrar `references.ts`, que hoy sigue vivo como fuente
de la semilla.

### Archivos tocados

**Backend (`bot-whatsapp/backend`)**
- `alembic/versions/0049_2026-09-04_add_practice_catalog.py` — las seis tablas.
- `alembic/versions/0050_2026-09-04_add_pillar_studies.py` — la bibliografía del pilar.

**Esquema y datos**
- `src/infra/dataAccess/db/schema/practices.ts` — el espejo, escrito a mano.
- `src/scripts/data/practiceCatalogSeed.ts` + `.test.ts` — 4 pilares y 13 prácticas de Sueño.
- `src/scripts/seedPracticeCatalog.ts` — idempotente, `pnpm run seed:practice-catalog`.

**Dominio y caso de uso**
- `src/domain/pillars/pillarKey.ts` — `PillarKey` se mudó de la capa de presentación; `pilaresData.ts`
  lo reexporta para no tocar sus veinte importadores.
- `src/domain/practices/study.ts` + `.test.ts`.
- `src/use_cases/practices/ports/PillarBibliographyRepository.ts`.
- `src/use_cases/practices/pillarBibliographyUseCase.ts` + `.test.ts`.
- `src/infra/dataAccess/practices/PostgresPillarBibliography.ts`.

**Interfaz**
- `PillarReferences.tsx` — de lista de URLs a bibliografía con nombre; recibe datos, no los lee.
- `PillarBibliography.tsx` — la pieza que lee, como `PillarPractice` y `PillarLocal`.
- `SuenoPage`, `AlimentacionPage`, `MovimientoPage`, `MenteEspirituPage` — enchufadas.
- `es.json` / `en.json` — 7 claves nuevas en `pillars`.

**Pruebas**
- `PillarReferences.test.tsx` (7), `src/e2e/pilares/basePracticas.feature` + `.spec.ts` (10).
- Cuatro suites de página y `PillarBridges.test.tsx`: mock de la tercera frontera asíncrona.

### Comandos y resultados

```
alembic upgrade head                      0048 → 0049 → 0050
pnpm run seed:practice-catalog            4 pilares · 116/116 estudios con título · 13 prácticas
pnpm run test:run                         252 archivos, 2720 pruebas, todas en verde
pnpm run typecheck                        limpio
pnpm run lint                             limpio (tras `pnpm run format`)
pnpm exec playwright test src/e2e/pilares/basePracticas.spec.ts   10/10
pnpm exec playwright test src/e2e/pilares                          34/34
pnpm exec playwright test src/e2e/habits                           28/28
```

`pnpm run typecheck:tests` sigue con los **mismos 7 errores previos** en `typographyPlugin.test.ts`,
`radiusScale.test.ts` e `imagePriority.test.ts` (`globSync` de `node:fs`). Son ajenos a este slice.

### Lo que se escribió en la base compartida, y cómo se deshace

Siete tablas nuevas y su contenido: 4 pilares, 116 estudios, 13 prácticas con 26 traducciones, 15
filas de `practice_pillars`, 21 de `practice_studies` y 116 de `pillar_studies`. **Ninguna fila
existente se modificó ni se borró.** Para deshacerlo por completo:
`alembic downgrade 0048_2026_09_03` en `bot-whatsapp/backend`, que suelta las siete tablas.

### Recap

El catálogo existe y está poblado: cuatro pilares con su intención del bot, los 116 estudios con
título, revista y año reales de Crossref, y las trece prácticas de Sueño deduplicadas de sus
veintidós apariciones anteriores, con sus traducciones en los dos idiomas y sus veintiún vínculos a
la evidencia. Las cuatro páginas de pilar ya pintan su bibliografía desde la base: cada estudio con
su nombre en vez de una URL cruda, y los que sostienen una práctica lo dicen. Los cuatro retos
atómicos siguen funcionando sin enterarse. `references.ts` sigue en el árbol, ahora sólo como fuente
de la semilla.

### Próximos pasos (opciones)

1. **Slice 2 — los otros tres pilares.** Sembrar sus prácticas (Alimentación, Movimiento, Mente),
   pintar los cuatro `PillarCatalog` desde la base y borrar `references.ts`. Es donde muere la
   contradicción de la respiración en la interfaz, no sólo en los datos.
2. **Slice 3 — el bot responde con la práctica y cita el estudio.** `recommend_practices()` sin boost
   comercial, el sembrador de embeddings y el orquestador resolviendo la intención por
   `pillars.bot_intent`. Es el slice que justifica el modelo, y toca el repositorio del backend.
3. **Enseñar las prácticas en el sitio antes de que el bot las use.** No está en el roadmap: hoy las
   trece prácticas de Sueño están en la base y sólo se asoman como el nombre que acompaña a un
   estudio. Un índice o una sección propia las haría visibles ya.

**Pendiente del usuario:** decidir el orden entre 1, 2 y 3. Nada más está bloqueado.

---

## Arreglo previo — `typecheck:tests` nunca estuvo rota (2026-09-04)

Los 7 errores de `globSync` que arrastraban tres archivos de `src/presentation/` desde hacía
semanas **no eran un problema de código**: `package.json` declaraba `@types/node@^24.13.3`,
`pnpm-lock.yaml` lo tenía resuelto a `24.13.3`, y `node_modules` guardaba la `20.19.43`. La
instalación estaba desincronizada con el lockfile, y `fs.globSync` no existe en los tipos de la 20.

`pnpm install` bastó. `pnpm run validate` completo —biome, `typecheck`, `typecheck:tests` y las
2720 pruebas— pasa ahora en verde, así que el hook de pre-commit vuelve a servir para algo.

La lección va al bolsillo de quien venga: antes de sospechar del código, comprobar que la versión
instalada es la que el lockfile dice.

## Slice 2 — Las prácticas de los cuatro pilares, y la muerte de `references.ts` (2026-09-04)

### Objetivo

Que los cuatro pilares tengan sus prácticas como filas, no sólo Sueño, y que el archivo que
enumeraba los 116 DOIs deje de existir.

### Decisiones y porqué

**Un módulo por pilar.** `sleepPractices.ts`, `nutritionPractices.ts`, `movementPractices.ts` y
`mindPractices.ts`, con la forma común en `practiceSeed.ts` y la tabla que los junta en
`practiceCatalogSeed.ts`. Son cuatro cuerpos de contenido independientes; en un solo archivo, cada
edición de Alimentación habría chocado con cada edición de Mente.

**`references.ts` se mudó, no se copió.** Sus cuatro listas viven ahora en
`src/scripts/data/pillarBibliography.ts`, con sus comentarios intactos —son los que explican qué
afirmación sostiene cada estudio añadido, y los que se convirtieron en filas de `practice_studies`—
y sin el prefijo `https://doi.org/`, que ya escribe `doiUrl()` una sola vez. Ese archivo ya no es lo
que se pinta: es lo que siembra.

**`sleep-slow-breathing` pasó a `mind-slow-breathing`.** Su pilar primario siempre fue Mente y la
clave decía otra cosa. Un renombre no lo puede adivinar un `INSERT … ON CONFLICT (key)`: crea la
fila nueva y deja la vieja huérfana con sus traducciones y sus citas colgando. De ahí
`RETIRED_PRACTICE_KEYS`, que el sembrador recorre y borra. Vive en la semilla y no en una migración
porque son datos sembrados: quien siembre desde cero nunca creará esas filas.

**El sembrador ahora reescribe las citas, no sólo las añade.** `practice_studies` se borra y se
vuelve a insertar por práctica. Con `ON CONFLICT DO NOTHING`, quitar un DOI de la semilla lo dejaba
en la página para siempre.

**Nueve prácticas sirven a más de un pilar.** Cenar al atardecer es Alimentación y Sueño; salir al
aire libre es Movimiento y Sueño; respirar despacio es Mente y Sueño; el deporte de conjunto es
Movimiento y Mente; cuidar plantas es Mente y Alimentación. Cada una está escrita **una vez**. Eso
es lo que `practice_pillars` compró.

**Veintiuna prácticas se quedan sin bibliografía, a propósito.** La triada del plato, sus tres
componentes, la infusión sin cafeína, la gratitud… son buenas decisiones que ninguno de los 116
estudios de esta bibliografía mide. Prestarles la evidencia de los ultraprocesados o de la soledad
habría sido autoridad de segunda mano, que es justo lo que este catálogo vino a deshacer.

### Desviación del roadmap: `PillarCatalog` no entra

El roadmap prometía pintar los cuatro `PillarCatalog` desde la base «sin tablas nuevas», y eso no es
posible. Ese componente pinta **categorías** —«Anclaje de luz solar», con cuatro ítems, un impacto
en el cuerpo y un impacto en el entorno— y el modelo no tiene ni el agrupador ni los dos impactos.
Meterlo a la fuerza pedía deformar `practices` para que cupiera. Queda como slice 2b, con el modelo
que necesita descrito en el roadmap: 15 temas y 60 ítems ya escritos, trabajo de modelo y no de
contenido.

### Archivos tocados

- **Nuevos:** `src/scripts/data/pillarBibliography.ts`, `practiceSeed.ts`, `sleepPractices.ts`,
  `nutritionPractices.ts`, `movementPractices.ts`, `mindPractices.ts`.
- **Reescritos:** `practiceCatalogSeed.ts` (ahora la tabla de pilares con su bibliografía y sus
  prácticas), `seedPracticeCatalog.ts`, `practiceCatalogSeed.test.ts` (17 pruebas).
- **Borrado:** `src/app/[locale]/pilares/components/references.ts`.
- **Escenarios:** los cuatro `@slice-2` del `.feature` y ocho casos nuevos en el spec.

### Comandos y resultados

```
pnpm install                    @types/node 20.19.43 → 24.13.3
pnpm run validate               biome + typecheck + typecheck:tests + 2720 pruebas, verde
pnpm run seed:practice-catalog  4 pilares · 116/116 estudios · 45 prácticas · 1 clave retirada
pnpm run test:run               253 archivos, 2737 pruebas, todas en verde
pnpm run typecheck              limpio
pnpm run typecheck:tests        limpio (por primera vez en semanas)
playwright src/e2e/pilares      39/39
playwright src/e2e/habits       27/28 en frío; 19/19 al repetir el archivo que falló
```

El fallo de `atomicSleepChallenge.spec.ts:200` fue **flaky en frío**: el mismo archivo pasó entero
al repetirlo sin tocar nada, y ese spec no roza nada de este slice.

### Estado de la base

| Tabla | Filas |
|---|---|
| `studies` | 116 |
| `pillar_studies` | 116 |
| `practices` | 45 |
| `practice_translations` | 90 (los 45 × 2 idiomas, cero huérfanas) |
| `practice_pillars` | 54 — 45 primarias y 9 prácticas compartidas |
| `practice_studies` | 64 |

Los cuatro retos atómicos siguen ligados: `sleep-evening-to-morning`, `nutrition-real-dinner`,
`movement-living-movement` y `mind-presence-and-peace`. Para deshacerlo todo:
`alembic downgrade 0048_2026_09_03`.

### Recap

Los cuatro pilares tienen sus prácticas en la base —45, de las cuales 9 sirven a más de un pilar sin
estar escritas dos veces— y las cuatro bibliografías declaran qué práctica sostiene cada estudio.
`references.ts` ya no existe: sus listas son semilla y lo que se pinta sale de `pillar_studies`. El
catálogo por temas se queda fuera hasta decidir su modelo, y `typecheck:tests` volvió a verde.

### Próximos pasos (opciones)

1. **Slice 3 — el bot responde con la práctica y cita el estudio.** Ya tiene los cuatro pilares
   sembrados, que era lo que le faltaba. `recommend_practices()` sin boost comercial, el sembrador
   de embeddings y el orquestador resolviendo la intención por `pillars.bot_intent`.
2. **Slice 2b — el catálogo por temas.** Modelar `pillar_themes` para que `PillarCatalog` se pinte
   desde la base y mueran las 60 claves de `pillarPages.*catalog*`.
3. **Enseñar las prácticas en el sitio.** Las 45 están en la base y sólo se asoman como el nombre
   junto a un estudio. Un índice filtrable por pilar y por esfuerzo las haría visibles ya.

**Pendiente del usuario:** el orden entre las tres, y si 2b lleva tabla nueva (migración sobre la BD
compartida, o sea aprobación aparte).

---

## Slice 2c — La tabla del jardín deja de ser un podio (2026-09-05)

### Objetivo

Que la comunidad tenga una tabla que enganche —ver dónde estás, ver que otros están— sin proclamar
un ganador semanal, y con una métrica que se mueva sin premiar el volumen.

### Lo que se descubrió leyendo antes de escribir

**El marcador ya era a prueba de volumen, y la advertencia previa estaba mal enfocada.**
`buildWeeklyLeagueRanking` puntuaba días distintos, con las fechas ya `DISTINCT` cruzando los cuatro
retos: el techo era 7 y no se movía. Lo que había que decir no era «no premies volumen» sino «no
cambies la unidad sin pensarlo».

**Pero un techo de 7 hace la tabla inútil.** Con veinte personas y siete valores posibles, la tabla
ordena sin informar: casi todo son empates. Ésa era la razón real por la que no servía, y no la
ética.

**`countSustainedWeeks` ya existía y estaba mejor pensado que lo que se iba a escribir.** Su
docblock explica que **no es una racha** a propósito: romperla castigaría a quien faltó una semana y
volvió, justo lo contrario del reconocimiento `comeback` que el producto ya tiene.

**La liga nunca ha corrido.** Exige 10 inscritos y hay 1; sólo 2 personas tienen alias. La actividad
real son 3 personas, una con 8 días distintos en tres semanas.

### Decisiones y porqué

**Aportes (repeticiones) en vez de días distintos.** Da resolución —28 valores posibles por semana en
vez de 7— sin premiar intensidad, porque la base ya impone un aporte por pilar y por día. Es la
distinción que el producto necesitaba y no tenía: *amplitud sí, intensidad no*.

**Semanas sostenidas como segunda columna**, reutilizando `countSustainedWeeks`.

**Sin `rank`.** El tipo `GardenContributor` no lo tiene, y la lista es un `<ol>`: quien quiera su
posición la lee del orden. Un ganador semanal fabrica nueve perdedores por cada ganador —en salud— y
suele ganar quien tiene la vida menos caótica, que no es la conducta a premiar.

**El repositorio hace dos lecturas con un solo rango.** Los aportes se filtran a la semana; las
fechas salen enteras, porque las semanas sostenidas son históricas y quien decide qué es una semana
es `communityWeekStart`, anclado en `America/Mexico_City`. Un `date_trunc` semanal en SQL habría sido
una segunda definición de semana — exactamente el fallo que ya hubo que arreglar cuando la liga
anclaba su lunes en UTC.

### Una prueba que se cayó sola, y qué se hizo con ella

Se escribió un escenario e2e que afirmaba que la sección nunca contiene la palabra «ganador». Falló,
y con razón: la nota de ética dice «**No hay ganador**, ni corona, ni premio». La prueba encontraba
justo la frase que promete lo contrario de lo que buscaba.

La afirmación estaba en el nivel equivocado. Un podio no vuelve por Playwright: vuelve porque alguien
escribe «1er lugar» en una clave del catálogo. Así que se retiró el escenario e2e y se escribió
`gardenTableCopy.test.ts`, que recorre los **valores** de `atomicChallenges.league` en los dos
idiomas y exige que ninguno proclame a nadie, con `ethics` como única excepción — es la que puede
nombrar lo que no hay, para negarlo. Comprueba además que no queden las claves `rank` ni `points`.

### Archivos tocados

- `src/domain/habits/habitLeague.ts` — `buildGardenContributions`, `GardenContributor`,
  `LeagueParticipantActivity` con aportes y fechas. `habitLeague.test.ts` reescrito (12 pruebas).
- `src/domain/habits/gardenTableCopy.test.ts` — nuevo, 4 pruebas.
- `src/use_cases/habits/habitLeagueUseCase.ts` — `ranking` → `contributors`; `.test.ts` nuevo con 6
  pruebas, que antes no existía.
- `src/use_cases/habits/ports/HabitLeagueRepository.ts`,
  `src/infra/dataAccess/habits/PostgresHabitLeagueRepository.ts`.
- `src/app/[locale]/habitos/page.tsx` — la tabla, sin puesto escrito.
- `es.json` / `en.json` — el bloque `atomicChallenges.league` reescrito entero.
- `src/e2e/habits/atomicSleepChallenge.spec.ts` — escenario del umbral actualizado, escenario frágil
  retirado.

### Comandos y resultados

```
pnpm run validate                255 archivos, 2750 pruebas, verde
playwright src/e2e/habits        28/28
```

`.next` quedó con un `dev/types/validator.ts` a medio escribir tras una corrida de Playwright y
tumbó el `typecheck` con errores de sintaxis dentro de un archivo generado. `rm -rf .next` y listo;
no era del código.

### Recap

La tabla del jardín existe y mide lo correcto: aportes de la semana con tope de uno por pilar y día,
más semanas sostenidas que nunca bajan. No hay puesto, ni corona, ni premio, y hay una prueba sobre
el catálogo de textos que impide que vuelvan. Sigue detrás del umbral de 10 y del alias, así que hoy
no se ve — que es lo correcto con 3 personas practicando.

### Próximos pasos (opciones)

1. **El índice de prácticas con sus anclas.** Las 45 necesitan superficie, y las anclas (`cue`,
   `identity`, `minimum`) necesitan dónde verse.
2. **El bot.**
3. **`user_practices`**, donde la regla «un aporte por pilar y día» deja de ser teoría.

**Pendiente del usuario:** nada. Se sigue de corrido.

---

## Slice 2d — Las anclas de las prácticas, y el índice donde se ven (2026-09-05)

### Objetivo

Que las 45 prácticas dejen de ser un consejo y sean un hábito: que digan **cuándo** se hacen y qué
basta para que cuenten, y que tengan una página donde verse.

### El diagnóstico que lo motivó

Contra las cuatro leyes que este producto se comprometió a seguir, el catálogo cumplía media:

| Ley | Los 4 rituales | Las 45 prácticas, antes |
|---|---|---|
| Obvio (cuándo) | Dos anclas explícitas | **5 de 45** |
| Atractivo (identidad) | 4 frases en primera persona | 0 |
| Fácil (versión mínima) | «El mínimo que cuenta» | `effort_minutes` en 12 de 45 |
| Satisfactorio (recompensa) | Celebración, niveles, jardín | nada |

«Penumbra total» es un buen consejo. No es un hábito hasta que dice cuándo.

### Decisiones y porqué

**Dos columnas, no tres.** `cue` y `minimum` entran; `identity` **no**. La identidad es del pilar, no
de la práctica, y las cuatro frases ya existen y ya están traducidas. Una columna por práctica habría
pedido escribir 45 identidades donde hay 4 verdaderas y 90 filas de texto para repetir la misma
frase. La página la lee del pilar.

**`minimum` nulo no significa «no tiene mínimo»**: significa que la práctica entera ya lo es. Una
infusión no tiene una versión más pequeña. Se escribió en las 15 compuestas, quedó nulo en las 30
que ya son mínimas.

**Ningún ancla es una hora del reloj.** «Al apagar la luz, mirando qué sigue encendido», «cuando
alcances las llaves del coche», «cuando notes que se te aprieta la mandíbula». Es la misma razón por
la que el primer ritual se negó a fijar «tomar el sol a las 6 p. m.»: un ancla es un momento de la
vida de alguien, no del reloj.

**El ancla se pinta arriba del título.** Quien recorre la lista buscando qué empezar lee *cuándo*
antes que *qué*. Hay una prueba que lo afirma comparando las dos posiciones en el texto de la
tarjeta, para que un rediseño no lo invierta sin querer.

**Las 45 anclas se aplicaron con un script y una tabla, no a mano.** Son 90 textos: a mano, la
probabilidad de dejar una práctica sin ancla o de pegarla en la de al lado es alta, y un ancla
equivocada es peor que ninguna. El script falla si sobra o falta una clave.

**`pillarColorClasses` se promovió** a `src/presentation/habits/pillarColors.ts`. La segunda ruta que
lo quería tendría que haber importado de `app/[locale]/pilares/`, y eso es lo que `AGENTS.md`
prohíbe. `pilaresData.ts` lo reexporta para no tocar a sus importadores.

### Dos defectos que cazaron las pruebas

**El agregado de pilares traía uno solo.** La consulta fundía en un JOIN el recorrido de todos los
pilares de una práctica con la selección del primario: `JOIN pillars pl ON pl.key = pp.pillar_key AND
pp.is_primary`. Esa condición filtraba también el `array_agg`, así que la práctica compartida salía
con un único pilar y su tarjeta no anunciaba ningún puente — el modelo N:N funcionando en la base e
invisible en la página. Lo cazó el escenario de la práctica compartida, que existe exactamente para
eso. Ahora son dos JOINs: `pp` recorre, `main` selecciona.

**Un comentario rompió el SQL.** El comentario que explicaba lo anterior se escribió con backticks
alrededor de los nombres de tabla, dentro de un template literal de `sql`. Cerró la plantilla y los
seis escenarios fallaron a la vez. Los comentarios dentro de `sql` van con `--` y sin backticks.

### Archivos tocados

- **Backend:** `alembic/versions/0051_2026-09-05_add_practice_anchors.py`.
- **Semilla:** `practiceSeed.ts` (tipos), las cuatro listas de prácticas con sus 45 anclas,
  `seedPracticeCatalog.ts`.
- **Dominio:** `practiceCard.ts` + `.test.ts` (3 pruebas).
- **Caso de uso:** `practiceCatalogUseCase.ts` + `.test.ts` (5), su puerto.
- **Infra:** `PostgresPracticeCatalog.ts`, espejo de Drizzle.
- **Rutas:** `/practicas` registrada en `routing.ts`; `page.tsx` y `ui/PracticeCardItem.tsx`
  + `.test.tsx` (7 pruebas).
- **Presentación:** `pillarColors.ts` promovido.
- **Enlace de entrada:** `PilaresOverviewPage` — una página a la que sólo se llega escribiendo la
  URL no está entregada, y hay un escenario que lo comprueba.
- `es.json` / `en.json`: namespace `practicesIndex` y `pillarsOverview.seeAllPractices`.

### Comandos y resultados

```
alembic upgrade head              0050 → 0051
pnpm run seed:practice-catalog    90 traducciones · 90 con ancla · 30 con mínimo
pnpm run validate                 258 archivos, 2765 pruebas, verde
playwright indiceDePracticas       6/6
playwright src/e2e/pilares        45/45
```

### Recap

Las 45 prácticas tienen ancla en los dos idiomas, 15 tienen además su versión mínima, y todas viven
en `/practicas` agrupadas por pilar con la identidad del pilar delante. La práctica compartida
aparece una sola vez y dice a qué otro pilar sirve. Tres de las cuatro leyes están cubiertas; la
cuarta —satisfactorio— es seguimiento, o sea `user_practices`.

### Próximos pasos (opciones)

1. **El bot** (slice 3): ya tiene los cuatro pilares sembrados y ahora también las anclas, que son
   justo lo que un chat necesita para dar un consejo accionable.
2. **`user_practices`** (slice 4): cierra la cuarta ley y hace real la regla del aporte por pilar y
   día.
3. **Slice 2b**, el catálogo por temas, que sigue pendiente de decidir su modelo.

**Pendiente del usuario:** nada. Se sigue de corrido.

---

## Slice 3 — El bot contesta con la práctica y cita el estudio (2026-09-05)

### Objetivo

Que las 69 de cada 92 sesiones que piden un pilar dejen de recibir sólo una lista de productos.

### Lo que se construyó

**`recommend_practices` (migración 0052).** Espejo de `recommend_posts` con una diferencia que es de
producto y no de SQL: **no hay boost comercial**. `recommend_posts` multiplica por membresía y por
anuncios pagados porque ordena un catálogo en venta; una práctica no lo está, y aplicarle la puja
sería vender consejo de salud al mejor postor. Tampoco filtra por cercanía: dónde vives decide qué se
te puede recomendar comprar, no si te conviene atenuar la casa antes de dormir.

**Los embeddings, sembrados desde el sitio.** `pnpm run backfill:practice-embeddings`, con
`GeminiEmbeddingService` — el mismo modelo y las mismas 768 dimensiones que `post_translations`.
Otro modelo no fallaría: devolvería vecinos absurdos, que es peor. 90 de 90 vectorizadas.

El documento que se vectoriza lleva **el ancla y el mínimo** además del título y la promesa, porque
quien escribe al bot describe un momento —«no puedo dormir»— más a menudo que un tema. Un vector que
sólo conozca el título encuentra la práctica por su nombre, que es justo lo que quien pregunta no
sabe todavía. La advertencia se queda fuera: es idéntica dentro de un pilar y acercaría entre sí a
todas sus prácticas.

**`PracticeAdvisor`** en el backend. Resuelve la intención a pilar con un `JOIN` sobre
`pillars.bot_intent` en vez de con la lista de literales, ofrece **una** práctica y no tres —quien
escribe a las once de la noche no quiere elegir— y lleva umbral de distancia, porque sin él «¿a qué
hora abren?» devuelve la menos lejana de las cuarenta y cinco como si viniera a cuento.

**El mensaje** pone el *cuándo* antes del *cómo*, cita título y año con enlace al DOI, y arrastra
siempre la advertencia: en un chat la práctica llega sola.

### La decisión que más importa: todo el camino es opcional

Si el repositorio no está inyectado, si el pilar no se reconoce, si nada queda bajo el umbral o si la
consulta revienta, el bot contesta **exactamente como antes**. `practice_repo` es un parámetro con
valor por omisión y el `advise` entero está envuelto en un `try`. Este cambio no puede dejar sin
servicio a los 484 mensajes que ya funcionaban.

### Comprobación de extremo a extremo

`tests/integration_practice_probe.py` —a mano, porque necesita la base sembrada y una clave de
Gemini— con cinco preguntas reales:

| Pregunta | Práctica ofrecida |
|---|---|
| «no puedo dormir, me despierto a media noche» | Un cuarto fresco y ventilado, citando el estudio de ambiente térmico (2012) |
| «me la paso sentado todo el día» | Dos minutos de pie cada cincuenta, con los tres estudios de interrumpir la silla |
| «me siento muy solo últimamente» | Darle presencia real a alguien, con el metaanálisis de soledad y mortalidad |
| «llego tarde y termino cenando cualquier cosa» | Cenar al atardecer, con los dos de crononutrición |
| «¿a qué hora abren?» | ninguna — la intención no es de pilar |

### Comandos y resultados

```
alembic upgrade head                        0051 → 0052
pnpm run backfill:practice-embeddings       90 de 90 vectorizadas
pytest tests/unit/test_practice_advisor.py  11/11
pytest tests                                139 pasan · 2 fallan (previos)
ruff check app tests                        limpio
```

Los dos fallos de `test_search_golden.py` son **previos**: 210 productos siguen sin embedding en la
base compartida y nada de este slice los toca. Comprobado con `git stash`.

`ruff format` reformateó de paso seis archivos ajenos al slice; se revirtieron. El repositorio no
está formateado con ruff de punta a punta, así que correr el formateador sobre todo `app` mete ruido
de otros en el diff: conviene acotarlo a los archivos tocados.

### Recap

El bot ya puede contestar lo que lleva 484 mensajes sin poder contestar: una práctica concreta, con
su ancla, lo que basta para que cuente, y el estudio real que la sostiene. La búsqueda de productos
no desaparece — se queda después, que es donde le toca: primero qué hacer, después qué hay cerca para
hacerlo.

### Próximos pasos (opciones)

1. **`user_practices`** (slice 4): cierra la cuarta ley —satisfactorio— y hace real la regla del
   aporte por pilar y día. Es también lo que permite registrar desde Telegram y ver en la web.
2. **Slice 2b**, el catálogo por temas.
3. **Afinar el umbral** con conversaciones reales: 0.45 salió de las cinco preguntas de la sonda, no
   de datos.

**Pendiente del usuario:** revisar el desplegado del bot. El código está commiteado en
`feat/practice-catalog` del backend, sin push y sin desplegar.

---

## Slice 4 — Registrar una práctica (2026-09-05)

### Objetivo

Que una práctica del catálogo se pueda empezar y dejar. Sin eso, las 45 son una lista de deseos.

### Decisiones y porqué

**Dejar una práctica no borra la fila.** Se marca `stopped_at`. Dejarla es información —alguien que
empezó tres y sostiene una está diciendo algo que un `DELETE` borraría— y sobre todo: volver es lo
que este producto premia por encima de todo, y para premiarlo hay que saber que ya se había empezado
antes. Volver hace `ON CONFLICT DO UPDATE SET stopped_at = NULL` **sin tocar `started_at`**: la
primera vez que alguien empezó algo no se sobrescribe. Por eso la clave primaria es el par
`(user_id, practice_id)` y no un uuid.

**`source` guarda por dónde entró, no a quién pertenece.** Es información de producto —¿sirve el chat
de puerta de entrada?— y no una partición: nada filtra por él, y la fila se ve igual desde los dos
canales porque `public.users` ya es una sola tabla.

**El repositorio sólo inscribe en prácticas publicadas.** El `INSERT … SELECT … WHERE status =
'published'` es lo que impide inscribir a nadie en una práctica retirada aunque le manden la clave a
mano: sin fila que seleccionar no hay inserción, y `rowCount` en cero se devuelve como `false`.

**El catálogo se lee entero sin sesión.** `activeFor(null)` devuelve un conjunto vacío y ni siquiera
consulta la base. Si exigiera identidad, la página tendría que tener dos versiones.

**Empezar y dejar tienen el mismo peso visual.** Dejar no se esconde detrás de un menú: un botón
difícil de encontrar sólo consigue que la gente deje de practicar sin decirlo.

### Lo que este slice deliberadamente no hace

**No cuenta repeticiones.** Adoptar una práctica y practicarla un día son dos cosas distintas, y la
segunda ya tiene su tabla: `habit_repetitions`, cuyo índice único por persona, reto y fecha es
exactamente lo que impone «un aporte por pilar y por día».

Que el catálogo escriba ahí implica decidir que marcar una práctica de sueño **cuenta como haber
practicado el pilar del sueño**, e inscribe a esa persona en el ritual del pilar. Es coherente y es
lo que el jardín ya mide, pero es una decisión de producto y no un detalle de implementación: se
documentó como slice 4b en el roadmap en vez de colarse dentro de una migración.

### Archivos tocados

- **Backend:** `alembic/versions/0053_2026-09-05_add_user_practices.py`.
- **Dominio:** `practices/adoption.ts` + `.test.ts` (5 pruebas).
- **Caso de uso:** `practiceAdoptionUseCase.ts` + `.test.ts` (5), su puerto.
- **Infra:** `PostgresPracticeAdoption.ts`, espejo de Drizzle (`userPractices`).
- **Rutas:** `practicas/practiceActions.ts` (server action), `page.tsx` y `ui/PracticeCardItem.tsx`
  con cuatro pruebas nuevas (11 en total).
- **e2e:** `practicasPropias.spec.ts` (5 escenarios, con sesión real y limpieza en `afterEach`).
- `es.json` / `en.json`: cinco claves en `practicesIndex`.

### Comandos y resultados

```
alembic upgrade head                            0052 → 0053
pnpm run validate                               260 archivos, 2779 pruebas, verde
playwright practicasPropias                     5/5
playwright src/e2e/pilares                      50/50
```

### Lo que se escribió en la base compartida

Una tabla nueva, `user_practices`, vacía salvo lo que la e2e crea y borra en su `afterEach`. Ninguna
fila existente se tocó. Para deshacerlo: `alembic downgrade 0052_2026_09_05`.

### Recap

Cualquiera de las 45 prácticas se puede empezar y dejar desde `/practicas`, privada por omisión, y
volver reabre la misma adopción conservando desde cuándo. El catálogo sigue siendo público. Falta
marcar el día para cerrar la cuarta ley, y esa es una decisión de producto documentada como 4b.

### Próximos pasos (opciones)

1. **Slice 4b** — marcar el día reutilizando `habit_repetitions`. Cierra la cuarta ley y hace real
   la regla del aporte por pilar y día.
2. **Slice 2b** — el catálogo por temas.
3. **Slice 5** — compartir la práctica en el muro.

**Pendiente del usuario:** decidir 4b (si marcar una práctica de un pilar inscribe en el ritual de
ese pilar) y desplegar el bot.

---

## Slice 4 (cierre) — «Mis prácticas», y por qué 2b se paró (2026-09-05)

### Lo adoptado se ve donde la gente busca lo suyo

`/practicas` deja empezar y dejar, pero quien vuelve al día siguiente no entra al catálogo: entra a
«Mis hábitos». Ahora esa pantalla lista lo que lleva.

**Enseña el ancla y no la promesa.** Quien vuelve no necesita que le convenzan otra vez de que
atenuar la casa ayuda: necesita acordarse de *cuándo* lo hace. La promesa vive en `/practicas`, que
es donde se elige.

**Sin ninguna, la sección no se esconde**: invita al catálogo. Una sección que desaparece deja a
quien todavía no ha empezado sin saber que existe.

**Se compone de dos lecturas que ya existían** —el catálogo memorizado y el conjunto de claves
adoptadas— en vez de una consulta nueva. Un tercer SQL que uniera `user_practices` con
`practice_translations` diría lo mismo y se desincronizaría el día que el catálogo cambie de orden o
de idioma de respaldo.

### Por qué el slice 2b se paró antes de escribir la migración

Al preparar la semilla de los 15 temas apareció algo que invalida el plan: **`PillarCatalog` sirve a
dos modelos distintos**.

En Sueño, Movimiento y Mente sus ítems son **acciones** —«Ir al mercado caminando», «Primera y última
hora del día sin teléfono»— y mapean a prácticas. En Alimentación son **ingredientes**: «Leguminosas
locales: frijol negro, bayo o pinto y lentejas a granel», «Camote, yuca y papa de agricultores
cercanos».

Un ingrediente no tiene ancla, ni versión mínima, ni se puede empezar ni dejar. La deduplicación del
slice 2 ya lo había hecho evidente sin que se notara: las cuatro categorías de ingredientes acabaron
como cuatro prácticas de una frase, mientras las de los otros pilares absorbían varios ítems cada
una.

Construirlo igual habría significado inventar dieciséis «prácticas» que son una lista de compra.
Preferí parar y dejar la decisión escrita en el roadmap con sus tres opciones, en vez de deformar el
modelo a las tres de la mañana para que cupiera una plantilla.

### Comandos y resultados

```
pnpm run validate                261 archivos, 2782 pruebas, verde
playwright practicasPropias      7/7
playwright src/e2e/habits        28/28
```

### Recap

El slice 4 está completo de punta a punta: se empieza y se deja desde `/practicas`, y lo adoptado
aparece en «Mis hábitos» con su ancla. El 2b está parado a propósito, con el hallazgo documentado y
tres opciones sobre la mesa.

### Próximos pasos (opciones)

1. **Slice 4b** — marcar el día. Cierra la cuarta ley. Necesita decidir si marcar una práctica de un
   pilar cuenta como haber practicado ese pilar (recomiendo que sí: es lo que el jardín ya mide).
2. **Slice 2b** — decidir cuál de las tres opciones del roadmap.
3. **Slice 5** — compartir en el muro; depende de 4b.

**Pendiente del usuario:** las dos decisiones de arriba, y desplegar el bot.

---

## Slice 4b — Marcar el día, y la corrección del diagnóstico de 2b (2026-09-05)

### Objetivo

Cerrar la cuarta ley: que practicar deje huella. Aprobado por el usuario con la condición que se
había planteado — marcar una práctica de un pilar cuenta como haber practicado ese pilar.

### Decisiones y porqué

**Sin tablas nuevas.** La repetición se escribe en `habit_repetitions` con el `challenge_key` del
pilar primario de la práctica. Con eso el jardín, la tabla de aportes, los niveles y las
celebraciones funcionan sin tocarse, y `uq_habit_repetitions_local_cycle` —único por persona, reto y
fecha— impone la regla del aporte por pilar y día sin una línea de código. Era el objetivo desde que
se diseñó la tabla de aportes; aquí simplemente se cobra.

**`recordPracticeDay` se extrajo de `completeCheckIn`, no se duplicó.** Lo único propio del ritual
era la comprobación de sus dos anclas —cerrar la noche, abrir la mañana—; la ventana, la fecha, la
repetición y el reconocimiento los comparte con cualquier otra forma de practicar el pilar. Pasar
las anclas del ritual como ciertas desde el catálogo habría sido mentir en la base para que cuadrara
una firma; cada práctica tiene su propio mínimo, en `practice_translations.minimum`.

**El pilar se resuelve contra la base.** El formulario manda la clave de la práctica y nada más:
a qué pilar apunta la repetición no lo decide quien envía el formulario.

**«Hoy» es la fecha local de la comunidad.** Ni la del navegador ni la del servidor. La semana de la
práctica ya está anclada en `America/Mexico_City`, y una segunda definición de «hoy» haría que el
botón y el conteo discreparan al filo de la medianoche — que es exactamente el fallo que ya hubo que
arreglar cuando la liga anclaba su lunes en UTC. Hay una prueba con `2026-08-24T00:30:00Z`, que en
México todavía es domingo.

**Cuando el pilar ya cuenta, el botón desaparece y se explica la regla:** «Hoy ya cuenta. Un pilar
suma una vez al día, hagas una práctica o cinco». Esconder que el segundo clic no hace nada dejaría
creer que marcar cinco prácticas vale por cinco — justo la lectura que la tabla del jardín evita.
La regla se aprende usándola.

### La corrección sobre el slice 2b

El usuario cuestionó el diagnóstico de «dos modelos» y tenía razón. Al volver a los datos:

- Los cuatro ítems de *Proximidad y pausas activas* (Movimiento) son **tres acciones distintas**, que
  ya están sembradas como `movement-no-motor`, `movement-break-the-chair` y
  `movement-take-the-stairs`.
- Los cuatro ítems de *Proteínas de calidad* (Alimentación) son **cuatro opciones de una sola
  acción**, y esa acción también está sembrada: el `how_to` de `nutrition-regional-protein` es
  literalmente «leguminosas a granel, huevo de granja cercana, pesca local sustentable o aves de
  pastoreo».

No son dos modelos: es **el mismo a dos granularidades**. Todos son acciones; las de Alimentación
están escritas más gruesas, con sus opciones dentro. Así que **una sola tabla basta**:
`pillar_themes` + `pillar_theme_translations` (título y los dos impactos) y un `theme_id` nulable en
`practices`. Los temas de Alimentación tendrán 1-2 prácticas en vez de 3-5, y eso es cómo se escribió
el contenido, no una distorsión.

Queda escrito en el roadmap. Lo que **no** haría es promover las cuatro opciones a cuatro prácticas:
«comer frijol» y «comer huevo de granja» no son cuatro hábitos, son cuatro maneras de hacer uno, y
partirlos inflaría el catálogo con casi-duplicados y rompería el «elige una práctica».

### Archivos tocados

- `habitChallengeUseCase.ts` — `recordPracticeDay` extraído; `completeCheckIn` lo llama.
- `practiceActions.ts` — `markPracticeDone`.
- `PracticeCatalogRepository` / `PostgresPracticeCatalog` — `findPrimaryPillar`.
- `PracticeAdoptionRepository` / `PostgresPracticeAdoption` — `pillarsPractisedOn`.
- `practiceCatalogUseCase.ts` (`primaryPillarOf`) y `practiceAdoptionUseCase.ts`
  (`pillarsPractisedToday`), con sus pruebas (5 nuevas).
- `PracticeCardItem` — botón de marcar y su explicación; 4 pruebas nuevas (15 en total).
- `practicasPropias.spec.ts` — 3 escenarios nuevos (10 en total).

### Comandos y resultados

```
pnpm run validate                261 archivos, 2791 pruebas, verde
playwright practicasPropias      10/10
playwright src/e2e/habits        28/28
```

El escenario que importa: adoptar dos prácticas de descanso, marcar una, y comprobar que la otra ya
no ofrece marcar y que `habit_repetitions` tiene **una** fila.

### Recap

Practicar deja huella y alimenta lo que ya existía: el jardín, la tabla de aportes y los niveles.
La regla del aporte por pilar y día dejó de ser una intención documentada y es lo que la base impone.
Las cuatro leyes están cubiertas.

### Próximos pasos (opciones)

1. **Slice 2b** con el modelo corregido: una sola tabla de temas para los cuatro pilares.
2. **Slice 5** — compartir la práctica en el muro, que ya tiene todo lo que necesita.
3. **Que el bot pueda marcar el día**, que es lo que haría real el `source = 'telegram'`.

**Pendiente del usuario:** desplegar el bot. Nada más.

---

## Slice 2b — El catálogo por temas, con el modelo corregido (2026-09-05)

### Objetivo

Que los cuatro `PillarCatalog` se pinten desde la base y mueran las claves de i18n que los
alimentaban.

### El modelo, después de la corrección

`pillar_themes` (clave, pilar, orden) + `pillar_theme_translations` (título y los dos impactos) +
un `theme_id` nulable en `practices`. **Una sola tabla para los cuatro pilares**, no dos como se
había planteado: ver la corrección del diagnóstico en la entrada anterior.

Los temas de Alimentación agrupan una o dos prácticas y los de Movimiento tres. No es una
distorsión: los cuatro «ítems» de *Proteínas de calidad* son cuatro opciones de una sola acción y ya
viven dentro de su `how_to`, mientras que los de *Proximidad y pausas activas* son tres acciones
distintas y ya estaban sembradas por separado.

**`theme_id` nulable significa «esta práctica no vive en el catálogo»**, no «falta clasificar». Los
cuatro rituales quedan fuera —son la insignia del pilar— y hay una prueba que lo afirma.

**La invariante que la base no puede afirmar** —que el tema de una práctica pertenece al pilar del
que esa práctica es portada— la comprueba la semilla, fila por fila: haría falta comparar contra
`practice_pillars`, y una FK no llega ahí.

### Lo que cambió en la página

Los ítems de cada tarjeta son ahora **los nombres de las prácticas**, y la tarjeta enlaza a
`/practicas`. Antes eran frases sueltas que repetían con otras palabras lo que la práctica ya dice;
mantenerlas desde que el catálogo es dato habría sido una segunda redacción del mismo contenido — y
ya se vio a dónde lleva eso: la respiración se contradecía consigo misma en dos páginas.

El encabezado, la entradilla y las dos etiquetas se quedan en i18n: son el marco de la sección, no su
contenido, y una tabla para cuatro filas de texto de página no compraba nada.

### Lo que se borró

- Cuatro componentes: `SleepPracticeCatalog`, `NutritionIngredientCatalog`, `MovementCatalog`,
  `MindPracticeCatalog`.
- **105 claves de i18n por idioma** (210 en total). `pillarPages` pasa de 338 a 236 claves.

### Las pruebas que se movieron, y por qué

Las cuatro pruebas de «el catálogo de X» vivían dentro de las pruebas de página y comprobaban el
contenido contra el catálogo de idiomas. Desde que los temas viven en la base, afirmarlas desde la
página exigiría montar una conexión para comprobar una decisión de presentación. Se mudaron a
`PillarCatalog.test.tsx` con temas fijos — los reales de la semilla del descanso.

**El doble de `PillarCatalogSection` pinta el encabezado que recibe.** Un doble vacío habría hecho
fallar las pruebas del inglés, que comprueban que la página le pasa el encabezado traducido: aislar
la lectura no debe llevarse por delante el contrato.

### Comandos y resultados

```
alembic upgrade head             0053 → 0054
pnpm run seed:practice-catalog   15 temas, 33 prácticas asignadas
pnpm run validate                262 archivos, 2790 pruebas, verde
playwright src/e2e/pilares       55/55
playwright src/e2e/habits        28/28
```

### Recap

El catálogo de los cuatro pilares sale de la base. `references.ts` murió en el slice 2 y los cuatro
componentes de catálogo mueren aquí; de las 338 claves de `pillarPages` quedan 236, y las que quedan
son prosa de artículo, no listas.

### Próximos pasos (opciones)

1. **Slice 5** — compartir la práctica en el muro. Tiene ya todo lo que necesita.
2. **Que el bot marque el día**, que es lo que haría real el `source = 'telegram'`.
3. **Las secciones sueltas de cada pilar** —santuario, triada, cadencia, ventanas de silencio— son
   las últimas listas de acciones que siguen en i18n. Mismo tratamiento que el catálogo.

**Pendiente del usuario:** desplegar el bot.
