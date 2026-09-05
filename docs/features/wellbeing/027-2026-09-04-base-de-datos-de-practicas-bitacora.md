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
