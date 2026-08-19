# Bitácora: Búsqueda semántica

Roadmap en `docs/features/search/003-2026-08-07-busqueda-semantica.md`.

## Slice 1 + 2: Texto completo y respaldo de idioma

**Objetivo:** que la caja de búsqueda deje de ser `ILIKE '%término%'`. Los slices 1 y 2 salieron
juntos porque el `WHERE` que había que reescribir era el mismo.

**Lo que se midió antes de tocar nada**, contra la base compartida:

| Término | Locale | Antes | Ahora |
| --- | --- | --- | --- |
| `pan` | es | 10 (uno falso) | 9 |
| `pán` | es | **0** | 9 |
| `panes` | es | **0** | 9 |
| `pan` | en | 2 («panela», «Pancakes») | 9 (pan de verdad) |
| `bread` | en | 9 | 9 |
| `bread` | es | **0** | encuentra por respaldo |

**Decisiones y racional:**

- **No hizo falta tocar la base.** La primera idea era instalar `unaccent`. Al comprobarlo,
  `unaccent` y `pg_trgm` están **disponibles pero no instalados**, y instalarlos habría sido un
  cambio en la base compartida. Resultó innecesario: la configuración `spanish` que Postgres ya trae
  hace lematización **y** normaliza los diacríticos por su cuenta — `buñuelos`, `buñuelo`,
  `BUÑUELOS` y `buñuélos` reducen todos a `buñuel`. Cero migraciones.

- **Cada fila se analiza con el diccionario de su propio idioma**, no con el de quien busca. Una
  fila española se lematiza en español aunque la interfaz esté en inglés, y la pregunta se construye
  con ese mismo diccionario: si no, el término quedaría partido de una forma y el documento de otra.

- **`setweight` sustituye a los dos niveles de relevancia.** Antes el orden era «coincide el título
  (0) o solo el texto (1)». Ahora el peso vive en el vector (`A` el título, `B` el cuerpo) y
  `ts_rank` devuelve la relevancia con el título por delante **y** distinguiendo entre coincidir una
  vez y coincidir cinco, que los dos niveles no podían. El resto del orden —distancia, fecha, `id`—
  se conserva intacto: se ganó en `busqueda-relevante` y no se toca.

- **El respaldo de idioma (slice 2) era más grave de lo que parecía.** El filtro era
  `t.locale = ${locale}` a secas: una publicación sin fila `en` era **invisible** al buscar en
  inglés, aunque su ficha se abriera sin problema. Antes del backfill de traducciones eso significa
  que **buscar en inglés devolvía cero resultados para todo el catálogo**. Hoy quedaría tapado
  porque las 23 están traducidas, y habría vuelto en cuanto una publicación nueva se quedara sin su
  traducción.

**Dos bugs preexistentes que aparecieron al probarlo:**

1. **Las búsquedas con acento devolvían cero, y parecían «sin resultados».** La ruta
   `/buscar/[term]/page/[page]` pasaba el segmento **crudo** a la consulta (`bu%C3%B1uelos`) pero sí
   lo decodificaba para pintarlo en el encabezado. O sea que la página mostraba la palabra bien
   escrita y decía que no había nada. Ahora se decodifica una vez, con `decodeSearchTerm`, que
   además no lanza con un `%` suelto.
2. **Buscar «50% descuento» tumbaba la página.** `/buscar?q=…` hacía `decodeURIComponent(q)` sobre
   un valor que `searchParams` ya entrega decodificado: con un `%` suelto eso **lanza**, y la
   respuesta era un 500. Se quitó el decode, que además no arreglaba nada.

**Archivos tocados:**
- `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts` (FTS, `ts_rank`, respaldo, e
  `hydrate` trayendo los dos idiomas)
- `src/use_cases/searchPosts/` (puerto, DTO, caso de uso y su test)
- `src/app/[locale]/buscar/decodeTerm.ts` + test (nuevos), `buscar/page.tsx`,
  `buscar/[term]/page/[page]/page.tsx`, `buscar/data.ts`, `src/app/api/search/route.ts`
- `src/e2e/busquedaRelevante/textoCompleto.spec.ts` (nuevo, 7 escenarios)

**Validación:**
- `pnpm run test:run`: **909/909**. `pnpm run typecheck`: exit 0. `pnpm run lint`: limpio.
- **Playwright: 160 pasan, 3 saltadas, 0 fallan.**
- No se escribió nada en la base: este slice solo cambia consultas.

### Recap
La caja de búsqueda dejó de emparejar subcadenas y pasó a entender palabras: plurales y acentos
encuentran lo mismo que la forma base, «pan» ya no trae «panela», y una publicación sin traducir
sigue apareciendo al buscar en el otro idioma. Todo con las configuraciones que Postgres ya traía,
sin instalar extensiones ni migrar nada. De paso se arreglaron dos bugs que llevaban tiempo: las
búsquedas con acento devolvían cero fingiendo que no había resultados, y un `%` en el término
tumbaba la página.

### Próximos pasos (opciones)
1. **Slice 3 — híbrido con el vector.** Es lo que falta para que «algo para dormir mejor» encuentre
   la publicación del sueño. Sigue sin empezar; el roadmap detalla las tres decisiones que hay que
   tomar (cuándo vectorizar la consulta, cómo fusionar los dos rankings, y reusar
   `search_posts_semantic` en vez de escribir otra consulta).
2. **Slice 4 — medir qué se busca.** Sigue sin haber **ningún** dato sobre términos ni sobre
   búsquedas sin resultados. Debería ir antes del 3 si se quiere justificar su coste con números.
3. **Un índice GIN** sobre el `tsvector`. Hoy no hace falta —46 traducciones— pero es lo primero que
   se va a notar cuando el catálogo crezca. Requiere migración Alembic.

---

## Slice 3: El rescate semántico

**Objetivo:** que «algo para dormir mejor» encuentre la publicación del sueño.

**Decisiones y racional:**

- **El vector no sustituye al texto, lo rescata.** Se dispara **solo cuando el texto completo
  devolvió cero**. Esa es la decisión de coste del slice: una llamada al proveedor de embeddings por
  búsqueda sería inasumible —la caja tiene 500 ms de rebote y las páginas de resultados se piden en
  cada navegación—, pero pagarla justo cuando alguien se iba a ir con las manos vacías es
  exactamente cuando vale. Y el orden de las búsquedas que sí funcionan no se toca: quien escribe
  «Suero natural» sigue recibiendo esa publicación primero.

- **NO se reusa `search_posts_semantic`, y eso contradice al roadmap.** El roadmap decía que
  reusarla era lo correcto «para que el sitio y el bot no ordenen distinto». Al medirlo resultó
  falso: esa función es el recomendador de **productos** del chatbot y filtra `kind = producto`,
  así que dejaría fuera las 10 publicaciones de tipo `anuncio` — los artículos, que son justamente
  lo que alguien encuentra buscando por concepto.

  | «algo para dormir mejor» | Resultado | Distancia |
  | --- | --- | --- |
  | `search_posts_semantic` | Suero natural ❌ | 0.419 |
  | Consulta directa | **La clave para dormir profundo** ✅ | 0.285 |

  Se escribió una consulta directa sobre `post_translations.embedding`, con la misma forma que
  `getRelatedPosts` ya usaba.

- **El umbral se midió, no se eligió a ojo.** Sin umbral el vecino más cercano existe **siempre**:
  buscar un disparate devolvería jugos, que es «cualquier cosa disfrazada de recomendación», el
  error que el propio código ya advertía en `getRelatedPosts`.

  | Consulta | Distancia del mejor resultado |
  | --- | --- |
  | «algo para dormir mejor» | 0.285 |
  | «bebida para hidratarme» | 0.305 |
  | «desayuno con proteína» | 0.321 |
  | «reparar la transmisión de un camión» | 0.449 |
  | «comprar acciones en la bolsa» | 0.457 |

  `SEMANTIC_MAX_DISTANCE = 0.40` deja pasar lo bueno con margen y corta lo absurdo.

- **`DISTINCT ON` toma la traducción más cercana de cada publicación, sea cual sea su idioma.** El
  vector no entiende de fronteras: una consulta en español puede encontrar una fila inglesa y al
  revés. Es una ventaja, no un descuido.

- **Un proveedor caído no es un error de la página.** Si el embedding falla, se devuelven los cero
  resultados de siempre. Y sin `GEMINI_API_KEY` la búsqueda funciona igual, solo que sin rescate:
  el servicio es un parámetro opcional del caso de uso.

**Comprobado de punta a punta contra la base:**

| Consulta | Vía | Resultado |
| --- | --- | --- |
| `pan` | texto | 9 resultados, sin llamar al proveedor |
| «bebida para hidratarme» | rescate | Agua de piña, Suero natural, Electrolitos |
| «desayuno con proteína» | rescate | Omelet, Pechuga de pollo |
| «something to sleep better» | rescate | **The key to deep sleep** (en inglés) |
| «reparar la transmisión de un camión» | rescate | **0** |
| «comprar acciones en la bolsa» | rescate | **0** |
| `zzzqxwv` | rescate | **0** |

**Validación:** `pnpm run test:run` **914/914**; `typecheck` exit 0; `lint` limpio; `build` compila.

### Recap
La búsqueda entiende conceptos y no solo palabras, sin volverse un generador de resultados
irrelevantes: los tres disparates que se probaron devuelven cero. El coste está acotado a las
búsquedas que iban a fracasar, y la medición desmintió la suposición del roadmap sobre reusar la
función del chatbot — que habría escondido todos los artículos.

### Próximos pasos (opciones)
1. **Slice 4 — medir qué se busca.** Sigue sin haber **ningún** dato. Ahora importa más que antes:
   sin él no se puede saber cuántas búsquedas llegan al rescate ni cuánto se gasta en embeddings.
2. **Un índice GIN** sobre el `tsvector` y un **HNSW** sobre el vector. Con 46 traducciones no hace
   falta; es lo primero que se notará al crecer. Requiere migración Alembic.
3. **Caché del embedding por término**, si el rescate resulta ser frecuente.

---

## Slice 4: Medir qué se busca

**Objetivo:** dejar de trabajar a ciegas. No había **ningún** dato sobre qué se escribe en la caja
ni cuántas búsquedas terminan sin resultados.

**Decisiones y racional:**

- **Un puerto, no un `console.log` suelto.** El destino natural sería una tabla, pero crearla es una
  migración Alembic sobre la base compartida, que es una decisión aparte y no se tomó aquí. Con
  `ISearchReporter` en medio, cambiar el destino el día que exista la tabla no toca el caso de uso.

- **Se registra la estrategia, y esa es la métrica que faltaba.** Distinguir `text` de `semantic` es
  lo que permite saber **cuánto se está gastando en embeddings**: cada búsqueda `semantic` costó una
  llamada al proveedor. Y `emptyHanded` responde la pregunta que el motor no puede responder solo:
  qué busca la gente que no encontramos.

- **El término se normaliza.** Minúsculas y espacios colapsados, porque si no el informe de términos
  más buscados sería una lista de variantes de escritura del mismo término. Y se recorta a 120
  caracteres: un término desmesurado suele ser un pegado accidental.

- **Medir nunca interrumpe.** Si el destino falla, quien buscaba recibe sus resultados igual. Hay un
  `try/catch` en el caso de uso **y** otro en el adaptador, y una prueba que lo exige.

Para leer el dato mientras no haya tabla:
`grep '\[search\]' | grep 'emptyHanded=true'` y `grep 'strategy=semantic' | wc -l`.

**Archivos tocados:** `src/domain/search/searchEvent.ts` + test (nuevos),
`src/use_cases/searchPosts/ports/ISearchReporter.ts` (nuevo),
`src/infra/services/ConsoleSearchReporter.ts` (nuevo), `SearchPostsUseCase.ts` + test,
`buscar/data.ts`, `api/search/route.ts`.

**Validación:** `pnpm run test:run` **930/930**; `typecheck` exit 0; `lint` limpio; `build` compila;
**Playwright 160 pasan, 3 saltadas, 0 fallan**.

### Recap
El roadmap de búsqueda semántica queda con sus cuatro slices entregados. La caja entiende palabras
(slice 1), no esconde nada por falta de traducción (slice 2), rescata por sentido lo que el texto no
encuentra sin devolver disparates (slice 3) y por fin deja rastro de lo que la gente busca (slice 4).

### Próximos pasos (opciones)
1. **La tabla de búsquedas**, cuando se decida la migración Alembic. El puerto ya está.
2. **Índices**: GIN sobre el `tsvector` y HNSW sobre el vector. Con 46 traducciones no hacen falta;
   es lo primero que se notará al crecer. También es Alembic.
3. **Caché del embedding por término**, si los datos del slice 4 muestran que el rescate es
   frecuente.
