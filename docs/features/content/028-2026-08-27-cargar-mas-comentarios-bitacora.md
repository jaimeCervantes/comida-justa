# Bitácora — «Cargar más comentarios» solo cuando hay más

## Slice 1 — El botón deja de ofrecer lo que no existe (2026-08-27)

### Lo que se reportó

El usuario lo notó en la ficha de una publicación: el botón «Cargar más comentarios» aparece
siempre. Debería aparecer **solo si hay más**, y en una publicación sin ningún comentario tampoco.

### La causa: el dato existía y no llegaba

`CommentList` pintaba el botón sin condición. La única forma de enterarse de que no había nada más
era **pulsarlo** y leer el aviso «Ya no hay más comentarios» — y en una publicación sin un solo
comentario pasaba lo mismo, debajo del «No hay comentarios aún».

Lo curioso es que el dato ya existía en dos de los tres sitios:

| Sitio | ¿Tenía el total? |
| --- | --- |
| `PostgresCommentRepository.getComments` | **Sí**, devuelve `{ comments, total }` desde siempre |
| `createOnLoadMoreComments` | Lo recibía y **lo tiraba**: solo miraba `comments.length === 0` |
| La consulta de la ficha (`getPostBySlug`) | **No** lo traía: cargaba la primera página y nada más |

O sea que la paginación ya sabía contar; lo que faltaba era saberlo **antes de pintar**.

### Lo que se hizo

- `getPostBySlug` gana un `COUNT(*)` de comentarios de esa publicación, y lo devuelve como
  `commentsTotal`. Es una subconsulta más sobre una columna indexada, en la consulta que ya se hacía.
- `CommentList` recibe `initialTotal` y pinta el botón solo cuando `comments.length < total`. Esa
  única condición cubre los dos casos del reporte: sin comentarios el total es 0, y con todos
  cargados la longitud alcanza al total.
- `createOnLoadMoreComments` deja de tirar el `total` que ya recibía y lo refresca en cada página.

### El total se refresca, y no es paranoia

Se actualiza **siempre**, incluso cuando la página vuelve vacía. Entre que se pintó la ficha y se
pulsa el botón, alguien más puede haber comentado —o alguien pudo borrar comentarios—, y
`getComments` ya devuelve la cuenta al día. Sin refrescarlo, el botón seguiría ofreciéndose contra
un total que dejó de ser cierto. Hay un caso que lo prueba.

### Un tropiezo del propio comentario

El comentario que documenta el `COUNT` vive dentro de un `` sql`...` ``, o sea un template literal.
Escribir `` `getComments` `` con acentos graves **cortaba la plantilla** y `tsc` sacaba un
`',' expected` en una línea de SQL que se veía bien. Queda dicho en el propio comentario para que
nadie lo reintroduzca al reformatear.

### Lo que se vio de paso y no se tocó

`AddCommentForm` llama a `onAdd?.()` tras publicar un comentario, pero `CommentList` **no le pasa
ese callback**: el comentario recién escrito no aparece en la lista hasta recargar. Es anterior a
este slice y ajeno a lo reportado, así que se deja anotado en vez de arrastrarlo aquí.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Consulta | `getOnePostWithPaginatedComments/PostgresGetOnePost.ts` (+`comments_total`) |
| Presentación | `loadComments/CommentList.tsx` (+ test, nuevo), `loadComments/createOnLoadMoreComments.ts` |
| Ruta | `src/app/[locale]/[slug]/page.tsx` |

### Comandos y resultados

```
pnpm exec vitest --run "src/app/[locale]/[slug]/loadComments"   # 5 en verde, nuevas
pnpm run validate      # biome + typecheck + typecheck:tests + toda la suite
pnpm run check:i18n    # limpio
```

Comprobado contra la base real y en el navegador, que es lo que las pruebas de componente no
cubren:

| Publicación | Comentarios | Botón |
| --- | --- | --- |
| `verduras-y-semillas-frescas` | 46 (10 en la primera página) | **sí** |
| `organic-black-beans-…` | 0 | **no** |
| `verduras-…` tras pulsar hasta agotar | 46 de 46 en pantalla | **no** |

### Recap

El botón de cargar más comentarios solo se ofrece cuando queda algo que cargar. El total lo trae la
misma consulta que ya pintaba la ficha, y la paginación —que llevaba devolviéndolo desde siempre sin
que nadie lo leyera— ahora lo usa para mantenerlo al día.

### Próximos pasos (opciones)

1. **Conectar `onAdd`** para que el comentario recién publicado aparezca sin recargar. El hueco ya
   está en `AddCommentForm`; falta que `CommentList` lo llene y suba el total en uno.
2. **Cola offline optimista** — sigue pendiente de su conversación de alcance.
