# Base de datos de prácticas

> Roadmap de slices. La bitácora vive en `027-2026-09-04-base-de-datos-de-practicas-bitacora.md`.
> Escenarios: `src/e2e/pilares/basePracticas.feature`.
>
> **Dos aplicaciones, una base.** El sitio (`comida-justa`, Next.js) y el bot de Telegram
> (`bot-whatsapp/backend`, Python) comparten Postgres. Este modelo se diseña para los dos a la vez.

## El problema

Hoy **no existe el objeto «práctica»**. Existe prosa traducida en un repositorio y una bibliografía
suelta, y el bot no puede leer ninguna de las dos.

### En el sitio: la misma acción escrita seis veces

Salir a recibir luz al despertar vive en `atomicSleepChallenge.ritualStep1`, en
`atomicSleepChallenge.morningDescription` y en `pillarPages.sleep.catalogLightItem1`. El teléfono
fuera del cuarto, en `sanctuaryPhoneBody`, en `catalogEnvironmentItem1` y en `ritualStep4`. Los
cinco minutos de libreta, en `unloadHowBody`, en `catalogUnloadItem1` y en `ritualStep3`. Tres
copias por idioma, y ninguna sabe de las otras.

**Ya se desincronizaron.** El catálogo de Sueño pide respiración pausada «alargando la salida del
aire sin forzar» (`catalogUnloadItem3`). La nota de Mente dice explícitamente lo contrario, y
explica por qué: el ensayo de 2024 y su réplica no hallaron diferencia de HRV entre 1:1 y 1:2
(`MindGroundingAndBreath.tsx:16-20`). Es la misma práctica contradiciéndose a sí misma en dos
páginas. Ninguna revisión lo iba a ver; solo lo ve el modelo.

### En el bot: tres de cada cuatro conversaciones piden un pilar, y contesta con un catálogo

Los `product_related_intents` del orquestador **son los cuatro pilares** literalmente
(`app/use_cases/messages/orchestrator.py`):

```python
product_related_intents = [
    "Find product or service",
    "Sleep and rest",                        # ← pilar 1
    "Natural and nutritious food",           # ← pilar 2
    "Conscious movement and exercise",       # ← pilar 3
    "Emotional and psychological health",    # ← pilar 4
]
```

Y lo único que sabe hacer con esa intención es **una búsqueda semántica de productos**. Las
sesiones reales de `product_recommendations`:

| Intención | Sesiones |
|---|---|
| Natural and nutritious food | 48 |
| Find product or service | 23 |
| Sleep and rest | 13 |
| Conscious movement and exercise | 7 |
| Emotional and psychological health | 1 |

**69 de 92 sesiones fueron sobre un pilar** —el 75 %— y en las 69 la única respuesta disponible fue
algo que comprar. Los 484 mensajes de la base son todos de Telegram.

Peor: su instrucción de sistema (tabla `prompts`, 5194 caracteres) le ordena

> **IMPORTANT**: it is very important to use the scientific knowledge to guide your advice.

y **no tiene ni un solo estudio a mano**. Los 116 DOIs curados viven en un array de TypeScript del
otro repositorio. El bot cumple esa instrucción improvisando con los pesos del modelo, mientras el
sitio tiene la bibliografía y no se la puede prestar.

### Las cuatro fricciones

1. **No se ve la evidencia.** 116 DOIs pintados como URLs crudas en el sitio; cero en el bot. El
   vínculo estudio → afirmación existe solo como comentario de código (`references.ts:56-63`).
2. **No se puede elegir.** Cada pilar ofrece una sola práctica seguible; las otras ~13 de Sueño
   están enterradas en prosa.
3. **Cuesta añadir una.** Un componente y ~20 claves en dos idiomas, y el bot no se entera igual.
4. **No se reutilizan.** Respirar despacio es Sueño **y** es Mente, escritas dos veces.

## El ahorro

Una práctica se escribe **una vez** y aparece donde haga falta: el ritual, el catálogo, el índice,
el feed y **la respuesta del bot**. La evidencia deja de ser un vertedero de URLs y pasa a ser lo
que sostiene cada promesa, citable en los dos canales. Y las prácticas dejan de ser contenido de un
repositorio para ser datos, que es la única forma de que alguien las adopte, las siga y las
comparta desde donde esté.

## El porqué

El destino es que una práctica se pueda **registrar por usuario y compartirse con la comunidad**,
estilo red social — y que dé igual si quien la registra entró por la web o por Telegram.

Eso ya es posible sin modelo nuevo, y es el hallazgo que ordena todo el diseño: **`public.users` es
una sola tabla para los dos canales**. De los 21 usuarios, 15 vienen de la web (tienen `email`) y 6
del bot (solo `external_id`, que es su id de Telegram). `user_practices.user_id` sirve a los dos sin
una línea extra.

## Modelo

Siete tablas nuevas en el slice 1 (seis en la 0049 y una en la 0050), más dos columnas en la 0051 y
la función `recommend_practices` en la 0052. Ninguna tabla existente se toca.

```
pillars                 4 filas. Ancla de la FK y traductor de intenciones.
  key           text PK              'sleep' | 'nutrition' | 'movement' | 'mindSpirit'
                                     (el vocabulario del pilar, no el del reto: ver pillarKey.ts)
  category_key  text UNIQUE  FK → categories.key
  slug          text UNIQUE          'sueno', 'alimentacion', …
  bot_intent    text UNIQUE NULL     'Sleep and rest', 'Natural and nutritious food', …
  sort_order    int

studies                 116 filas.
  id       uuid PK
  doi      text UNIQUE               '10.1037/xge0000374', sin el prefijo https://doi.org/
  title    text
  journal  text NULL
  year     smallint NULL
  design   text NULL   CHECK in ('rct','meta_analysis','systematic_review',
                                 'cohort','cross_sectional','mechanism','guideline')

practices
  id              uuid PK
  key             text UNIQUE         'sleep-mental-unload'
  challenge_key   text UNIQUE NULL    el puente con los 4 retos que ya existen
  effort_minutes  smallint NULL       NULL = no se mide en minutos
  cost_level      smallint NULL       0 gratis · 1 poco · 2 compra
  author_user_id  text NULL FK → users.id ON DELETE SET NULL
  status          text  CHECK in ('draft','published','retired')
  published_at    timestamptz NULL
  created_at      timestamptz

practice_translations   mismo patrón que post_translations y category_translations
  practice_id  uuid FK → practices.id ON DELETE CASCADE
  locale       text
  title        text
  summary      text            la promesa en una frase
  cue          text NULL       cuándo y dónde (0051). Nunca una hora del reloj
  how_to       text NULL       cómo se hace
  minimum      text NULL       qué basta (0051). Nulo = la práctica entera ya es mínima
  safety_note  text NULL       la advertencia que tiene que viajar con ella
  embedding    vector(768)     NULL   gemini-embedding-001, igual que post_translations
  UNIQUE (practice_id, locale)

practice_pillars        N:N — esto es lo que arregla la fricción 4
  practice_id  uuid FK → practices.id ON DELETE CASCADE
  pillar_key   text FK → pillars.key
  is_primary   boolean
  PK (practice_id, pillar_key)

practice_studies        N:N — esto es lo que arregla la fricción 1
  practice_id  uuid FK → practices.id ON DELETE CASCADE
  study_id     uuid FK → studies.id  ON DELETE RESTRICT
  PK (practice_id, study_id)

pillar_studies          añadida en el slice 1 (migración 0050); ver más abajo
  pillar_key   text FK → pillars.key ON DELETE CASCADE
  study_id     uuid FK → studies.id  ON DELETE RESTRICT
  sort_order   int
  PK (pillar_key, study_id)
```

### Por qué `pillar_studies` además de `practice_studies`

Lo descubrió la semilla, no el diseño: de los 43 estudios del descanso **sólo 13 sostienen una
práctica concreta**. Los otros 30 son bibliografía del pilar —«Sleep is essential to health», la
posición de la AASM— y explican por qué el pilar existe, no qué hacer esta noche. `practice_studies`
no los alcanza, y forzarlos ahí habría sido afirmar que un artículo de posición te da una
instrucción.

Son dos relaciones y las dos son reales. La segunda es, literalmente, lo que hoy codifican los cuatro
arrays de `references.ts`, y por eso es lo que permite borrarlo en el slice 2. N:N y no una columna
`studies.pillar_key` porque ya hay un contraejemplo sembrado: `10.1073/pnas.2301608120` vive en la
bibliografía de Movimiento y sostiene dos prácticas de Sueño.

### Las tres columnas que existen por el bot

**`pillars.bot_intent`.** Hoy la equivalencia intención → pilar es una lista de literales en Python
más una enumeración dentro de un prompt de 5194 caracteres guardado en `prompts`. Ninguno de los dos
sitios lo sabe del otro, y el sitio tiene su propia lista en `habitChallengeExperiences.ts`. Con esta
columna, «`Sleep and rest` es el pilar del descanso» se afirma **una vez, en la base**, y el bot lo
resuelve con un `JOIN` en vez de con un `if`.

**`practice_translations.embedding vector(768)`.** Es la misma decisión que ya tomó
`post_translations`: el vector se deriva del TEXTO y el texto cambia con el idioma, así que vive por
traducción y no por práctica. 768 dimensiones = `gemini-embedding-001`, el mismo modelo del catálogo
—si no, no se pueden comparar—. Con esto, la práctica es recuperable por el pipeline semántico que
el bot **ya tiene funcionando** sobre 555 traducciones de publicaciones. Nace nula y se llena en el
slice 3; que la columna exista desde la 0049 ahorra una segunda migración.

**`practice_translations.safety_note`.** En el sitio, la advertencia de cada ritual vive suelta
(`atomicChallenges.*.safety`) y el artículo entero le da contexto. En un chat no hay artículo: la
práctica llega sola. El prompt del bot ya carga con «Avoid Strong Medical Claims» y «Do Not Provide
Medical Diagnosis», y esas reglas solo se pueden cumplir si la advertencia viaja pegada a la
práctica. Una práctica sin contexto es exactamente el modo en que este producto puede hacer daño.

### Por qué existe `pillars` teniendo `categories`

Porque `categories` tiene **seis** raíces en la base real, no cuatro: además de los pilares están
`cuidado_personal` y `hogar_y_limpieza`. Una FK directa a `categories.key` dejaría que una práctica
apuntara a «hogar y limpieza» como si fuera un pilar. Son cuatro filas que le dan a la FK algo
verdadero que decir, y que enlazan con la taxonomía en vez de duplicarla.

### Por qué `practice_studies` no lleva un campo `claim`

Porque la afirmación que sostiene el estudio **es** el `summary` de la práctica. Un `claim` por par
sería texto traducible, o sea una séptima tabla, para decir otra vez lo que la práctica ya dice.

### Por qué `author_user_id` nace en el slice 1 sin que nadie proponga prácticas todavía

Porque es la columna que convierte esto en red social sin una segunda migración. Nula significa
«curada por la casa», que es lo que serán todas las filas sembradas. Y como `users` ya es una sola
tabla para los dos canales, el día que alguien proponga una práctica desde Telegram no hace falta
nada más.

### Qué NO hace esta entrega

No toca `habit_challenge_progress`, `habit_repetitions`, `habit_celebrations`,
`habit_celebration_reactions` ni `habit_league_opt_ins`. Los cuatro retos atómicos siguen
funcionando igual, con sus 9 progresos, 18 repeticiones y 8 celebraciones reales. El puente es
`practices.challenge_key`; unificar el seguimiento es el slice 6, con backfill y aprobación aparte.

Y **no le quita al bot la búsqueda de productos**. La práctica no sustituye al catálogo: lo ordena.
Es la misma composición que el sitio ya hace en `PillarLocal` —esto es lo que hay que hacer, y esto
es lo que hay cerca para hacerlo—, que hoy en el chat sale sin la primera mitad.

## Slices

### Slice 1 — El catálogo existe, y Sueño lee su evidencia de él

**Alcance.** Las migraciones `0049_2026-09-04_add_practice_catalog.py` y
`0050_2026-09-04_add_pillar_studies.py` en `bot-whatsapp/backend`, sobre la cabeza `0048_2026_09_03`, el espejo de Drizzle a mano, la semilla, el dominio y un cambio
visible: la bibliografía de `/pilares/sueno` deja de ser una lista de URLs.

- Semilla: 4 pilares con su `bot_intent`, **116 estudios** con metadata real de Crossref
  (`api.crossref.org`, sin clave; ojo con las entidades HTML — devuelve `Metabolism &amp; …`), y
  **13 prácticas de Sueño** deduplicadas de sus 22 apariciones actuales, con sus traducciones
  `es`/`en` tomadas del catálogo vigente y sus enlaces a estudios tomados de los comentarios de
  `references.ts`.
- `design` se siembra solo donde ya está afirmado en los comentarios (el metaanálisis de soledad, el
  ensayo con polisomnografía); nulo en el resto. Inventarlo sería peor que no tenerlo.
- `embedding` queda nulo; se llena en el slice 3.
- **Entregado de más:** los cuatro pilares leen su bibliografía de la base, no sólo Sueño. Quedó
  sembrada para los cuatro (43 · 25 · 24 · 24) y mantener dos caminos de lectura por tres páginas no
  compraba nada. `references.ts` sigue vivo, ahora sólo como fuente de la semilla.

**Criterios de aceptación.**

1. `/pilares/sueno` lista sus 43 estudios con título, revista y año, no como URL cruda.
2. Un estudio que sostiene una práctica lo dice, con el nombre de la práctica.
3. Una práctica que sirve a dos pilares está una sola vez en `practices` y dos en `practice_pillars`.
4. El DOI sigue siendo enlazable a `https://doi.org/<doi>`.
5. Cada pilar declara la intención con la que el bot lo nombra.
6. Los cuatro retos atómicos siguen funcionando: el panel, el progreso, el jardín y la liga.

### Slice 2 — Las prácticas de los otros tres pilares

Semilla de las prácticas de Alimentación, Movimiento y Mente, y la retirada de `references.ts`,
cuyas cuatro listas se mudan a `src/scripts/data/pillarBibliography.ts` — su casa desde que lo que
se pinta sale de `pillar_studies` y esa lista sólo siembra.

**`PillarCatalog` NO entra aquí, y el roadmap se equivocaba al prometerlo «sin tablas nuevas».** Ese
componente pinta *categorías* —«Anclaje de luz solar», con cuatro ítems, un impacto en el cuerpo y
un impacto en el entorno—, y de eso el modelo no tiene nada: una práctica tiene título, promesa y
cómo se hace, pero no pertenece a un tema ni carga los dos impactos. Renderizarlo desde la base pide
un agrupador (`pillar_themes`) y dos textos traducibles más por tema. Es una extensión real del
modelo, no un cambio de plantilla, y por eso se decide aparte en vez de deformar `practices` para
que quepa. Ver «Slice 2b».

### Slice 2b — El catálogo por temas (pendiente de decisión)

Lo que falta para que `PillarCatalog` se pinte desde la base: una tabla de temas por pilar con su
título, su intro y sus dos impactos traducibles, y la pertenencia de cada práctica a un tema. Son
15 temas y 60 ítems ya escritos en `pillarPages.*`; el trabajo es de modelo, no de contenido.

### Slice 2c — La tabla del jardín, sin podio ✅

La liga deja de ser una clasificación y pasa a ser **quiénes hicieron crecer el jardín**. No es
maquillaje: cambia lo que se mide.

- **Aportes en vez de días distintos.** Con días el techo era 7, y sobre siete valores posibles una
  tabla de veinte personas es un empate perpetuo: ordena sin informar. Un aporte es una repetición,
  y el tope que importa ya lo pone la base — `uq_habit_repetitions_local_cycle` es único por
  persona, reto y fecha, así que **un pilar aporta una vez al día**. Caminar diez kilómetros vale lo
  mismo que caminar dos minutos; practicar dos pilares el mismo día sí vale más que practicar uno.
  Amplitud sí, intensidad no.
- **Semanas sostenidas** como segunda columna. Sube 1 por semana y no se puede acelerar. Reutiliza
  `countSustainedWeeks`, que ya existía y **no es una racha**: un hueco no borra nada, porque
  castigar a quien faltó y volvió contradice todo lo demás de esta práctica.
- **Sin `rank`, sin corona, sin premio.** La lista es un `<ol>` y esa es toda la posición que hay.
- El umbral de 10 y el consentimiento por alias se quedan igual: aparecer con nombre es una
  decisión, no un efecto secundario de practicar.

**La regla que hay que proteger** cuando las 45 prácticas sean registrables: el aporte se cuenta por
**pilar y día**, no por práctica y día. Si no, marcar doce prácticas un martes son doce aportes y la
tabla se vuelve quién marca más casillas.

### Slice 2d — Las anclas, y el índice donde se ven ✅

Las 45 prácticas tenían el qué, el porqué y el cómo. Les faltaba el **cuándo**, que es lo que separa
un consejo de un hábito, y una casa donde verse.

- **Migración 0051**: `practice_translations` gana `cue` y `minimum`. No gana `identity`: la
  identidad es del **pilar** —«soy una persona que respeta los ritmos naturales de su cuerpo» vale
  igual para atenuar la casa que para la descarga mental— y las cuatro frases ya existen traducidas.
  Una columna por práctica habría pedido escribir 45 identidades donde hay 4 verdaderas.
- **45 anclas y 15 mínimos**, en los dos idiomas. Nunca una hora del reloj: un ancla es un momento
  de la vida de alguien («al apagar la luz, mirando qué sigue encendido»), y ése fue el argumento
  por el que el primer ritual se negó a fijar «a las 6 p. m.».
- **`/practicas`**: el índice, agrupado por pilar, con la identidad del pilar arriba. Cada práctica
  aparece **una sola vez**, bajo el pilar del que es portada, y su tarjeta dice a qué otros sirve.
- `pillarColorClasses` se promovió a `src/presentation/habits/pillarColors.ts`: una segunda ruta lo
  necesitaba, y una ruta no importa de otra.

**Qué falta para cerrar las cuatro leyes:** *satisfactorio*. Es seguimiento, y eso es
`user_practices` — el slice 4.

### Slice 3 — El bot responde con la práctica, y cita el estudio ✅

**Es el slice que justifica el modelo.** En el backend:

- Un `recommend_practices(embedding, locale, pillar_key, threshold, pool_size, limit)` en Postgres,
  espejo de `recommend_posts` pero **sin boost comercial**: una práctica no está en venta, y meterle
  la puja de membresías sería vender consejo de salud al mejor postor.
- El sembrador de embeddings de `practice_translations`, con el mismo servicio que ya vectoriza
  `post_translations`.
- El orquestador: cuando la intención cae en un pilar (69 de 92 sesiones reales), primero la
  práctica con su evidencia, después lo que hay cerca para hacerla. La intención se resuelve a pilar
  por `pillars.bot_intent`, no por la lista de literales.
- La cita: título, revista y año, más el enlace a `doi.org`. Es lo que su propia instrucción de
  sistema le lleva pidiendo 484 mensajes.
- `safety_note` viaja siempre con la práctica.

### Slice 4 — Registrar una práctica, desde donde sea

`user_practices (user_id, practice_id, started_at, stopped_at, sharing_enabled, source)`.
`source` distingue `web` de `telegram` sin partir el modelo: es la misma fila de `users` y la misma
tabla de progreso. Privada por omisión, igual que `habit_challenge_progress`.

### Slice 5 — Compartirla con la comunidad

El muro de prácticas, sobre el patrón que ya existe: `habit_celebrations` + reacciones + jardín. No
se inventa un modelo social nuevo cuando hay uno funcionando con 8 celebraciones reales. El bot
puede publicar en el mismo muro.

### Slice 6 — Unificar los cuatro retos (grave, aprobación aparte)

Backfill de `habit_challenge_progress` (9 filas), `habit_repetitions` (18) y `habit_celebrations`
(8) hacia `user_practices`. Toca tablas pobladas con datos de personas reales: no entra sin
aprobación explícita, y no antes de que el modelo nuevo se haya ganado el sitio.

## Riesgos

- **La migración es sobre la BD compartida.** Alembic en `bot-whatsapp/backend` es la única fuente;
  el espejo de Drizzle se edita a mano. Nunca `drizzle-kit generate`. El `downgrade` de la 0049 es
  un `drop` de seis tablas nuevas: reversible sin pérdida.
- **Dos aplicaciones sobre las mismas tablas.** El sitio es dueño del contenido (siembra y edita) y
  el bot es lector; solo `user_practices` (slice 4) admite escritura por los dos. Escribirlo así
  desde el principio evita la carrera que sí existiría si ambos curaran el catálogo.
- **El embedding tiene que ser del mismo modelo.** 768 dimensiones, `gemini-embedding-001`. Un
  vector de otro modelo no falla: devuelve vecinos absurdos, que es peor.
- **Crossref puede no tener un DOI.** El sembrador registra la fila con el DOI y el resto nulo, y
  deja la lista de los que fallaron. Un estudio sin título es peor que hoy solo si además pierde el
  enlace, y no lo pierde.
- **La deduplicación es editorial.** Decidir que `ritualStep1` y `catalogLightItem1` son la misma
  práctica es un juicio, no un `diff`. Va en la semilla, revisable fila por fila.
- **Una práctica en un chat llega sin contexto.** De ahí `safety_note`. El riesgo no es técnico: es
  que el bot dé un consejo de salud recortado a alguien que no leyó el artículo.

> **Estado:** slices 1, 2, 2c, 2d y 3 entregados. Pendientes: 2b (catálogo por temas),
> 4 (`user_practices`), 5 (compartir) y 6 (unificar los retos). Ver la bitácora.
