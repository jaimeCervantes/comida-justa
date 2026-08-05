# Bitácora — búsqueda relevante

Registro append-only. El *qué* está en `git log`; aquí va el *por qué*.

---

## 2026-08-05 — Slices 1 y 2

### Objetivo

El usuario preguntó si valía la pena que la búsqueda filtrara por cercanía. Al abrir el archivo
apareció algo más grave, y la respuesta acabó siendo "sí, pero no como lo planteas, y primero hay
que arreglar otra cosa".

### El hallazgo que cambió el orden del trabajo

`PostgresSearchPostRepository.ts:28-39`: **cuando había término de búsqueda, no había `ORDER BY` en
ninguna parte.** Se traían todos los IDs coincidentes, se cortaban en memoria (`:61`) y un
`results.sort()` final (`:162`) restauraba ese mismo orden arbitrario. El comentario de la línea 161
afirmaba *"match order for query"*, pero eso no existe: el orden lo decidía el planner de Postgres y
podía cambiar entre ejecuciones. Dos búsquedas idénticas podían repartir los mismos resultados
distinto entre las páginas.

El `orderBy(desc(createdAt))` de la línea 49 solo aplicaba **cuando no había término**. El único
caso ordenado era el que no es una búsqueda.

Nadie lo había notado porque **no existía un solo spec de comportamiento sobre `/buscar`** — los de
`seo/` tocan la ruta pero solo miran metadatos.

### Decisiones y por qué

**La relevancia manda; la distancia desempata.** Es la diferencia entre búsqueda y listado. En
`/productos` nadie dijo qué quería, así que la cercanía es el mejor criterio disponible. Si alguien
escribe "pan de masa madre", la relevancia *es* la pregunta: si la distancia gana, sale lo más
cercano que se parezca vagamente en vez de lo que pidió. Por eso `distance_meters` entra en el
`ORDER BY` **después** del nivel de relevancia y **antes** de la fecha.

**No hay filtro por radio, y no lo va a haber.** Se propuso y se descartó en la conversación:
esconder un resultado que alguien pidió por su nombre es el peor fallo posible en una búsqueda. Si
lo único que existe está a 200 km, hay que decirlo.

**Dos niveles de relevancia, no cinco.** Coincide el título / coincide solo el texto. Dos niveles se
explican en una frase y se prueban en una tabla; añadir "empieza por", "palabra completa" o
"coincidencia exacta" sería especular sin datos de uso.

**El `id` como último desempate no es cosmético.** Sin él, dos publicaciones con el mismo
`created_at` vuelven al orden indefinido, que es justo el fallo que se estaba corrigiendo.

**`EXISTS` en vez de `JOIN`.** El código anterior deduplicaba en JS "porque una publicación puede
coincidir por título y por contenido" — eso no duplica filas en SQL. Lo que sí duplicaría es que
hubiera dos traducciones del mismo idioma para una publicación, y no hay restricción única que lo
impida. `EXISTS` garantiza una fila por publicación pase lo que pase.

**Las páginas dejaron de llamar a su propia API.** `buscar/page.tsx` y
`buscar/[term]/page/[page]/page.tsx` eran Server Components que hacían `fetch` a `/api/search`: un
viaje HTTP completo para hablar consigo mismo. No fue una optimización de paso — **ese fetch no
reenvía las cookies**, así que `readVisitorLocation()` dentro del route handler nunca habría visto
nada y la búsqueda no habría podido decir distancias jamás. `/api/search` se queda para `SearchBar`,
que es un cliente de verdad: ahí la petición la hace el navegador y las cookies sí viajan.

**El escenario del ranking se sembró al revés a propósito.** La publicación de menor relevancia se
inserta **la última**, así que es la más reciente; como el desempate es `created_at DESC`, un orden
que ignorase el ranking la pondría primera. Sembrarla al principio habría hecho el escenario
infalsificable — el mismo error que costó una corrida en la bitácora de `productores-locales`.

### Archivos tocados

- **Infra:** `dataAccess/searchPosts/PostgresSearchPostRepository.ts` (reescrito).
- **Casos de uso:** `searchPosts/SearchPostsUseCase.ts`, sus dos DTO y el puerto, + tests.
- **App:** `[locale]/buscar/data.ts` (nuevo), las dos páginas de búsqueda, `api/search/route.ts`.
- **e2e:** `busquedaRelevante/` con `ordenDeterminista.spec.ts`, `distanciaEnBusqueda.spec.ts` y el
  `.feature`; `testUtils/seedPost.ts` acepta `content`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **743 pasados**, 82 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio (1 `info` preexistente) |
| `pnpm exec playwright test` | **148 pasados**, 0 fallos, 7.0 min |

En la base compartida solo se escribió lo que siembran y borran los propios specs (prefijo `e2e-`).

Aviso recurrente: hay que correr la e2e con `E2E_PORT=3100` si el 3000 está ocupado, y si un dev
server anterior murió a medias, `.next/dev/types` queda corrupto y `pnpm typecheck` falla con
errores que no son del código. Se borra esa carpeta y listo.

### Desviaciones del roadmap

1. **`newestFirst` también calcula distancia.** El roadmap no lo pedía; se hizo por coherencia del
   contrato del repositorio. En la práctica es código inalcanzable desde la aplicación, porque
   `SearchPostsUseCase` corta antes cuando no hay término.
2. **El test del caso de uso creció dos casos.** Al cambiar la firma había que actualizarlo de todas
   formas; se aprovechó para fijar que `near` llega como `null` y no como `undefined`.

### Lo que NO se hizo, y por qué

**La búsqueda sigue siendo `ILIKE '%término%'`.** No es semántica, no tolera errores de tecleo, no
entiende plurales ni acentos, y no usa los `embedding` de 768 dimensiones que ya están en
`post_translations` y que el bot sí aprovecha. Este trabajo se limitó a que el orden exista y sea
explicable. Cambiar el motor es otra conversación y otro roadmap.

### Recap

La búsqueda tenía un orden indefinido —sin `ORDER BY`, paginando en memoria— y era la única sección
del sitio sin distancias. Ahora es una sola consulta ordenada y paginada en la base, por relevancia
(coincide el título antes que solo el texto), luego distancia, luego fecha, luego `id`; dice a qué
distancia está cada resultado; y nunca esconde nada por quedar lejos. De paso, las páginas dejaron de
hacer un viaje HTTP contra su propia API, que además era lo que impedía leer la ubicación. Todo
verde: 743 unitarios y 148 e2e.

### Próximos pasos (opciones)

1. **Distancia en `/tienda/[handle]`**, el último hueco de cercanía que queda en el sitio.
2. **Cambiar el motor de búsqueda** a los embeddings que ya existen en `post_translations`. Es lo
   que arreglaría "pan integral" no encontrando "Pan Integral" mal tecleado, y lo que aprovecharía
   el índice que el bot ya mantiene. Es un roadmap propio, no un slice.
3. **Normalizar acentos y mayúsculas** en el `ILIKE` actual (`unaccent`), como paso intermedio mucho
   más barato que lo anterior.
4. **Instrumentar qué se busca**: hoy no hay ningún dato sobre qué términos se escriben ni cuántos
   terminan sin resultados. Sin eso, cualquier mejora del motor es a ciegas.

**Pendiente del usuario:** la rama `feat/busqueda-relevante` tiene dos commits, sin subir y sin PR.
