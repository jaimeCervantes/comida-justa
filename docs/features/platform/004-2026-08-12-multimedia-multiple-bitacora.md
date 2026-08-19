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
- `docs/features/platform/004-2026-08-12-multimedia-multiple.md` (nuevo), `src/e2e/multimedia/multimediaMultiple.feature`
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

## 2026-08-13 - Slice 3: Editar la media de una publicacion

### Objetivo

Que quien ya publico pueda anadir, quitar y reordenar sus archivos sin volver a publicar la ficha
entera. Era el ultimo slice del roadmap y el unico que seguia `@future`.

### Decisiones y racional

- **Un solo campo para las dos pantallas.** La aritmetica de la lista —acumular, deduplicar, quitar,
  mover, recortar al tope— vivia dentro de `PublishForm`. Editar habria exigido copiarla entera a un
  segundo formulario, y a partir de ahi cada arreglo habria tenido que hacerse dos veces o, mas
  probable, una. Sale a `PostMediaField`, y la unica diferencia entre publicar y editar pasa a ser un
  prop: de donde sale la lista inicial.

- **Se reemplaza el conjunto, no se calcula un diff.** Un diff necesitaria una identidad estable por
  archivo, y lo unico que el formulario y la base comparten es la URL de Cloud Storage; con ella,
  mover dos archivos de sitio se veria igual que borrarlos y volverlos a crear. Reemplazar es seguro
  porque **nada apunta a `post_media.id`**: el carrito, los pedidos y el bot leen por `post_id`, asi
  que ninguna fila de otra tabla se queda huerfana al rehacerlas.

- **Los archivos van en la misma transaccion que el texto.** Separarlos dejaria el hueco en el que la
  publicacion se queda sin portada que ensenar, y esa fila es justo la que piden esas tres consultas
  con `ORDER BY sort_order LIMIT 1`. Por eso no hay un `updateMedia` en el puerto —que era lo que
  preveia el roadmap— sino un `replaceMedia` privado dentro de `updateContent`.

- **Leer los archivos en su propia consulta y no en un `JOIN`.** Unir multiplicaria la fila de la
  publicacion por cada archivo y habria que volver a plegarla: el mismo trabajo, hecho a mano y con
  un `LIMIT 1` que de pronto significaria otra cosa. Son dos preguntas distintas sobre la misma
  publicacion.

- **Al menos un archivo, y la regla vive en la Server Action.** No es una condicion para que la
  entidad sea coherente —`validateMedia` sigue sin exigir minimo, y si lo exigiera corregir un titulo
  seria imposible—: es del formulario, porque quien puede contestarle a la persona en su idioma es
  esa capa. Es la misma decision que su gemela al publicar.

- **Reordenar es de a un puesto, con dos flechas.** No hay arrastrar y soltar: con un tope de 10
  miniaturas, dos toques llevan cualquier archivo a la portada, y el arrastre habria traido su propia
  accesibilidad de teclado que hay que escribir aparte. Las flechas solo se pintan donde pueden hacer
  algo; un boton deshabilitado en cada punta seria una parada mas del teclado para no hacer nada.

- **Reordenar se prueba como componente, no dos veces en e2e.** El mismo `PostMediaTray` lo pintan
  las dos pantallas, asi que llevarlo al navegador por duplicado seria pagar dos minutos por la misma
  certeza. La e2e comprueba que lo reordenado **llega a `post_media`**; el componente, la aritmetica
  del orden. Los escenarios de la bandeja van marcados `@component` en el `.feature`.

- **La deduplicacion cae a la URL cuando no hay `path`.** Los recien subidos traen su ruta en Cloud
  Storage, unica por archivo; los que vienen de `post_media` no tienen ninguna. Sin esa caida, dos
  archivos guardados se habrian visto como «el mismo indefinido» y la bandeja habria ensenado uno.

- **Cambiar solo los archivos no pide reindexar.** El vector se deriva del texto, asi que reindexar
  ahi seria pagarle al proveedor por volver a calcular lo mismo. Tiene su prueba.

- **`MediaTray` centraliza las etiquetas de la bandeja en la e2e.** `PublishPage` las buscaba con un
  regex local de `archivo N` que, desde que cada archivo tiene sus dos flechas, casa con tres
  botones: Playwright falla por ambiguo. Ahora el proximo boton de la bandeja rompe un archivo y no
  cada pantalla que la maneja.

### Archivos tocados

**Presentacion (el campo compartido)**

- `src/presentation/media/PostMediaField/PostMediaField.tsx` y `.test.tsx` (nuevos): la lista, su
  bandeja y el campo oculto, con 18 pruebas.
- `src/presentation/media/PostMediaTray/PostMediaTray.tsx` y `.test.tsx`: las dos flechas y `onMove`.
- `src/app/[locale]/publicar/PublishForm.tsx` y `.test.tsx`: adelgazados; el formulario ya solo
  comprueba que **lleva el campo puesto**, que es lo unico que ninguna prueba del componente ve.

**Edicion**

- `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`, `page.tsx` y `actions.ts`.
- `src/use_cases/managePost/updateOnePostUseCase.ts`, `ports/IPostAdminRepository.ts` y
  `managePost.test.ts`.
- `src/infra/dataAccess/managePost/PostgresPostAdminRepository.ts`: `replaceMedia` y `readMedia`.

**i18n**

- `src/i18n/messages/{es,en}.json`: `mediaMoveEarlier` y `mediaMoveLater`.

**e2e**

- `src/e2e/multimedia/editarMedia.spec.ts` (nuevo): 4 escenarios.
- `src/e2e/testUtils/mediaTray.ts` y `readPostMedia.ts` (nuevos).
- `src/e2e/createPost/PublishPage.ts`, `src/e2e/multimedia/multimediaMultiple.spec.ts` y su
  `.feature`.
- `src/e2e/testUtils/warmRoutes.ts`: `/editar/...` entra a la lista de rutas calientes; con el campo
  de archivos, ese segmento se volvio caro de compilar.

### Comandos clave

```
pnpm run typecheck && pnpm run typecheck:tests
pnpm run lint
pnpm run check:i18n
pnpm run test:run
pnpm exec playwright test --shard=1/2      # y --shard=2/2; nunca de una sola vez
```

### Resultados de validacion

- `pnpm run test:run`: **1536 pruebas en 151 archivos, todas en verde**. El slice 2 cerro en
  1491/148, o sea **45 pruebas nuevas** (18 de `PostMediaField`, 3 de mover en la bandeja, 3 del caso
  de uso, y el resto redistribuidas al mudar la lista fuera de `PublishForm`).
- `pnpm run typecheck` y `pnpm run typecheck:tests`: exit 0.
- `pnpm run lint`: 799 archivos, sin hallazgos.
- `pnpm run check:i18n`: exit 0.
- **`pnpm run test:e2e:run`: ejecutada, y por fin completa.** En dos mitades: `--shard=1/2` dio
  **139 pasados, 3 saltados** (8.4 min) y `--shard=2/2` **141 pasados** (8.6 min). Total: **280 en
  verde, 3 saltados, 0 fallos**. El `globalTeardown` no protesto en ninguna, asi que la base
  compartida quedo sin residuos.
- La carpeta sola, para iterar rapido: `playwright test src/e2e/multimedia` da **13 pasados** (2.4
  min).

### Desviaciones del roadmap

- **`PostMediaField` no estaba previsto.** El roadmap daba por hecho que la edicion pintaria la
  bandeja por su cuenta; al escribirlo se vio que eso era copiar la lista entera, y la extraccion
  acabo siendo el grueso del slice. Va en su propio commit (`refactor`), separada de la feature.
- **No hay `updateMedia` en el puerto.** El roadmap pedia «un `updateMedia` transaccional»; lo que
  hay es un `replaceMedia` privado **dentro** de `updateContent`, porque el texto y los archivos
  tienen que viajar en la misma transaccion y dos metodos habrian invitado a llamarlos por separado.
- **Una regla nueva: al menos un archivo.** No estaba en ningun criterio de aceptacion. Aparecio al
  probar «quito el unico que hay»: hasta este slice ningun camino de escritura podia dejar una
  publicacion sin archivos, asi que nadie habia tenido que prohibirlo.
- **La portada se cambia moviendo de a un puesto**, no arrastrando el tercero al primer sitio como
  sugeria el criterio. El resultado en `post_media` es el mismo y lo comprueba la e2e.
- **El fallo de `createPost.spec.ts:31`** que aparecio en la primera corrida de la suite no era de
  este slice: `/api/auth/providers` se compilaba en frio dentro de los 5 s de `toBeVisible`. Se
  arreglo calentando esa ruta (commit `b8a691a`, anterior a este slice).

### Pendientes

- **Los tres commits se hicieron con `--no-verify`, a peticion del usuario.** El gancho `pre-commit`
  corre `pnpm run validate`, que incluye `test:e2e:run` **de una sola vez** —justo lo que esta
  maquina no aguanta, y unos 20 min por commit—. La validacion se corrio a mano y esta arriba.
  Conviene arreglar el gancho: que no corra la e2e, o que la corra en mitades.
- `src/infra/types/Posts.d.ts` sigue definiendo un `Post` auto-referencial que termina en una firma
  de indice, o sea que no tipa nada. Deuda anterior, limpieza aparte.
- Los dummies `post-2.jpg` y `post-3.jpg` siguen siendo copias byte a byte de `post.jpg`.

### Recap

La feature esta cerrada de punta a punta y los tres slices estan en `dev`. Una publicacion lleva
hasta 10 archivos, se suben de golpe y acumulando, se ven en la ficha con galeria y en la tarjeta con
su insignia, y desde este slice se editan: anadir, quitar y cambiar cual es la portada, con el mismo
campo en las dos pantallas y una sola transaccion que guarda el texto y los archivos juntos. Lo unico
que no se puede es dejar la publicacion sin ninguno. Validacion local completa **incluida la e2e**,
que es lo que quedaba pendiente desde el slice 1: 280 escenarios en verde.

### Proximos pasos (opciones)

1. **Arreglar el gancho `pre-commit`** (recomendado): hoy corre la e2e completa de una sola vez, que
   es lo que obligo a saltarselo. Sin eso, el proximo commit vuelve a elegir entre 20 minutos o
   `--no-verify`.
2. **Ver la edicion a mano** con `pnpm run dev`: es la primera pantalla donde se reordena, y el
   tamano de las flechas sobre la miniatura solo se juzga mirandolo.
3. **Limpiar `src/infra/types/Posts.d.ts`** y dejar el `Post` del dominio como unico tipo.
4. **Dummies de verdad** para `post-2.jpg` y `post-3.jpg`: hoy son el mismo archivo tres veces, asi
   que ningun escenario podria detectar que se ensena la imagen equivocada.

**Acciones pendientes del usuario:** ninguna para dar por cerrada la feature. `dev` esta pusheado en
`e3336b9`.

## 2026-08-13 - Slice 4: Verla en grande y arrastrarla de sitio

### Objetivo

La bandeja se quedo corta en cuanto se pudo editar. Con 88 px se distingue que hay tres archivos
pero no cual es cada uno, y llevar el cuarto a la portada costaba tres toques de flecha. Tres piezas:
ver el archivo en grande, arrastrarlo de sitio, y miniaturas mas grandes.

### Decisiones y racional

- **Las tres piezas son de `PostMediaTray`**, asi que publicar y editar las reciben a la vez sin
  tocar ninguna de las dos pantallas. Es el dividendo del slice anterior: cuando la bandeja vivia
  dentro de `PublishForm`, esto habria sido dos cambios o —mas probable— uno.

- **La vista grande no pinta el archivo: se lo pide a `MediaContent`.** Es el mismo que usan la ficha
  publica y la galeria, y ya sabe distinguir un video de una imagen y respetar `width`/`height`
  reales. Un segundo renderizador habria vuelto a decidir por su cuenta que hacer con una foto
  vertical, y las dos pantallas se habrian separado el dia que una cambiara.

- **El tipo se normaliza con `mediaTypeFromMime` antes de entrar.** `MediaContent` conmuta por
  categoria (`image`, `video`) y en el formulario el tipo todavia puede ser el MIME del archivo
  recien subido (`image/jpeg`). Sin normalizar, un video caia en `DefaultContent` y se pintaba como
  un enlace de descarga. Tiene su prueba.

- **No es un `<dialog>` nativo, y no por gusto.** El nativo trae foco atrapado y `Escape` de fabrica,
  pero `showModal()` no existe en el jsdom 24 con el que corren las pruebas de componente: la mitad
  del comportamiento no se podria comprobar en ninguna parte. Se escribe a mano lo que el nativo
  daria —`Escape`, clic en el fondo, foco al abrir y devuelto al cerrar—, y asi cada pieza tiene su
  prueba. Si algun dia sube el jsdom, esto se puede cambiar por el nativo con las pruebas ya escritas.

- **Solo el fondo cierra, y se compara `event.target` con `event.currentTarget`.** Con un
  `onClick={onClose}` a secas en el fondo, el clic en el boton de cerrar burbujeaba hasta el y
  `onClose` corria **dos veces**. Lo encontro la prueba antes que nadie. Comparar el objetivo evita
  ademas tener que parar la burbuja en cada hijo, que era la otra salida y deja mas codigo.

- **El titulo y la etiqueta de cerrar llegan como props.** La vista grande no sabe si la abre
  publicar o editar, asi que no puede saber de que espacio de nombres salen sus textos. Es la misma
  regla que `loadingLabel` en `Button`.

- **Las flechas se quedan.** Arrastrar es de raton; el teclado y el lector de pantalla solo tienen
  las flechas. Cambiar una mejora por una regresion de accesibilidad no es un cambio que valga la
  pena, y hay una prueba que falla si alguien las quita.

- **De donde sale el arrastre va en una `ref`, no en el estado.** Cambia en cada `dragover`, y un
  `setState` por evento repintaria la lista entera decenas de veces mientras se arrastra. Lo que si
  se pinta —cual se esta arrastrando, que se ve translucido— va en estado y cambia dos veces: al
  empezar y al soltar.

- **Soltar un archivo sobre si mismo no llama a `onMove`.** Es un no-cambio, y anunciarlo como
  movimiento haria que el formulario se marcara como tocado sin que nadie tocara nada.

- **Una linea dice que se puede arrastrar.** El arrastre no se ve: sin decirlo, quien no lo intente
  nunca lo descubre. Solo aparece con mas de un archivo, que es cuando hay algo que ordenar.

- **112 px y no mas.** La bandeja es un indice, no una galeria; para mirar de verdad esta la vista
  grande. Con diez archivos, una miniatura mas grande empujaria el boton de publicar fuera de la
  pantalla en un telefono.

### Archivos tocados

**Presentacion**

- `src/presentation/media/MediaPreviewDialog/MediaPreviewDialog.tsx` y `.test.tsx` (nuevos).
- `src/presentation/media/PostMediaTray/PostMediaTray.tsx` y `.test.tsx`: la miniatura pasa a ser un
  boton, el arrastre, el aviso y los 112 px.

**i18n**

- `src/i18n/messages/{es,en}.json`: `mediaPreview`, `mediaPreviewTitle`, `mediaPreviewClose` y
  `mediaDragHint`.

**Especificacion y e2e**

- `src/e2e/multimedia/multimediaMultiple.feature`: los escenarios `@slice-4`.
- `src/e2e/testUtils/mediaTray.ts`: los localizadores `preview` y `previewDialog`.
- `src/e2e/createPost/PublishPage.ts`: solo el comentario, que ya contaba mal los botones por fila.

**Documentacion**

- `docs/features/platform/004-2026-08-12-multimedia-multiple.md`: el slice 4.

### Comandos clave

```
pnpm vitest --run src/presentation/media    # el bucle corto mientras se escribe
pnpm run typecheck && pnpm run typecheck:tests
pnpm run format                             # biome reformateo dos archivos
pnpm run lint
pnpm run check:i18n
pnpm run test:run
```

### Resultados de validacion

- `pnpm run test:run`: **1552 pruebas en 152 archivos, todas en verde**. El slice 3 cerro en
  1536/151, o sea **16 pruebas nuevas**: 7 de `MediaPreviewDialog` y 9 de la bandeja (3 de la vista
  grande, 6 del arrastre y el aviso).
- `pnpm run typecheck` y `pnpm run typecheck:tests`: exit 0.
- `pnpm run lint`: 801 archivos, exit 0 —despues de `pnpm run format`, que reformateo dos.
- `pnpm run check:i18n`: exit 0.
- **`pnpm run test:e2e:run`: NO se ejecuto**, por indicacion del usuario, que la corre cuando quiera.
  Ver "Pendientes": hay un motivo concreto para correrla en este slice y no solo por costumbre.

### Desviaciones del roadmap

- **Ningun escenario nuevo de Playwright.** Los cinco del slice van en `@component`, y el `.feature`
  dice por que: las tres piezas son estado de cliente del mismo componente que ya comparten las dos
  pantallas —no hay ida y vuelta al servidor que observar—, y lo unico que acaba en `post_media` es
  el orden, que la e2e del slice 3 ya comprueba a traves de las flechas. El arrastrar y soltar de
  HTML5 ademas se prueba mal en un navegador: no se simula con un `dragTo` sino con una secuencia de
  raton que no dispara los mismos eventos, asi que un escenario verde ahi no diria que la funcion
  sirve.
- **Una prueba existente hubo que precisarla.** `cada boton de quitar dice que archivo quita` buscaba
  por `/archivo 2/i`, y con la miniatura convertida en boton eso casa con dos. Pasa a
  `/quitar el archivo 2/i`, que es lo que ya hacian las pruebas de `PostMediaField`.

### Pendientes

- **Correr la e2e completa** (`--shard=1/2` y `2/2`). No es tramite: la bandeja cambio de forma y hay
  cuatro botones por archivo donde habia tres. Los localizadores de `MediaTray` son precisos y no
  deberian romperse —`quitar el archivo N`, `archivo N antes`, `archivo N despues` siguen siendo
  unicos—, pero eso es un razonamiento, no una corrida.
- **Mirar la pantalla de verdad.** El tamano de las flechas sobre una miniatura de 112 px y el
  contraste del aviso solo se juzgan viendolos; ninguna prueba dice si el arrastre "se siente" bien.
- Sin tocar, del slice anterior: el gancho `pre-commit` que corre la e2e entera, `Posts.d.ts`, y los
  dummies que son el mismo archivo tres veces.

### Recap

La bandeja dejo de ser solo un indice: la miniatura abre el archivo a tamano completo —con
`MediaContent`, el mismo que la ficha publica, asi que un video se ve como video—, se puede arrastrar
para reordenar sin ir de flecha en flecha, y las miniaturas pasan de 88 a 112 px. Las flechas siguen
donde estaban porque son el unico camino con teclado. Todo vive en `PostMediaTray`, asi que publicar
y editar lo reciben a la vez. Validacion local completa en verde; la e2e queda pendiente por
indicacion del usuario.

### Proximos pasos (opciones)

1. **Correr la e2e** (recomendado): es lo unico que falta para dar el slice por cerrado, y este es el
   slice que mas cambia la forma de la bandeja.
2. **Verlo a mano** con `pnpm run dev` en `/publicar` y en `/editar/<slug>`: el arrastre y el tamano
   de las flechas son juicios visuales.
3. **Mergear a `dev`** cuando la e2e pase; la rama es `feat/multimedia-arrastrar`.
4. **Arreglar el gancho `pre-commit`**, que sigue corriendo la e2e entera de una sola vez y es lo que
   obliga a commitear con `--no-verify`.

**Acciones pendientes del usuario:**

```
pnpm exec playwright test --shard=1/2
pnpm exec playwright test --shard=2/2
```

## 2026-08-13 - Slice 5: Que se vea que estan cargando, y que tarden menos

### Objetivo

El usuario reporto tres cosas en una frase: las imagenes tardan en reflejarse, la primera carga se
siente lenta, y no hay ningun indicador de que algo esta cargando —ni en la ficha del visitante, ni
en publicar, ni en editar—. Son tres sintomas con tres causas distintas, y solo el tercero se arregla
poniendo un indicador.

### Decisiones y racional

- **`loading="eager"` estaba en TODAS las imagenes, y esa era la causa de la primera carga lenta.**
  No era una optimizacion: era su contrario. Un listado de nueve tarjetas abria nueve descargas en el
  primer pintado, todas peleandose el mismo ancho de banda, y la que la persona estaba mirando
  llegaba la ultima. Ahora la carga es diferida por defecto y `priority` es un prop que pone **quien
  coloca la imagen**, porque es el unico que sabe si se ve sin desplazarse. Lo lleva un solo sitio en
  toda la aplicacion: la galeria de la ficha.

- **Sin `sizes`, el navegador elige por ancho de ventana y no por el hueco.** Pedia la variante de
  1920 para una tarjeta de 380 px, y la misma para una miniatura de 112. Ahora cada uno declara lo
  que ocupa: `Thumbnail` lo sabe exactamente (`${size}px`) y `MediaContent` trae un valor por defecto
  para sus dos usos de siempre, que quien tenga un hueco raro puede pisar.

- **El esqueleto es un componente de cliente, y se penso lo contrario primero.** Se puede pintar un
  hueco que late solo con CSS, sin JavaScript ninguno; el problema es que entonces late **para
  siempre** por detras de una imagen ya cargada, y en un listado de nueve tarjetas son nueve
  animaciones infinitas que nadie ve. Con estado, la animacion se acaba cuando el archivo llega. Se
  queda en la hoja del arbol, asi que `MediaContent` y `Thumbnail` siguen siendo de servidor.

- **El esqueleto va DETRAS del archivo, no en su lugar.** Asi no hay cambio de arbol ni salto de
  maquetacion: el hueco ya tiene su tamano final —lo reserva `next/image` con `width`/`height`— y lo
  unico que cambia es lo que se ve dentro.

- **Hay que preguntar por `complete`, y esto es lo que no se ve venir.** Si la imagen estaba en cache,
  el navegador puede decodificarla **antes** de que React hidrate: el `load` ya ocurrio y no vuelve a
  ocurrir, asi que el esqueleto se quedaba latiendo debajo de una imagen perfectamente visible, para
  siempre. Tiene su prueba, con el getter mockeado.

- **El video recibe el mismo trato, y no, el `<video>` de HTML no lo trae resuelto.** Fue la pregunta
  del usuario y merece respuesta escrita: lo unico nativo parecido es `poster`, una imagen fija que
  hay que generar y guardar por cada archivo, y aqui no se generan. Sin `poster` y con
  `preload="metadata"` lo que queda en pantalla es una caja vacia sin ninguna senal. La senal es
  `loadedmetadata` y **no** `loadeddata`: con `preload="metadata"` el navegador se compromete a lo
  primero, mientras que lo segundo exige el primer fotograma decodificado y puede no llegar nunca,
  dejando el esqueleto encima de un video listo.

- **Una imagen rota apaga el esqueleto igual que una que carga.** Dejarlo latiendo se lee como «sigue
  cargando» y quien mira espera algo que no va a llegar.

- **`minimumCacheTTL` sube a 30 dias.** El valor por defecto es de minutos, y con el el servidor
  vuelve a descargar el original de Cloud Storage y a reoptimizarlo en cada visita: es el "tarda en
  reflejarse" de la segunda vez, cuando la imagen ya se habia visto. Es seguro estirarlo porque
  **estas URL no cambian de contenido**: el nombre lleva marca de tiempo y un discriminante desde el
  slice 1, asi que editar produce una URL nueva en vez de pisar la anterior. Nunca se sirve una
  imagen vieja por esto.

- **El esqueleto no se anuncia a un lector de pantalla.** Quien lo ve sabe que espera porque lo ve
  latir; anunciarlo seria contarle un detalle visual que no puede usar, y en un listado de nueve
  tarjetas, contarselo nueve veces.

### Archivos tocados

**Presentacion (lo nuevo)**

- `src/presentation/media/MediaSkeleton/MediaSkeleton.tsx` (nuevo): el hueco que late y el marco que
  lo sostiene. Aparte porque lo comparten la imagen y el video.
- `src/presentation/media/ImageWithSkeleton/` y `src/presentation/media/VideoWithSkeleton/` (nuevos),
  con sus pruebas.

**Presentacion (conectado)**

- `src/presentation/media/MediaContent/MediaContent.tsx`: `priority`, `sizes`, y las dos piezas
  nuevas. Es el cuello de botella por el que pasan la ficha, la galeria, las tarjetas del listado y
  la vista grande del slice 4.
- `src/presentation/media/Thumbnail/Thumbnail.tsx`: la bandeja de publicar y editar, el carrito y los
  pedidos.
- `src/presentation/media/MediaGallery/MediaGallery.tsx` y
  `src/app/[locale]/[slug]/ui/PostDetail.tsx`: el `priority` de la unica imagen que lo lleva.
- `src/presentation/media/PostMediaTray/PostMediaTray.tsx`: la miniatura de video.

**Configuracion**

- `next.config.mjs`: `minimumCacheTTL`.

**Documentacion**

- `docs/features/platform/004-2026-08-12-multimedia-multiple.md`: el slice 5.

### Comandos clave

```
pnpm vitest --run src/presentation/media
pnpm run format && pnpm run lint
pnpm run typecheck && pnpm run typecheck:tests
pnpm run check:i18n
pnpm run test:run
rm -rf .next/dev/types    # ver "Desviaciones"
```

### Resultados de validacion

- `pnpm run test:run`: **1563 pruebas en 154 archivos, todas en verde**. El slice 4 cerro en
  1552/152, o sea **11 pruebas nuevas**: 6 de `ImageWithSkeleton` y 5 de `VideoWithSkeleton`.
- `pnpm run typecheck` y `pnpm run typecheck:tests`: exit 0.
- `pnpm run lint`: 806 archivos, exit 0 y **sin advertencias**.
- `pnpm run check:i18n`: exit 0. El slice no anade ni una clave: un esqueleto no lleva texto.
- **`pnpm run test:e2e:run`: NO se ejecuto**, por indicacion del usuario.

### Desviaciones del roadmap

- **No habia roadmap para este slice**: sale de un reporte del usuario, no del plan. Se documenta
  aqui y en `multimedia-multiple.md` para que no quede como un cambio sin motivo escrito.
- **El video entro a mitad del slice**, preguntado por el usuario ("y lo mismo debe aplicar para
  video, aunque a lo mejor eso ya se resuelve con el tag video de html"). No se resuelve solo, y por
  eso hay un `VideoWithSkeleton` y no solo un `ImageWithSkeleton`.
- **`pnpm run typecheck` fallo con 15 errores que no eran del codigo.** Estaban todos en
  `.next/dev/types/`, tipos que genera Next: un `next dev` que el usuario tenia abierto los dejo
  truncados al morir. Se borro la carpeta y volvieron a exit 0. Conviene reconocer la firma —errores
  de sintaxis en `.next/`, no en `src/`— para no perder tiempo buscandolos en el codigo.
- **Dos pruebas de `ImageWithSkeleton` nacieron en rojo por una razon util**: `next/image` no llama al
  `onLoad` de quien lo usa en el mismo evento, lo pone detras de `img.decode()`. Afirmar en seco
  pasaba a veces; ahora esperan con `waitFor`, que es lo que describe el comportamiento real.

### Pendientes

- **Medirlo.** Todo lo de aqui es razonamiento sobre como pide las imagenes el navegador; nadie ha
  puesto un numero antes y despues. Un Lighthouse sobre `/` y sobre una ficha, en produccion, diria
  si el LCP se movio de verdad.
- **Correr la e2e**, que sigue pendiente desde el slice 4 y ahora ademas cambia cuando se descargan
  las imagenes: un escenario que esperaba una imagen visible en una tarjeta de mas abajo podria
  necesitar desplazarse. **Es el riesgo concreto de este slice.**
- **Las tarjetas del listado no pasan `sizes` propio** y se quedan con el de por defecto, que apunta
  a 768 px cuando en escritorio miden unos 380. Ya es muchisimo mejor que 1920, pero se puede afinar
  cuando alguien mida.
- Sin tocar: el gancho `pre-commit`, `Posts.d.ts` y los dummies repetidos.

### Recap

Las imagenes ya no se piden todas a la vez —solo se adelanta la de la ficha, que es la unica que se
ve sin desplazarse—, se piden del tamano del hueco en vez de por ancho de ventana, y la version
optimizada se guarda 30 dias en vez de minutos. Mientras llegan, tanto las imagenes como los videos
enseñan un hueco que late del tamano final, sin salto de maquetacion, y que se apaga cuando el
archivo llega, cuando falla, o cuando ya estaba en cache. Todo pasa por `MediaContent` y `Thumbnail`,
asi que lo reciben a la vez la ficha del visitante, las tarjetas del listado, publicar y editar.
Validacion local completa en verde; falta medirlo y falta la e2e.

### Proximos pasos (opciones)

1. **Correr la e2e** (recomendado): arrastra pendiente desde el slice 4 y este slice cambia **cuando**
   se descargan las imagenes, que es justo lo que un escenario podria estar esperando.
2. **Medir con Lighthouse** antes/despues en produccion, para saber si el LCP se movio o solo se
   siente mejor.
3. **Mirarlo a mano** con `pnpm run dev`: si el gris del esqueleto es el adecuado en modo oscuro y si
   los 300 ms de transicion se sienten bien o se sienten lentos.
4. **Mergear a `dev`** los slices 4 y 5 juntos cuando la e2e pase; la rama es
   `feat/multimedia-arrastrar`.

**Acciones pendientes del usuario:**

```
pnpm exec playwright test --shard=1/2
pnpm exec playwright test --shard=2/2
```

## 2026-08-13 - Slice 6: Encoger la imagen antes de subirla

### Objetivo

El usuario pregunto si optimizamos el tamano de lo que se sube. La respuesta era **no, nada**:
`useStorageUpload` hacia `xhr.send(file)` con el archivo tal cual salio del telefono, y no habia
ningun tope de tamano en el picker, ni en el hook, ni en `/api/storage/signed-url`.

### Decisiones y racional

- **El tope es 2048 px en el lado largo, no 800.** Lo que se sube es lo que se guarda para siempre,
  asi que el numero no es "el tamano con el que se ve" sino **el techo de calidad del que se podra
  tirar despues**: la variante mas grande que piden los disenos de hoy anda por 1920, y una pantalla
  de alta densidad mirando la vista grande del slice 4 quiere mas que eso. Bajar de 2048 empezaria a
  notarse al ampliar; subir deja de ahorrar.

- **WebP y no JPEG.** Pesa entre un 25 % y un 35 % menos con la misma calidad **y conserva la
  transparencia**, asi que el logo de una tienda en PNG con fondo transparente no se convierte en un
  rectangulo blanco. Todos los navegadores que soporta el sitio saben codificarlo desde un `canvas`.

- **`imageOrientation: "from-image"`, y esto es una trampa de verdad.** El sensor del telefono guarda
  los pixeles girados y una etiqueta EXIF que dice como mirarlos; al redibujar en un `canvas` esa
  etiqueta **se pierde**. Sin esa opcion, las fotos hechas en vertical se subirian acostadas, y el
  fallo no aparece en el escritorio de quien lo programa sino en el telefono de quien publica.

- **Nunca bloquea ni lanza.** Ante un formato que el navegador no decodifica, un `canvas` sin
  contexto o un entorno sin `createImageBitmap`, devuelve el archivo original. Es la misma regla que
  ya seguia `readImageSize`: publicar no puede fallar porque un ahorro no salga. Es la prueba mas
  importante del modulo.

- **Si el resultado pesa mas, se queda el original.** Recodificar una imagen ya optimizada la deja
  mas grande, y subir eso seria trabajar para empeorar.

- **Nunca se agranda.** `planResize` devuelve `null` cuando la foto ya cabe: estirarla no le anade
  informacion, solo peso.

- **GIF y SVG quedan fuera.** Un GIF pierde la animacion al pasar por un `canvas`, que solo sabe del
  primer fotograma; un SVG es texto, y redibujarlo lo convierte en pixeles, o sea lo empeora en todo.

- **Las dimensiones que se guardan pasan a ser las del archivo subido.** Encoger cambia los dos
  numeros, y guardar los del original haria que la ficha reservara un hueco con la proporcion
  correcta pero el tamano equivocado. Encoger ya las devuelve —acaba de dibujarlas—, asi que
  `readImageSize` solo se llama cuando no vienen: un archivo que no se pudo decodificar, o uno que no
  paso por ahi.

- **Encoger va ANTES de pedir la URL firmada.** Esa peticion lleva dentro el nombre y el tipo del
  archivo, y tras recodificar a WebP los dos cambian. `foto.jpg` sube como `foto.webp`: el nombre no
  puede decir una cosa y el contenido otra.

- **El video no se toca, y no por olvido.** Recodificarlo en el navegador exige un codec:
  `ffmpeg.wasm` son unos 25 MB que habria que descargar antes de subir nada, y un telefono de gama
  media tarda mas en recodificar un minuto de video que en subirlo tal cual. `WebCodecs` lo haria
  bien pero no esta en las versiones de Safari que usa buena parte de la comunidad. Queda escrito
  dentro del propio modulo para que nadie lo intente dos veces.

### Archivos tocados

- `src/infra/UI/media/shrinkImage.ts` y `.test.ts` (nuevos): `planResize` —la decision, pura y
  probada a fondo— y `shrinkImageForUpload` —el trabajo con el navegador, con su red de seguridad—.
- `src/infra/UI/hooks/useStorageUpload.ts`: encoge antes de pedir la URL firmada y se queda con las
  medidas que le devuelve.
- `docs/features/platform/004-2026-08-12-multimedia-multiple.md`: el slice 6, con las dos salidas posibles para el video.

### Comandos clave

```
pnpm vitest --run src/infra/UI/media
pnpm run typecheck && pnpm run typecheck:tests
pnpm run lint && pnpm run check:i18n
pnpm run test:run
```

### Resultados de validacion

- `pnpm run test:run`: **1579 pruebas en 155 archivos, todas en verde**. El slice 5 cerro en
  1563/154, o sea **16 pruebas nuevas**, todas de `shrinkImage`.
- `pnpm run typecheck` y `pnpm run typecheck:tests`: exit 0.
- `pnpm run lint`: 808 archivos, exit 0.
- `pnpm run check:i18n`: exit 0. El slice no anade texto: encoger no se le cuenta a nadie.
- **`pnpm run test:e2e:run`: NO se ejecuto**, por indicacion del usuario.

**El ahorro no esta medido con archivos reales.** Una foto de 12 MP a 2048 px y WebP 82 % suele
quedar entre 300 y 500 KB frente a 3-8 MB, o sea del orden de 10x, pero eso es la expectativa
razonable y no una medicion de esta implementacion. Se mide subiendo una foto de verdad y mirando el
tamano en Cloud Storage.

### Desviaciones del roadmap

- **No habia roadmap**: sale de una pregunta del usuario. Se documenta en `multimedia-multiple.md`
  como slice 6 para que el cambio no quede sin motivo escrito.
- **El video queda sin resolver a proposito**, con las dos salidas escritas y ninguna elegida: las
  dos son decisiones de producto —un numero que puede dejar fuera a un vendedor legitimo, o
  infraestructura nueva— y no de codigo.

### Pendientes

- **Medir el ahorro de verdad**: subir una foto de telefono y comparar el peso en Cloud Storage.
- **Decidir que hacer con el video** (tope declarado, o recodificar en el servidor).
- **Correr la e2e.** El riesgo concreto de este slice: en Chromium el encogido **si** corre, asi que
  los dummies se recodifican a WebP antes de "subirse". El stub ignora el nombre y el tipo —contesta
  con URLs fijas por contador— y ningun escenario afirma dimensiones de un archivo subido, asi que no
  deberia romperse nada; pero eso es un razonamiento, no una corrida.
- **Lo ya subido sigue pesando lo que pesaba.** Este cambio solo afecta a lo nuevo. Reducir las 23
  publicaciones existentes seria un script aparte que reescribe `post_media.url`, y toca datos de
  verdad.
- Sin tocar: el gancho `pre-commit`, `Posts.d.ts` y los dummies repetidos.

### Recap

Lo que se sube deja de ser lo que salio del telefono: las imagenes se encogen en el navegador a 2048
px de lado largo y se recodifican a WebP al 82 % antes de pedir la URL firmada, conservando la
orientacion EXIF y la transparencia, y guardando en `post_media` las medidas del archivo que
realmente se subio. Si algo falla —formato raro, navegador sin `createImageBitmap`, resultado mas
pesado que el original— se sube el original y se publica igual. El video sigue subiendo intacto
porque no se puede recodificar en el navegador a un coste razonable, y las dos salidas posibles
quedan escritas para decidirlas. Validacion local completa en verde; el ahorro real esta sin medir.

### Proximos pasos (opciones)

1. **Correr la e2e** (recomendado): arrastra pendiente desde el slice 4 y este slice cambia lo que
   viaja en la subida.
2. **Medir el ahorro** con una foto de telefono de verdad, para poner un numero donde hoy hay una
   expectativa.
3. **Decidir el video**: tope declarado al elegir el archivo, o recodificado en el servidor.
4. **Mergear a `dev`** los slices 4, 5 y 6 juntos cuando la e2e pase; la rama es
   `feat/multimedia-arrastrar`.

**Acciones pendientes del usuario:**

```
pnpm exec playwright test --shard=1/2
pnpm exec playwright test --shard=2/2
```
