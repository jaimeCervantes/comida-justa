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

## 2026-08-12 - Slice 2: Verlos en la ficha y saber cuantos hay en la tarjeta

### Objetivo

Que los archivos que el slice 1 ya guarda se vean: un carrusel con miniaturas en la ficha y una
insignia con el conteo en la tarjeta del listado.

### Decisiones y racional

- **Con un solo archivo no hay galeria.** `MediaGallery` devuelve el mismo `MediaContent` de siempre
  —sin flechas, sin miniaturas, sin contador— cuando hay uno. Es la mitad del trabajo del componente
  y la que mas facil se rompe: las 23 publicaciones de la base tienen exactamente un archivo y
  ninguna debe cambiar de aspecto por una funcion que no usa. Tiene sus propias pruebas, de
  componente y de e2e, precisamente porque es una ausencia y las ausencias no se notan al mirar.

- **La galeria no pinta archivos, solo decide cual se ve.** Delega en `MediaContent`, que ya sabe
  distinguir imagen de video y ya respeta `width`/`height` reales via `hasKnownAspect`. Escribir un
  segundo renderizador habria significado que las diez imagenes verticales de la base se recortaran
  de nuevo en un sitio y no en el otro.

- **`aria-current` y no `aria-selected` en las miniaturas.** Esto no es un `tablist`: el archivo
  grande no es un panel con contenido interactivo propio, es la misma vista. Anunciarlo como pestanas
  le prometeria a un lector de pantalla una navegacion que no existe.

- **El contador va en `aria-live="polite"`.** Cambiar de archivo no recarga nada; sin esto, quien
  navega con lector de pantalla pulsa «siguiente» y no se entera de que paso algo.

- **Da la vuelta en los dos extremos.** Llegar al ultimo y que la flecha siguiente no haga nada se
  lee como que la galeria se rompio, no como que se acabo.

- **El video se pausa al cambiar de lamina.** Es el fallo mas molesto que puede tener un carrusel y
  no se ve en una captura de pantalla: solo se oye.

- **El `alt` del segundo archivo en adelante lleva su posicion.** Sale de la traduccion, como ya
  hacia la ficha, pero cuatro imagenes con el mismo texto alternativo hacen que un lector de pantalla
  repita la misma frase cuatro veces sin distinguir nada.

- **La miniatura de la galeria usa `img` y no `next/image`.** Son 64 px de un archivo que el
  navegador ya tiene en cache desde la vista grande; `next/image` pediria una segunda version
  optimizada por cada archivo para ahorrar unos kilobytes de algo ya descargado.

- **La portada de la tarjeta no cambia**: sigue siendo el archivo de `sort_order` 0, el mismo que
  leen el carrito, los pedidos y el bot de Python. Lo unico que se anade es el aviso de que detras
  hay mas.

- **`shareMedia.ts` no se toco.** `buildSharePreview` ya recorria el array buscando la primera imagen
  y el primer video por separado, asi que el `og:image` sigue siendo una imagen aunque el primer
  archivo sea un video.

- **Los escenarios del slice 2 siembran por el repositorio en vez de publicar desde la UI**, y por eso
  van en su propio spec (`galeriaDeMedia.spec.ts`). Lo que se prueba aqui es lo que ve quien lee;
  arrastrar el formulario de publicar haria que un fallo de presentacion pareciera uno de subida. El
  `.feature` lleva arriba un comentario diciendo que sus escenarios se reparten en dos specs y por
  que.

- **Una prueba de `PublishForm` pasaba aislada y fallaba en la corrida completa.** No era un fallo del
  codigo: subir es asincrono y las aserciones eran sincronas, asi que con la maquina cargada el DOM
  aun no tenia la bandeja. Se extrajo un `pickFiles` que espera con `findAllBy*`, que ademas describe
  mejor el flujo real.

### Archivos tocados

**Presentacion**
- `src/presentation/media/MediaGallery/MediaGallery.tsx` (nuevo).
- `src/app/[locale]/[slug]/ui/PostDetail.tsx` — mapea el array entero, `alt` con posicion, y entrega
  el resultado a `MediaGallery`.
- `src/presentation/post/CardForList/CardForList.tsx` — insignia de conteo.

**i18n**
- `src/i18n/messages/es.json` y `en.json` — ocho claves nuevas en `post`.

**Especificacion y pruebas**
- `src/presentation/media/MediaGallery/MediaGallery.test.tsx` (nuevo, 11 pruebas).
- `src/e2e/multimedia/galeriaDeMedia.spec.ts` (nuevo, 4 escenarios).
- `src/presentation/post/CardForList/CardForList.test.tsx` — tres pruebas de la insignia.
- `src/app/[locale]/publicar/PublishForm.test.tsx` — `pickFiles` con espera.
- `src/e2e/multimedia/multimediaMultiple.feature` — el puntero a los dos specs.

### Comandos clave

```
pnpm exec biome check --write .
pnpm run typecheck
pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run test:run
```

### Resultados de validacion

- `pnpm run test:run`: **1491 pruebas en 148 archivos, todas en verde**. El slice 1 cerro en 1477/147,
  o sea **14 pruebas nuevas** (11 de `MediaGallery`, 3 de la insignia).
- `pnpm run typecheck` y `pnpm run typecheck:tests`: sin errores.
- `pnpm run lint`: 786 archivos, sin hallazgos.
- `pnpm run check:i18n`: sin texto espanol escrito a mano en los componentes.
- **`pnpm run test:e2e:run`: NO se ejecuto.** Sigue pendiente; ahora son nueve escenarios nuevos.

### Desviaciones del roadmap

- El roadmap decia «un carrusel» sin decir donde vivia el manejador de teclado. Quedo en el
  contenedor, recogiendo lo que burbujea desde las miniaturas: un `section` no es enfocable por si
  mismo, y hacerlo enfocable habria anadido una parada de tabulacion que no lleva a ninguna parte.
- `PostDetail` necesito una anotacion de tipo que no estaba prevista: el `Post` de
  `src/infra/types/Posts.d.ts` acaba en una firma de indice `{ [k: string]: unknown }`, asi que
  `postDetails.media` llega sin forma y recorrerla dejaria los parametros en `any` implicito. Es
  deuda anterior a esta entrega —el tipo bueno es el del dominio— y aqui solo se le puso nombre a lo
  que ya viajaba.

### Pendientes

- **La suite de Playwright sigue sin correrse** (nueve escenarios nuevos entre los dos slices).
- `src/infra/types/Posts.d.ts` define un `Post` auto-referencial que termina en una firma de indice,
  o sea que no tipa nada. Deberia ser el `Post` del dominio. Es una limpieza aparte.
- Los dummies `post-2.jpg` y `post-3.jpg` siguen siendo copias byte a byte de `post.jpg`.

### Recap

La feature esta completa de punta a punta: se suben varios archivos, se guardan ordenados y se ven.
La ficha los recorre con flechas, miniaturas y contador, con teclado y con anuncios para lector de
pantalla; la tarjeta del listado dice cuantos hay sin que haya que abrirla; y una publicacion con un
solo archivo —las 23 que hay hoy— se ve exactamente igual que antes, cosa que comprueban una prueba
de componente y un escenario de e2e. Lo unico que queda fuera es editar la media de una publicacion
ya creada, que es el slice 3 y sigue marcado `@future`. Validacion local completa salvo Playwright.

### Proximos pasos (opciones)

1. **Correr la e2e** (recomendado): es lo unico que falta para dar por cerrados los dos slices.
2. **Abrir el PR contra `dev`** una vez la e2e pase.
3. **Seguir con el slice 3** (editar: anadir, quitar y reordenar), que exige un `updateMedia`
   transaccional nuevo en `PostgresPostAdminRepository` y llevar `media` hasta `EditablePostValues` y
   `PostContentUpdate`.
4. **Ver la feature funcionando a mano** con `pnpm run dev` antes de nada.

**Acciones pendientes del usuario:**

```
pnpm run test:e2e:run -- src/e2e/multimedia      # los 9 escenarios nuevos
pnpm run test:e2e:run -- src/e2e/createPost      # los que tocaban PublishPage y el stub
pnpm run test:e2e:run                            # la completa, en dos mitades si la RAM protesta
```

La rama es `feat/multimedia-multiple` en
`C:\Users\S2G52\personal\DEV\salud-justa\comida-justa-multimedia`, y va contra `dev`.
