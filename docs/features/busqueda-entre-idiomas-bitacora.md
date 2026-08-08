# Bitácora — Buscar en un idioma y encontrar en el otro

## Slices 1 y 2 — 2026-08-07

### Objetivo

Que quien navega en español y escribe `bread` encuentre los tres panes del catálogo, y que el
desplegable del buscador busque en el idioma en el que se está leyendo el sitio.

### Cómo se encontró

No se buscó: lo reportó el usuario ("cuando escribo bread no me encuentra ningún pan"). Lo primero
fue ir a la base a separar "el dato no está" de "la consulta no lo pide", y resultó ser lo segundo:

```
websearch_to_tsquery('english','bread')  → Chocolate Sourdough Bread   0.696
                                           Natural Sourdough Bread     0.669
                                           Sourdough Bread with Seeds  0.608
```

Los tres panes existen, tienen su fila `en` y el índice de texto los ordena bien. Lo que fallaba era
la pregunta.

### Decisiones y por qué

**El filtro de idioma desaparece de la búsqueda; el idioma se queda en el orden.**
`t.locale IN (locale, fallbackLocale)` era del slice 2 de `busqueda-semantica.md`, donde resolvió un
problema real: sin respaldo, una publicación sin traducir era invisible al buscar en inglés. Pero
resolvió la mitad del problema y dejó la otra escondida: **navegando en español los dos son `es`**, el
`IN` se cierra sobre sí mismo y las filas inglesas nunca entran. Ensanchar el filtro un idioma más no
es una regla, es un parche que se rompe con el siguiente idioma. Se quitó entero.

Lo que sí conserva idioma es el desempate: `own_relevance` (tu fila) manda sobre `relevance` (la mejor
de cualquier idioma). Eso es lo que mantiene intacto lo de siempre — medido: `pan` en español sigue
devolviendo los tres panes en el mismo orden, con las mismas relevancias 0.696 / 0.669 / 0.608.

**`JOIN LATERAL` en vez de `EXISTS` más subconsulta.** Hacían falta dos relevancias, y con el patrón
anterior habrían sido tres recorridos de `post_translations` por consulta. El lateral agrega una vez y
devuelve las dos, y de paso sigue garantizando que una publicación no salga dos veces por tener dos
traducciones que coinciden — que era el motivo declarado del `EXISTS`.

**El diccionario lo decide la fila, no quien busca.** Antes era un `CASE` de dos ramas (tu idioma o el
de respaldo); con la consulta abierta a todo, no hay dos casos que enumerar, así que se genera desde
`TEXT_SEARCH_CONFIG`. Añadir un idioma vuelve a ser una línea en el mapa.

**`fallbackLocale` se fue de la búsqueda entera** — puerto, DTO, caso de uso y las dos rutas. Existía
para ensanchar un filtro que ya no existe; a qué idioma caer al **pintar** lo decide
`resolvePostTranslation`, que es quien lo sabe. Es una desviación del roadmap, que solo hablaba del
repositorio: dejarlo habría sido un parámetro muerto atravesando cuatro capas.

**El rescate semántico perdió el mismo filtro.** Su propio comentario decía "el vector no entiende de
fronteras… es una ventaja, no un descuido", y tres líneas más abajo un `WHERE locale IN (…)` lo
contradecía. Con esto `searchByVector` se quedó sin parámetros de idioma, que es lo que siempre quiso
ser.

**El umbral semántico NO se tocó, y ese es el hallazgo que conviene no perder.** Se midió con frases
(`"algo para dormir mejor"` → 0.285) y **no vale para una palabra suelta**:

```
"bread"           → Pan de Masa Madre con Semillas  0.450
"bread"    (en)   → Sourdough Bread with Seeds      0.430   ← Natural Peanut Butter: 0.439
"sourdough bread" → Sourdough Bread with Seeds      0.326
```

Nueve milésimas entre el último pan y la crema de cacahuate: no hay umbral que los separe. Subirlo
mete ruido antes que señal. Anotado en `pendientes.md`.

**`hydrate` dejó de filtrar por idioma.** Ahora una publicación puede entrar por una fila de cualquier
idioma, y filtrar al hidratar la dejaría sin nada que pintar. Son dos filas por resultado.

**El e2e casi miente.** El escenario del diccionario usaba `loaves` / `loaf`, que parecía el ejemplo
obvio y **no funciona en ningún idioma**: Porter deja `loav` y `loaf`, dos raíces distintas — no sabe
de plurales irregulares. El par que sí distingue, medido: `baking` → `bake` con `english` y `baking`
con `spanish`. Un escenario que falla por el ejemplo y no por la regla es peor que no tenerlo.

### Archivos tocados

**Consulta**
- `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts` — `ROW_CONFIG` generado desde el
  mapa, `rankedMatches` con `JOIN LATERAL` y doble relevancia, `semanticMatches` sin idioma, `hydrate`
  sin filtro.

**Contratos**
- `src/use_cases/searchPosts/ports/ISearchPostRepository.ts` — sin `fallbackLocale`; `searchByVector`
  sin idioma.
- `src/use_cases/searchPosts/dtos/ISearchPostDTO.ts` — sin `fallbackLocale`.
- `src/use_cases/searchPosts/SearchPostsUseCase.ts` — deja de reenviarlo.

**Rutas y UI**
- `src/app/api/search/route.ts` — `resolveLocale()` en vez de `|| "es"`.
- `src/app/[locale]/buscar/data.ts` — sin `fallbackLocale`.
- `src/presentation/search/SearchBar.tsx` — la petición lleva `locale`.

**Pruebas**
- `src/app/api/search/route.test.ts` (nuevo) — la tabla de idiomas de la ruta.
- `src/presentation/search/SearchBar.test.tsx` — el desplegable pide en el idioma que se navega.
- `src/use_cases/searchPosts/SearchPostsUseCase.test.ts` — firmas nuevas.
- `src/e2e/busquedaEntreIdiomas/` (nuevo) — `.feature` + `entreIdiomas.spec.ts`.
- `src/e2e/testUtils/seedTranslation.ts` (nuevo) — sembrar la fila del otro idioma sin llamar a Gemini.

### Comandos

```bash
pnpm run test:run          # 955/955
pnpm run typecheck         # 0
pnpm run typecheck:tests   # 0
pnpm run lint              # limpio (queda 1 info preexistente en IndexingStatusPanel)
pnpm exec playwright test src/e2e/busquedaEntreIdiomas src/e2e/busquedaRelevante   # 22/22
pnpm exec playwright test <primera mitad>    # 40 passed, 3 skipped
pnpm exec playwright test <segunda mitad>    # 134 passed
```

### Validación contra la base

| Búsqueda | Antes | Después |
| --- | --- | --- |
| `bread` navegando en español | **0** | 9, con los tres panes primero (0.696 / 0.669 / 0.608) |
| `pan` navegando en inglés | 0 útiles | 9, con los tres panes primero |
| `pan` navegando en español | 9 | 9, **mismo orden y mismas relevancias** |
| `zzyzxqq` | 0 | 0 |

No se escribió nada en la base compartida: los escenarios siembran con prefijo `e2e-` y lo borran en
su `afterAll`, y `globalTeardown` barre lo que quede.

### Desviaciones del roadmap

- Se quitó `fallbackLocale` de toda la búsqueda, no solo del repositorio (justificado arriba).
- Se quitó también el filtro de idioma del rescate semántico, que el roadmap no mencionaba.
- El escenario del diccionario cambió de `loaves`/`loaf` a `baking`/`bake` porque el primero no
  probaba nada.

### Follow-ups

- El umbral semántico para consultas de una palabra: anotado en `pendientes.md`, sin decidir.
- Gemini tiene `taskType: RETRIEVAL_QUERY`, pensado para consultas cortas frente a documentos. Sería
  el arreglo de fondo del punto anterior, pero pide su propia medición y un backfill.
- Los índices GIN y HNSW siguen esperando a Alembic. El `JOIN LATERAL` recorre 46 traducciones; con
  ese tamaño da igual, pero es un recorrido más que antes.

### Recap

La búsqueda ya no tiene idioma: mira toda traducción, analiza cada fila con el diccionario que le
toca, y ordena poniendo delante lo que coincide en el idioma de quien busca. `bread` en español
devuelve los tres panes, `pan` en inglés también, y `pan` en español devuelve exactamente lo que
devolvía. El desplegable dejó de preguntar siempre en español. `fallbackLocale` desapareció de la
búsqueda porque su única razón de ser era un filtro que ya no existe. Todo verde: 955 unitarias, 174
e2e, typecheck y lint limpios.

### Próximos pasos (opciones)

1. **Medir si el rescate semántico sigue haciendo falta.** Con el texto completo abierto a los dos
   idiomas, muchas búsquedas que antes caían al vector ahora se resuelven antes. `grep 'strategy=semantic'`
   sobre el registro dice cuántos embeddings se siguen pagando.
2. **`taskType: RETRIEVAL_QUERY`** para las consultas cortas, con su medición.
3. **Los índices**, cuando Alembic esté disponible.

Pendiente del usuario: nada de este trabajo.
