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
