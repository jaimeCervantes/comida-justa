# La búsqueda tiene un orden, y dice a qué distancia está

## El problema

### 1. La búsqueda no tiene orden (el fallo real)

`PostgresSearchPostRepository.ts:28-39`. Cuando hay término de búsqueda, la consulta que saca los
IDs **no lleva `ORDER BY`**:

```ts
const matchRows = await db
  .select({ postId: postTranslations.postId })
  .from(postTranslations)
  .where(and(eq(...locale), or(ilike(title), ilike(content))))
  // ← no hay orderBy
```

Después se pagina cortando ese array en memoria (`:61`) y al final `results.sort()` (`:162`) solo
restaura ese mismo orden arbitrario. El comentario de la línea 161 afirma *"match order for query"*,
pero eso no existe: es el orden que devuelva el planner de Postgres, y puede cambiar entre
ejecuciones —tras un `VACUUM`, con otro plan, o al crecer la tabla—. Dos búsquedas idénticas pueden
devolver las mismas 23 publicaciones repartidas distinto entre las páginas.

El `orderBy(desc(createdAt))` de la línea 49 solo aplica **cuando no hay término**. Es decir: el
único caso ordenado es el que no es una búsqueda.

Ninguna prueba lo cubre: no hay un solo spec de comportamiento sobre `/buscar` (los de `seo/` tocan
la ruta, pero solo miran metadatos).

### 2. Trae todo y corta en memoria

`matchedPostIds` son **todos** los IDs coincidentes, y la paginación es un `slice` de ese array. Con
23 publicaciones da igual; es un problema el día que no.

### 3. Es la única sección sin cercanía

`/` , `/productos`, `/categoria/*` y los dos directorios dicen a qué distancia está cada cosa. La
búsqueda no. Y no es porque falte UI: usa el mismo `CardForList` y el mismo
`mapPostsToCardsForLocale`, y `mapPostsToCards:62` ya lee `item.distanceMeters ?? null`. **El hueco
existe y llega siempre vacío**, porque la consulta nunca calcula la distancia.

### 4. El servidor se llama a sí mismo por HTTP

`buscar/page.tsx:21` y `buscar/[term]/page/[page]/page.tsx:14` son Server Components que hacen
`fetch` a su propia API `/api/search`. Cuesta un viaje HTTP completo por búsqueda, y —lo que
importa aquí— **ese fetch no reenvía las cookies**, así que `readVisitorLocation()` dentro del route
handler no vería nada. Toda otra página del repo llama a su repositorio directamente.

`/api/search` sí tiene un consumidor legítimo: `SearchBar.tsx:73`, el autocompletado del cliente. Ese
se queda.

## Lo que ahorra

Que dos búsquedas iguales den lo mismo, y que quien busca "pan" vea cuál de los panes le queda
cerca sin tener que abrir cada resultado.

## Por qué

La cercanía es el argumento del sitio y la búsqueda es donde alguien llega con una intención
concreta. Es la peor sección para no poder confiar en el orden.

## Decisiones tomadas antes de escribir código

**La relevancia manda; la distancia desempata.** Es la diferencia entre búsqueda y listado. En
`/productos` no dijiste qué querías, así que la cercanía es el mejor criterio disponible. Si
escribes "pan de masa madre", la relevancia *es* la pregunta: si la distancia gana, sale lo más
cercano que se parezca vagamente en vez de lo que pediste.

**No hay filtro por radio, y no lo va a haber.** Esconder un resultado que alguien pidió por nombre
es el peor fallo posible en una búsqueda. Si lo único que existe está a 200 km, hay que decirlo, no
callarlo.

**Dos niveles de relevancia, no cinco.** Coincide el título / coincide solo el contenido. Más
niveles —empieza por, coincidencia exacta, palabra completa— es especular sin datos de uso. Dos
niveles se explican en una frase y se prueban en una tabla.

**El desempate final es `id`.** Sin él, dos publicaciones con el mismo `created_at` vuelven a quedar
en orden indefinido, que es justo el fallo que se está arreglando.

**Las páginas dejan de llamar a su propia API.** No es una optimización de paso: es lo que permite
leer la cookie de ubicación. De regalo se ahorra un viaje HTTP por búsqueda.

**Con los datos de hoy la distancia no se va a notar.** Hay 1 tienda con 1 sucursal y está
exactamente en el ancla, así que las 18 publicaciones con tienda quedan todas en el mismo punto.
El código queda correcto y sin efecto observable hasta que haya más tiendas situadas; se deja dicho
para que nadie lo lea como que no funciona.

## Slices

### Slice 1 — La búsqueda tiene un orden, y es la relevancia

- Una sola consulta SQL, ordenada y paginada en la base:
  `ORDER BY rank, p.created_at DESC, p.id`, con `rank = 0` si coincide el título y `1` si solo
  coincide el contenido.
- `COUNT(*) OVER()` para el total, en vez de contar el array entero.
- `EXISTS` sobre `post_translations` en vez de `JOIN`, para que una publicación no pueda salir dos
  veces si algún día hay dos traducciones del mismo idioma.
- Se cae el `slice` en memoria y el `results.sort()` final.

**Aceptación:** la misma búsqueda dos veces da el mismo orden; lo que coincide en el título sale
antes que lo que solo coincide en el contenido; la paginación no repite ni se salta resultados.

### Slice 2 — La búsqueda dice a qué distancia está

- Columna `distance_meters` en la consulta (el mismo `ST_Distance` sobre `branches.location` que ya
  usan `PostgresPostQueryRepository:118` y `PostgresStoreDirectory:77`).
- `distance_meters ASC NULLS LAST` entra en el `ORDER BY` **después** del rank y **antes** de la
  fecha: desempata dentro de un mismo nivel de relevancia, nunca por encima de él.
- `ISearchPostResultDTO` gana `distanceMeters`; el resto de la cadena ya lo transporta.
- Las dos páginas de búsqueda llaman al caso de uso directamente; `/api/search` se queda para
  `SearchBar` y también aprende a leer la ubicación (ahí las cookies sí viajan, porque la petición
  la hace el navegador).

**Aceptación:** un resultado de una tienda situada dice su distancia; sin ubicación no se inventa
ninguna y el orden cae a la fecha; nada desaparece nunca por quedar lejos.

## Validación

```
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run test:e2e:run
```

La suite no tenía ni un spec de comportamiento sobre `/buscar`; los de este trabajo son los
primeros. Correr con `E2E_PORT=3100` si el 3000 está ocupado.
