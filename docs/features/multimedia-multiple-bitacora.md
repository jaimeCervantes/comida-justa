# Bitacora - Multimedia multiple por publicacion

## 2026-08-12 - Slice 1: Publicar varios archivos

### Objetivo

Que una publicacion pueda llevar hasta diez imagenes o videos en vez de uno, guardados en su orden.
Solo el camino de escritura: verlos en la ficha es el slice 2.

### Decisiones y racional

- **El trabajo se hizo en un clon aparte** (`../comida-justa-multimedia`, rama
  `feat/multimedia-multiple` desde `origin/dev`) porque el arbol principal tenia sin commitear la
  feature `invitacion-a-practicar`. Los `.env*` estan en `.gitignore`, asi que se copiaron a mano; sin
  ellos no hay `DATABASE_URL` ni credenciales de Firebase. **Ojo: `.env.development` y
  `.env.production` apuntan al mismo Supabase**, y el `globalTeardown` de Playwright falla si
  encuentra restos ajenos, asi que no conviene correr las dos suites e2e a la vez desde las dos
  carpetas.

- **El cuello de botella era un solo tipo, y todo lo demas ya estaba hecho.** `post_media` ya
  ordenaba por `sort_order`, las cuatro consultas de lectura ya devolvian arrays y
  `PostgresPostRepository` ya sabia insertar N filas. Lo unico que lo impedia era
  `Post.media: PostMediaFile` en singular. **No hubo migracion de Alembic**: la base no necesitaba
  nada.

- **`validateMedia` comprueba el tope pero no un minimo.** Parece una omision y no lo es: la edicion
  valida una publicacion cuyo formulario ni siquiera muestra la media, y antes le pasaba un archivo
  inventado (`{ url: "", type: "" }`) solo para satisfacer el tipo singular. Ahora le pasa `[]`, y un
  minimo aqui haria imposible corregir un titulo. Que publicar exija un archivo sigue siendo cierto,
  pero es regla del formulario y vive en `errors.media` de la Server Action, que ademas puede
  contestarle a la persona en su idioma.

- **El tope (10) vive en `src/domain/` y no en `src/infra/constants/`.** Las constantes de ahi se
  leen de `process.env`, y CI corre sin ningun `.env`: un tope env-driven valdria una cosa en local y
  otra en GitHub, y la prueba que lo comprobara seria un fantasma distinto en cada maquina.

- **El nombre del archivo en Cloud Storage gano un discriminante.** Era `${Date.now()}-${file.name}`,
  y con un archivo por publicacion bastaba. Con varios deja de bastar: dos fotos llamadas
  `IMG_0001.jpg` —lo normal al elegir varias de la galeria del telefono— entran en el mismo
  milisegundo y **la segunda sobrescribia a la primera**. Ahora lleva ocho caracteres de un UUID.

- **La acumulacion vive en el formulario, no en el hook.** Es la decision que mas se penso. Un hook
  que acumulara habria dejado a `StoreProfileForm` —el logo de una tienda, que es uno y solo uno—
  leyendo para siempre `media[0]`, o sea el primer logo que subio la persona. Asi que
  `useStorageUpload.media` es *lo subido en esta tanda* y quien junta tandas es `PublishForm`, que es
  el unico que tiene una lista.

- **Se suben en serie, no en paralelo.** Hay una sola barra de progreso: en paralelo mostraria el
  porcentaje del ultimo `onprogress` que llegara, un numero que sube y baja sin significar nada. Y
  tres videos a la vez compiten por el mismo ancho de banda de un telefono y terminan mas tarde que
  en fila.

- **La vista previa local del selector se apaga con `multiple`.** Con varios archivos habria dos
  sitios pintando lo elegido —la previa y la bandeja— y la previa enseñaria el primero de la ultima
  tanda como si fuera el unico. El caso de uno solo (el logo) si la conserva, porque ahi no hay
  ninguna otra.

- **`Thumbnail` se reutilizo en vez de escribir un tercer renderizador de media.** Es decorativa a
  proposito (`alt=""`, `aria-hidden`), que es justo lo que hace falta: quien nombra cada miniatura es
  el boton de quitar que tiene al lado, y ese si dice la posicion. Solo hizo falta añadir la rama de
  video, que `Thumbnail` no cubre y no deberia cubrir.

- **Quitar el `as unknown as` destapo dos bugs latentes** que llevaban ahi desde antes de esta
  feature, y que el propio comentario del archivo anticipaba (*«cualquier campo que se olvide aqui se
  pierde en silencio»*):
  1. `kind` y `origin` son columnas `text`, o sea que la base los entrega como cadena pelada mientras
     el dominio los tiene como uniones cerradas. Ahora se estrechan con `isValidKind`/`isValidOrigin`,
     los mismos type guards que usa el validador.
  2. **`seller` se escribia pero no existia en `ISearchPostResultDTO`.** `mapPostsToCards` lo lee
     (`item.seller ?? null`), asi que funcionaba de milagro: el cast impedia que TypeScript comparara
     nada. Se declaro en el DTO —con la forma `SearchStoreIdentity`, que el repositorio ahora importa
     en vez de declararla por su cuenta—.

- **Caen tres literales espanoles hardcodeados** que estaban justo en las lineas tocadas:
  `PublishForm.tsx:60` (`"Cambia tu mejor imagen…"`), y los dos mensajes de error de `actions.ts`
  —uno de ellos con la errata «recourso»—.

- **El `required` del campo oculto se quito porque nunca hizo nada**: el navegador no valida un input
  oculto. Prometia una comprobacion que no existia. El guardian real es la Server Action, y ahora
  ademas comprueba **lo que se pudo interpretar** y no que el campo traiga texto: antes un JSON roto
  pasaba el filtro y la publicacion se guardaba sin ninguna imagen.

### Archivos tocados

**Dominio**
- `src/domain/entities/post/mediaPayload.ts` (nuevo) — el tope, `mediaTypeFromMime` y
  `parsePostMediaPayload`.
- `src/domain/entities/post/types.ts` — `media` pasa a `PostMediaFile[]`.
- `src/domain/schemas/PostValidator.ts` — `validateMedia` y `PostMediaError`.

**Casos de uso y DTOs**
- `src/use_cases/createOnePost/createOnePostUseCase.ts` — cae el cast.
- `src/use_cases/createOnePost/dummies.ts`, `src/use_cases/managePost/updateOnePostUseCase.ts`.
- `src/use_cases/searchPosts/dtos/ISearchPostResultDTO.ts` — `seller` y `SearchStoreIdentity`.

**Infraestructura**
- `src/infra/dataAccess/createOnePost/PostgresPostRepository.ts` — filtro por elemento e indice
  despues de filtrar.
- `src/infra/dataAccess/searchPosts/PostgresSearchPostRepository.ts` — `satisfies` en vez del cast.
- `src/infra/UI/hooks/useStorageUpload.ts` — `uploadFiles` en serie, `media` como lista.
- `src/scripts/seedHazloSanoProducts.ts`.

**Presentacion**
- `src/presentation/media/PostMediaTray/PostMediaTray.tsx` (nuevo).
- `src/presentation/media/ImageVideoUploader/ImageVideoUploader.tsx` — recorre el `FileList`.
- `src/presentation/media/ImageVideoPicker/ImageVideoPicker.tsx` — previa solo sin `multiple`.
- `src/app/[locale]/publicar/PublishForm.tsx`, `src/app/[locale]/publicar/actions.ts`,
  `src/app/[locale]/cuenta/ui/StoreProfileForm.tsx`.

**i18n**
- `src/i18n/messages/es.json` y `en.json` — siete claves nuevas en `publish`.

**Especificacion y pruebas**
- `docs/features/multimedia-multiple.md` (nuevo), `src/e2e/multimedia/multimediaMultiple.feature`
  (nuevo).
- `src/domain/entities/post/mediaPayload.test.ts` (nuevo),
  `src/presentation/media/PostMediaTray/PostMediaTray.test.tsx` (nuevo),
  `src/e2e/multimedia/multimediaMultiple.spec.ts` (nuevo).
- `src/domain/schemas/PostValidator.test.ts`, `src/app/[locale]/publicar/PublishForm.test.tsx`,
  `src/use_cases/createOnePost/createOnePostUseCase.test.ts`,
  `src/use_cases/searchPosts/SearchPostsUseCase.test.ts`.
- `src/e2e/testUtils/stubStorageUpload.ts` (URLs rotatorias), `src/e2e/testUtils/seedPost.ts`
  (`mediaCount`), `src/e2e/createPost/PublishPage.ts` (varios archivos, bandeja, quitar).
- `src/e2e/dummies/post-2.jpg`, `post-3.jpg`, `post.mp4` (nuevos; el video generado con ffmpeg,
  320x240, 1 s, 2.3 KB).

### Comandos clave

```
git clone comida-justa comida-justa-multimedia
git checkout -B dev origin/dev && git checkout -b feat/multimedia-multiple
pnpm install
pnpm exec biome check --write .
pnpm run typecheck
pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run test:run
```

### Resultados de validacion

- `pnpm run test:run`: **1477 pruebas en 147 archivos, todas en verde**. Antes del slice eran 1436 en
  145, o sea **41 pruebas nuevas** (18 de `mediaPayload`, 8 de `PostValidator`, 7 de `PostMediaTray`,
  8 de `PublishForm`).
- `pnpm run typecheck` y `pnpm run typecheck:tests`: sin errores.
- `pnpm run lint`: 783 archivos, sin hallazgos.
- `pnpm run check:i18n`: sin texto espanol escrito a mano en los componentes.
- **`pnpm run test:e2e:run`: NO se ejecuto.** Queda como pendiente declarada; ver abajo.

### Desviaciones del roadmap

- El roadmap contaba con cuatro ripples del tipo plural y salieron **seis**: `seedHazloSanoProducts.ts`
  y `createOnePost/dummies.ts` no estaban previstos, mas dos en tests (`seedPost.ts`,
  `SearchPostsUseCase.test.ts`) que solo aparecen con `typecheck:tests`.
- No estaban previstos los dos bugs que destapo quitar el cast (`kind`/`origin` sin estrechar y
  `seller` fuera del DTO). Se arreglaron aqui porque son consecuencia directa del cambio: dejarlos
  habria obligado a devolver el cast y perder lo que se venia a ganar.
- Se añadio `mediaCount` a `seedPost` antes de tiempo: lo pide el slice 2 y el archivo ya estaba
  abierto por el ripple del tipo.

### Pendientes

- **La suite de Playwright no se ha corrido.** El escenario nuevo escribe en la base compartida y se
  limpia solo (`deleteOnePostBySlug` en `afterEach`, mas el barrido global), pero la corrida la hace
  el usuario.
- Los dummies `post-2.jpg` y `post-3.jpg` son copias byte a byte de `post.jpg`. Basta para la e2e
  —lo que las distingue es el nombre y la URL que devuelve el stub—, pero si algun escenario futuro
  compara pixeles habra que generarlas distintas.

### Recap

El camino de escritura ya es plural de punta a punta: el formulario acumula archivos en una bandeja
numerada con su contador y su boton de quitar, la Server Action los interpreta con una funcion de
dominio probada, y el repositorio los inserta con su `sort_order`. El tope de diez se aplica en el
navegador (recortando la seleccion) y otra vez en el servidor. La lectura ya devolvia arrays desde
antes, asi que la base ya guarda varias filas por publicacion; lo que todavia no ocurre es que se
vean: la ficha sigue pintando `media[0]` y la tarjeta no dice cuantos hay. Validacion local completa
salvo Playwright.

### Proximos pasos (opciones)

1. **Correr la e2e y luego seguir con el slice 2** (recomendado): confirmar que los cinco escenarios
   nuevos pasan antes de construir encima.
2. **Ir directo al slice 2** (`MediaGallery` en la ficha + insignia de conteo en la tarjeta) y correr
   la e2e una sola vez al final, con los dos slices dentro.
3. **Parar aqui y revisar** lo que hay antes de continuar.

**Acciones pendientes del usuario:**

```
pnpm run test:e2e:run -- src/e2e/multimedia      # solo lo nuevo, 5 escenarios
pnpm run test:e2e:run -- src/e2e/createPost      # los que tocaban PublishPage y el stub
pnpm run test:e2e:run                            # la completa, en dos mitades si la RAM protesta:
                                                 #   --shard=1/2 y --shard=2/2, matando los node huerfanos antes
```
