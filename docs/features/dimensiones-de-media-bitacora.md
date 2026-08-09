# Bitácora — Las dimensiones de cada archivo

## Slice 1 — La base las guarda y el listado las respeta (2026-08-08)

### Objetivo

Que una foto vertical deje de recortarse a un cuadro apaisado, y que la mampostería recién montada
tenga de dónde sacar alturas distintas.

### Lo que se midió antes de decidir nada

Se descargaron las 15 imágenes de la base y se leyó su cabecera. **15/15 medidas**, y el reparto
decidió que la entrega valía la pena:

| forma | cuántas | proporción |
| --- | --- | --- |
| **Vertical** | **10** | 0.75 (nueve) y 0.67 (una) |
| Apaisada | 5 | 1.33 |

A una foto de 1200x1600 servida en una columna de 300 px le tocan 400 px de alto y se enseñaban 256:
**se tiraba el 36%, y por el centro**, que es donde está el producto. Si las 15 hubieran sido
cuadradas, esto no se habría construido.

### Decisiones y por qué

**Nulables, y sin valor por defecto.** Un `DEFAULT 1000` sería la mentira de hoy pero guardada en la
base, y más difícil de deshacer. `NULL` es la verdad para los 8 vídeos —medirlos pediría `ffprobe`—
y para todo lo publicado antes del slice 2. El código distingue el nulo y cae al comportamiento
anterior, así que la migración por sí sola no cambia nada: habilita.

**El `CHECK` valida cada columna por su lado, no que estén las dos.** Que falte una es un estado
legítimo a medio camino; lo que no puede haber es un `0`, que no significa «no lo sé» —para eso está
`NULL`— y produciría una división por cero al calcular la proporción.

**El relleno va fuera de la migración.** Descarga 15 archivos por la red, y una migración no debe
depender de que quince descargas salgan bien. Tiene `--dry-run`, y se deshace con
`UPDATE post_media SET width = NULL, height = NULL`.

**Se lee la cabecera, no la imagen.** Ancho y alto viven en los primeros bytes de PNG, JPEG, GIF y
WebP. Cero dependencias nuevas en el backend.

**La decisión de «¿se puede pintar con su forma?» es dominio, no CSS.** `mediaAspect.ts` es una
función pura con quince casos de prueba, incluidos los tamaños reales de la base. Puesta en el JSX
no se podría probar sin navegador, y la regla —hacen falta **las dos** dimensiones, y positivas— es
justo la que hay que poder leer de un vistazo.

**El tipo del archivo se unificó.** Estaba escrito a mano en **cuatro** sitios, que es la razón de
que añadirle un campo doliera: el `typecheck` falló en el cuarto. Ahora `PostMediaFile` vive una vez
en el dominio y los otros lo importan.

### Archivos tocados

**Backend (`bot-whatsapp/backend`)**
- `alembic/versions/0030_2026-08-08_add_post_media_dimensions.py` (nuevo).
- `scripts/backfill_post_media_dimensions.py` (nuevo).

**Dominio**
- `src/domain/entities/post/mediaAspect.ts` (+ test, nuevos).
- `src/domain/entities/post/types.ts` — nace `PostMediaFile`.

**Infra**
- `db/schema/posts.ts` — `width` y `height` (solo lectura; Alembic manda).
- `posts/PostgresPostQueryRepository.ts` — el `jsonb_build_object` las trae.
- `searchPosts/PostgresSearchPostRepository.ts`, `posts/IPostQueryRepository.ts` — usan el tipo único.

**Presentación**
- `media/MediaContent/MediaContent.tsx` (+ test) — usa las reales cuando existen.
- `post/CardForList/CardForList.tsx` — suelta el `h-64` **solo** cuando se sabe la forma.

### Comandos

```
uv run alembic upgrade head
uv run python scripts/backfill_post_media_dimensions.py --dry-run
uv run python scripts/backfill_post_media_dimensions.py
pnpm run typecheck && pnpm run lint && pnpm run test:run
```

### Validación

| Comprobación | Resultado |
| --- | --- |
| `alembic_version` | `0030_2026_08_08` |
| Columnas | `width` y `height`, `integer`, nulables |
| `CHECK` | `post_media_dimensions_positive` existe |
| Imágenes con dimensiones | **15/15** — 10 verticales, 5 apaisadas |
| Vídeos con dimensiones | 0/8, que es lo esperado |
| `pnpm run test:run` | **1031/1031** en 105 archivos (26 nuevas) |
| `pnpm run typecheck` / `lint` | limpios |
| e2e | **NO EJECUTADA** — el `next dev` del usuario ocupa el puerto |

### Lo que se escribió en la base compartida

- **DDL:** dos columnas nulables y un `CHECK` sobre `post_media`. Compatible hacia atrás: los tres
  repositorios leen esa tabla con columnas nombradas, ninguno con `SELECT *`. Se deshace con
  `uv run alembic downgrade 0029_2026_08_08`.
- **Datos:** 15 `UPDATE` sobre `post_media`, rellenando columnas que estaban en `NULL`. Se deshace
  con `UPDATE post_media SET width = NULL, height = NULL`.

### Recap

La base ya sabe la forma de sus 15 imágenes y la web la respeta: donde hay dimensiones el hueco nace
con la proporción real y no se recorta nada; donde no las hay —los 8 vídeos— todo sigue exactamente
como estaba. Con 10 verticales y 5 apaisadas, la mampostería pasa a tener 1.8× de diferencia de
altura entre unas y otras, que era lo que le faltaba. 1031 pruebas unitarias, `typecheck` y `lint`
en verde; la e2e queda pendiente.

### Próximos pasos (opciones)

1. **Correr la e2e completa**, con el dev server parado. Es lo único sin verificar.
2. **Slice 2** — que `/publicar` capture las dimensiones al subir, para que lo nuevo no nazca en
   `NULL` y se vea desigual junto a lo ya medido.
3. **Commitear**, en una rama propia: los cambios de mampostería y estos están sobre `dev` sin
   commitear.

**Pendiente del usuario:** correr la e2e y decidir el reparto de commits.

---

## Slice 2 — Lo que se publique desde ahora llega ya medido (2026-08-08)

### Objetivo

Que lo nuevo no nazca en `NULL`. Sin esto, el slice 1 dejaba una foto recién publicada recortada al
lado de las quince que sí se ven enteras: peor que uniforme, porque la diferencia parece un fallo.

### Decisiones y por qué

**Se mide en el navegador, no en el servidor.** Subir es **el único momento en que el archivo está
en la mano**: a la Server Action le llega una URL y nada más, así que medirla la obligaría a
descargar lo que el navegador acaba de subir. Y se mide **después** de subir, no antes, para no
retrasar la subida con una decodificación.

**`createImageBitmap` primero, `<img>` de respaldo.** El primero decodifica fuera del hilo principal
y no toca el DOM; el segundo cubre los navegadores que no lo traen y los formatos que rechaza. Los
dos liberan lo que reservan —`bitmap.close()` y `revokeObjectURL`—: una copia decodificada de una
foto de 12 Mpx ocupa decenas de MB, y publicar varias en una sesión las iría acumulando.

**Nunca lanza.** Ante cualquier problema devuelve `{}`, que significa «no lo sabemos» y es un valor
legítimo en la base. Publicar no puede fallar porque una medición no salga.

**Solo imágenes.** Un vídeo se mediría con `<video>` y `loadedmetadata`, pero hoy se pintan con
`aspect-video` fijo: guardar unas dimensiones que nadie lee sería código muerto.

**`UploadedMedia` sustituye a `Record<string, string>`.** Con el tipo viejo las dimensiones no
cabían sin convertirlas a texto para volver a parsearlas al otro lado.

**`ImageSize` es más estrecho que `MediaDimensions`.** El de la base admite nulos porque la columna
los admite; medir no produce un `null`, produce una medida o ninguna. Mezclarlos fue justo lo que
señaló el `typecheck`.

**Se insertan `null` y no `undefined`.** Drizzle omite del INSERT las claves indefinidas, y la
columna acabaría en su valor por omisión en vez de en el nulo explícito. Hoy da igual —no tienen
`DEFAULT`— pero el día que alguien les ponga uno deja de ser cosmético.

### Archivos tocados

- `src/infra/UI/media/readImageSize.ts` (+ test, nuevos).
- `src/infra/UI/hooks/useStorageUpload.ts` — mide y expone `UploadedMedia`.
- `src/presentation/media/ImageVideoUploader/ImageVideoUploader.tsx` — usa el tipo nuevo.
- `src/app/[locale]/publicar/actions.ts` — las pasa al caso de uso.
- `src/infra/dataAccess/createOnePost/PostgresPostRepository.ts` — las guarda.
- `src/e2e/dimensionesMedia/dimensionesMedia.feature` — slice 2 detallado, ya sin `@future`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **1036/1036** en 106 archivos (5 nuevas) |
| `pnpm run typecheck` / `lint` | limpios |
| e2e | **NO EJECUTADA** — el `next dev` del usuario ocupa el puerto |

### Recap

El ciclo queda cerrado: la base guarda las dimensiones, el listado las respeta y lo que se publique
desde ahora llega medido desde el navegador. Lo que no se pueda medir —los vídeos, o una imagen que
el navegador no decodifique— sigue el camino de siempre sin romper nada. 1036 pruebas unitarias,
`typecheck` y `lint` en verde.

### Próximos pasos (opciones)

1. **Correr la e2e completa** con el dev server parado. Es lo único sin verificar de los dos slices.
2. **Publicar una foto vertical de prueba** desde `/publicar` y comprobar en la base que su fila
   nace con las dimensiones — es la verificación de punta a punta que ninguna prueba unitaria da.
3. **Commitear** la mampostería y estos dos slices, en una rama propia: hoy están sobre `dev` sin
   commitear.
4. **Medir también los vídeos**, si algún día dejan de pintarse a 16:9 fijo.

**Pendiente del usuario:** correr la e2e y decidir el reparto de commits.
