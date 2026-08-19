# Las dimensiones de cada archivo, para que el listado deje de recortar

## El problema

`ImageContent` le pasa a `next/image` un `width={1000} height={1000}` **fijo**, igual para todas.
Esos dos números son los que fijan la proporción del hueco, así que toda imagen se declara cuadrada
sin serlo. Encima, `CardForList` la recorta a `h-64` con `object-cover`.

`post_media` no guarda las dimensiones: sus columnas son `id, post_id, url, type, alt, sort_order`.
No es que se lean mal — es que no existen.

### Lo que dice la base (medido el 2026-08-08, descargando las 15 imágenes)

| forma | cuántas | proporción |
| --- | --- | --- |
| **Vertical** | **10** | 0.75 (nueve) y 0.67 (una) |
| Apaisada | 5 | 1.33 |

Las 15 se midieron sin fallos. Tamaños reales: desde `774x1161` hasta `1536x2048`.

**Dos tercios del catálogo son fotos verticales recortadas a un cuadro apaisado de 256 px.** A una
foto de 1200x1600 servida en una columna de 300 px le corresponden 400 px de alto; se enseñan 256, o
sea que **se tira el 36% de la imagen** — y se tira por el centro, que es donde suele estar el
producto.

También es la razón por la que la mampostería que se acaba de montar se nota poco: con las 15
imágenes recortadas a la misma altura, lo único que varía es el largo del título.

Los 8 vídeos quedan fuera: medir un vídeo pide `ffprobe`, y ya se pintan con `aspect-video` (16:9),
que es una suposición razonable y no un recorte.

## Lo que ahorra

Que no se tire un tercio de cada foto. Y la mampostería empieza a tener de dónde: a 300 px de
columna, una vertical mide 400 px y una apaisada 225 px — **1.8× de diferencia**, que es lo que
hace que un listado parezca mampostería y no una rejilla con huecos.

## Por qué

Lo que se vende entra por la foto. Un pan recortado por la mitad es una publicación peor, y hoy le
pasa a 10 de 15.

## Decisiones

### Las columnas van nulables, y no se llenan con un valor por defecto

Un `DEFAULT 1000` sería mentir con la misma mentira de ahora, pero guardada. `NULL` significa «no lo
sabemos», y el código puede distinguirlo y caer al comportamiento de hoy. Es también lo que hace la
migración compatible hacia atrás: el backend de Python lee `post_media` con SQL crudo y columnas
nombradas, así que dos columnas nuevas no le cambian nada.

### El relleno de las 15 filas es un paso aparte, y reversible

La migración solo añade columnas. Rellenarlas es un script que descarga cada imagen, lee su cabecera
y hace `UPDATE` sobre filas reales. Es aditivo —hoy son `NULL`— y se deshace con un `UPDATE … SET
width = NULL, height = NULL`. Va aparte para que la migración no dependa de que 15 descargas salgan
bien.

### La medición se lee de la cabecera, no decodificando la imagen

Ancho y alto viven en los primeros bytes de PNG, JPEG, GIF y WebP. No hace falta ninguna
dependencia nueva ni traer el archivo entero a memoria.

## Los slices

### Slice 1 — La base las guarda y el listado las respeta

**Alcance.**

- Alembic `0030` en el backend: `post_media.width` y `post_media.height`, `integer` nulables, con
  `CHECK` de que sean positivos cuando existan.
- Script de relleno para las 15 imágenes.
- Drizzle (solo lectura del esquema, sin `drizzle-kit generate`) y las consultas que arman `MediaItem`.
- `MediaContent`: usa las reales cuando existen; sin ellas se comporta **exactamente como hoy**.
- `CardForList`: suelta el `h-64` cuando hay dimensiones, y lo mantiene cuando no.

**Criterios de aceptación.**

1. Una publicación con foto vertical se ve más alta que una con foto apaisada en el mismo listado.
2. Ninguna imagen con dimensiones conocidas se recorta.
3. Una fila sin dimensiones —un vídeo, o una imagen que el relleno no pudo medir— se sigue viendo
   como hoy, sin hueco ni salto.
4. El backend de Python sigue leyendo `post_media` sin cambios.

### Slice 2 — Lo que se publique desde ahora llega ya medido

**Alcance.** `ImageVideoUploader` mide el archivo en el navegador antes de subirlo y las manda con
el formulario; `publicar/actions.ts` y `PostgresPostRepository` las guardan.

**Criterios de aceptación.**

1. Al publicar con una foto vertical, su fila de `post_media` queda con las dimensiones reales.
2. Si la medición falla, se publica igual con `NULL` — no se bloquea una publicación por esto.

## Riesgos

- **`alembic upgrade head` corre contra la base compartida.** Añadir columnas nulables es compatible
  hacia atrás, pero lo ven los tres repositorios.
- **El relleno escribe sobre 15 filas reales.** Aditivo y reversible, pero es escritura.
- Sin el slice 2, lo que se publique después queda con `NULL` y se verá como hoy: correcto, pero
  desigual junto a lo ya medido.
