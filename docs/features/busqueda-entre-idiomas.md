# Buscar en un idioma y encontrar en el otro

## Contexto

- **Problem**: quien navega en español y escribe `bread` no encuentra ninguno de los tres panes del
  catálogo, aunque los tres tienen su fila `en` con "Sourdough Bread" en el título. La búsqueda
  filtra `t.locale IN (locale, fallbackLocale)` y en español los dos son `es`, así que las filas
  inglesas ni entran en la consulta. Aparte, el desplegable del buscador no manda el idioma en su
  petición, así que busca en español incluso navegando en inglés.
- **Savings**: producto real a la venta que hoy devuelve una caja vacía. La búsqueda es donde
  alguien llega sabiendo lo que quiere; devolverle nada cuando el dato está es la peor forma de
  perderlo. Además ahorra llamadas a Gemini: hoy cada `bread` cae al rescate semántico —que tampoco
  acierta— y se paga un embedding por búsqueda fallida.
- **Why**: el sitio se lee en dos idiomas y sus visitantes no son monolingües. Un catálogo de comida
  mexicana leído en inglés está lleno de palabras que nadie traduce ("Jugo Verde") y de palabras que
  se buscan en inglés aunque el producto se llame en español.

## Lo medido antes de tocar nada

Contra la base compartida, el 2026-08-07. Los tres panes existen y el índice de texto funciona:

```
websearch_to_tsquery('english', 'bread')  → Chocolate Sourdough Bread    rank 0.696
                                            Natural Sourdough Bread      rank 0.669
                                            Sourdough Bread with Seeds   rank 0.608
```

Lo que falla es lo que la aplicación pregunta:

| Camino | Idioma de la interfaz | `locale IN (…)` | "bread" |
| --- | --- | --- | --- |
| `/buscar` | es | `('es','es')` | **0 resultados** |
| `/en/search` | en | `('en','es')` | 3 panes ✓ |
| Desplegable | es o en | `('es','es')` siempre | **0 resultados** |

El rescate semántico no lo salva, y la razón conviene dejarla escrita: **el umbral de `0.40` se midió
con frases, y una palabra suelta produce un vector mucho peor.**

```
"bread"           → Pan de Masa Madre con Semillas  0.450   ✗
"bread"    (en)   → Sourdough Bread with Seeds      0.430   ✗   ← y Natural Peanut Butter: 0.439
"sourdough bread" → Sourdough Bread with Seeds      0.326   ✓
```

Nueve milésimas separan el último pan de la crema de cacahuate. No hay umbral que los distinga, así
que **el umbral no se toca**: el arreglo tiene que resolverlo por texto completo, antes de llegar al
rescate.

## Modelo acordado

La búsqueda deja de tener idioma. Se busca contra **todas** las traducciones, analizando cada fila
con el diccionario de **su** idioma, y el resultado se enseña en el idioma de quien busca — que es
algo que `resolvePostTranslation` ya sabe hacer y `hydrate` ya carga.

Lo que sí conserva idioma es el **orden**: una publicación que coincide en tu idioma va antes que
una que solo coincide en el otro. Así "pan" en español sigue dando exactamente lo que daba, y
"bread" en español encuentra los panes al final de la nada.

## Slices

### Slice 1 — la búsqueda mira todas las traducciones

**Alcance**: `PostgresSearchPostRepository`.

- El predicado de coincidencia pierde el filtro `t.locale IN (locale, fallbackLocale)`.
- El diccionario deja de decidirse por el locale de quien busca y pasa a decidirse por el de la
  fila (`CASE t.locale WHEN 'es' THEN 'spanish' …`), construido desde `TEXT_SEARCH_CONFIG` para que
  añadir un idioma siga siendo una línea en el mapa.
- El orden gana un primer criterio: la relevancia **en tu idioma**, y solo después la mejor de
  cualquier idioma. Las tres claves siguientes (distancia, fecha, id) no se tocan.
- `EXISTS` + subconsulta de relevancia se funden en un `JOIN LATERAL` que devuelve las dos
  relevancias en una sola pasada.
- `hydrate` deja de filtrar por idioma: carga las traducciones que haya y deja elegir a
  `resolvePostTranslation`.
- El rescate semántico pierde el mismo filtro, que contradecía su propio comentario ("el vector no
  entiende de fronteras").

**Aceptación**

- Navegando en español, `bread` devuelve los tres panes.
- Navegando en inglés, `pan` devuelve los tres panes.
- `pan` en español devuelve lo mismo que antes y en el mismo orden.
- Lo que coincide en tu idioma va antes que lo que solo coincide en el otro.
- Ninguna publicación sale dos veces por tener dos traducciones que coinciden.

### Slice 2 — el desplegable busca en el idioma en el que estás

**Alcance**: `SearchBar` y `/api/search`.

- `SearchBar` manda `locale` en la petición; ya lo tiene, lo usa para pintar los títulos.
- La ruta lo convierte con `resolveLocale()` en vez de `|| "es"`, así un `?locale=fr` cae al
  español en lugar de llegar como idioma a la consulta.

**Aceptación**

- El desplegable en inglés pide `locale=en`; en español, `locale=es`.
- Un idioma desconocido en el parámetro no rompe nada.

## Lo que este trabajo NO hace

- **No toca `SEMANTIC_MAX_DISTANCE`.** Ver la medición de arriba: subirlo mete ruido antes que
  señal. Queda anotado en `pendientes.md` que se midió con frases y no vale para una palabra suelta.
- **No cambia el `taskType` de los embeddings.** Gemini tiene `RETRIEVAL_QUERY`, pensado justo para
  consultas cortas frente a documentos, pero eso es un trabajo con su propia medición y su propio
  backfill.
- **No añade índices.** El `JOIN LATERAL` recorre las 46 traducciones; con ese tamaño da igual. Los
  índices GIN y HNSW siguen esperando a Alembic, como dice `pendientes.md`.
