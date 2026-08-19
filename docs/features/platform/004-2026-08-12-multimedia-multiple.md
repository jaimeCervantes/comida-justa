# Multimedia multiple por publicacion

Una publicacion puede llevar varias imagenes y videos, como en Facebook o Instagram, en vez del
unico archivo de hoy. Los escenarios viven en `src/e2e/multimedia/multimediaMultiple.feature` y la
bitacora en `docs/features/platform/004-2026-08-12-multimedia-multiple-bitacora.md`.

## Alineacion

- **Problem:** quien publica un producto tiene varias fotos —el frente, la etiqueta, el interior— y
  hoy elige una y descarta el resto. Sube la que mejor se ve, y quien compra decide sin ver ni lo
  que dice la etiqueta ni el tamano real.
- **Savings:** menos publicaciones duplicadas del mismo producto para colar la segunda foto, menos
  preguntas por WhatsApp que la foto habria contestado, y una ficha que se parece a la de Facebook o
  Instagram, que es con lo que la comunidad ya compara.
- **Why:** el catalogo es el escaparate de la comunidad. Una ficha que ensena el producto desde tres
  angulos vende; una que ensena uno pide confianza.

## Lo que ya estaba hecho

Conviene decirlo antes del modelo, porque explica por que el roadmap es corto: **la mitad de abajo
ya soportaba varios archivos y nadie la habia usado**.

- `post_media` enlaza N archivos a un post por `post_id`, los ordena por `sort_order` (integer
  `NOT NULL DEFAULT 0`) y borra en cascada con el post. No hay unique en `(post_id, sort_order)` ni
  tope de filas. **No hace falta ninguna migracion de Alembic.**
- Las cuatro consultas de lectura ya devuelven un array ordenado:
  `PostgresPostQueryRepository.ts:118-132`, `PostgresGetOnePost.ts:78-96`,
  `PostgresSearchPostRepository.ts:440-444`, y `IPostQueryRepository.media` ya es `PostMediaFile[]`.
- El repositorio de escritura ya sabe insertar N filas con su `sortOrder`
  (`PostgresPostRepository.ts:39-59`); nunca habia llegado a hacerlo.
- `buildSharePreview` (`src/domain/seo/shareMedia.ts`) ya recorre el array buscando la primera
  imagen y el primer video por separado.

El cuello de botella era **un solo tipo**: `Post.media: PostMediaFile` en singular
(`src/domain/entities/post/types.ts:62`). De ahi hacia arriba todo el camino de escritura estaba
estrangulado. El propio repo lo tenia anotado como deuda en
`PostgresSearchPostRepository.ts:561-566`: *«el `Post` del dominio declara `media: PostMediaFile` en
singular, mientras que todo el que la lee la trata como lista»*.

Estado de la base al empezar: 23 publicaciones, 23 filas en `post_media`, **todas con exactamente un
archivo** y `sort_order = 0`. `type` solo toma `image` (15) y `video` (8); `width`/`height` pobladas
en las 15 imagenes y nulas en los 8 videos.

## Modelo acordado

- **El tope es 10 archivos por publicacion**, el mismo de Instagram y Facebook. Es una regla de
  negocio, asi que vive en `src/domain/`, **no** en `src/infra/constants/index.ts`: las constantes de
  ahi se leen de `process.env` y CI corre sin ningun `.env`, con lo que un tope env-driven valdria
  una cosa en local y otra en GitHub.
- **`sort_order` es el orden en que se subieron** y `sort_order = 0` es la portada. Ya es el contrato
  que asumen el carrito (`PostgresCartProductRepository.ts:73-78`), los pedidos y el bot de Python
  (`post_product.py:69-75`), que piden `ORDER BY sort_order LIMIT 1`.
- **El `alt` se sigue derivando de la traduccion, no de la columna.** `post_media.alt` no tiene
  idioma y al publicar se rellena con el titulo espanol; `PostDetail.tsx:87-95` ya lo documenta y lo
  reemplaza al pintar. Con varios archivos, el `alt` del segundo en adelante lleva su posicion, para
  que un lector de pantalla no oiga el mismo texto cuatro veces.
- **Una publicacion con un solo archivo se ve exactamente igual que hoy.** La galeria solo saca
  flechas, miniaturas y contador a partir del segundo. Las 23 publicaciones existentes no cambian de
  aspecto, y por eso el slice 2 no necesita sembrar nada para no romper lo que ya hay.
- **La bandeja acumula, el selector no reemplaza.** Hoy cada subida pisa la anterior
  (`PublishForm.tsx:63`); el modelo nuevo es el de Facebook: se anade y se quita de una lista.
- **Editar la media es el slice 3**, y ya esta hecho. Cuando se acordo este modelo el formulario de
  edicion ni la tocaba —una decision documentada entonces en `EditPostForm.tsx:26-33`—; desde el
  slice 3 pinta el mismo campo que `/publicar`. Trajo una regla que no estaba prevista: **al menos
  un archivo**, porque quitar el ultimo si podia dejar una publicacion que no se puede pintar.

## Roadmap

### Slice 1 - Publicar varios archivos

**Alcance**

- Dominio: `Post.media` pasa a `PostMediaFile[]`; nuevo `src/domain/entities/post/mediaPayload.ts`
  con `MAX_POST_MEDIA_FILES`, `mediaTypeFromMime` y `parsePostMediaPayload` (tolera el objeto unico
  antiguo, descarta lo que no trae `url`, recorta al tope); `PostValidator` gana `validateMedia`,
  que exige forma y tope pero **no** un minimo —la edicion pasa `[]` y exigir uno la romperia.
- Ripples del tipo plural: `createOnePostUseCase.ts:75`, `updateOnePostUseCase.ts:92`,
  `PostgresSearchPostRepository.ts:561-567` y `PostgresPostRepository.ts:39-59`.
- Subida: `useStorageUpload` expone `uploadFiles(File[])` en serie y acumula en `media: []`;
  `ImageVideoUploader` recorre todo el `FileList` recortado a los huecos libres; el nombre del
  archivo gana un discriminante para que dos archivos homonimos en el mismo milisegundo no colisionen
  en Cloud Storage.
- Interfaz: nuevo `src/presentation/media/PostMediaTray/` con las miniaturas numeradas, su boton de
  quitar y el contador; `PublishForm` acumula en vez de pisar; la vista previa local del picker queda
  solo para el caso de un archivo (el logo de tienda), para que no compitan dos previews.
- Server Action: `parsePostMediaPayload` sustituye al `JSON.parse` a objeto unico.
- i18n: las claves nuevas de `publish`, y de paso caen los tres literales espanoles hardcodeados que
  hay en ese camino (`PublishForm.tsx:60`, `actions.ts:152` y `actions.ts:155`).

**Criterios de aceptacion**

- Elegir tres archivos de una vez sube los tres y los tres aparecen en la bandeja numerados 1, 2 y 3
  con el contador «3 de 10».
- Volver a abrir el selector y elegir uno mas lo anade —quedan 4—, no lo reemplaza.
- Quitar el segundo deja tres y renumera; al publicar, `post_media` tiene tres filas con
  `sort_order` 0, 1 y 2 en ese orden.
- Al llegar a 10 el selector queda deshabilitado con su aviso; una seleccion de 12 se recorta a los
  huecos disponibles en vez de fallar.
- Publicar con un solo archivo se comporta exactamente igual que antes.
- Una imagen y un video conviven en la misma publicacion, cada fila con su `type` correcto.

### Slice 2 - Verlos en la ficha y saber cuantos hay en la tarjeta

**Alcance**

- Nuevo `src/presentation/media/MediaGallery/`: con un archivo renderiza `MediaContent` a pelo, sin
  adorno ninguno; con varios anade flechas, tira de miniaturas y contador «1 / 4», con navegacion por
  teclado y el contador en `aria-live`.
- `PostDetail` deja de tomar `media[0]` y entrega el array entero, derivando el `alt` de la
  traduccion con la posicion a partir del segundo archivo.
- `CardForList` conserva `media[0]` como portada y anade una insignia con el numero de archivos
  cuando hay mas de uno.
- `shareMedia.ts` no se toca: ya elegia la primera imagen aunque el primer archivo fuera un video.

**Criterios de aceptacion**

- Una ficha con tres archivos muestra flechas, tres miniaturas y «1 / 3»; «siguiente» y el clic en la
  tercera miniatura cambian el archivo grande y el contador.
- Una ficha con un archivo se ve identica a hoy: ni flechas, ni miniaturas, ni contador.
- Una tarjeta de una publicacion con cuatro archivos ensena su insignia de 4; una con uno no ensena
  ninguna.
- El `og:image` sigue siendo la primera imagen aunque el primer archivo sea un video.

### Slice 3 - Editar la media de una publicacion

**Alcance**

Anadir, quitar y reordenar los archivos de una publicacion ya creada. Al empezar no existia **ningun**
camino de escritura que tocara `post_media` despues de crear, asi que `media` tuvo que recorrer el
camino entero: `EditablePostValues` (`EditPostForm.tsx`), `EditablePost` y `PostContentUpdate`
(`IPostAdminRepository.ts`), `UpdateOnePostInput`, y de ahi a la escritura.

- La aritmetica de la lista sale de `PublishForm` a `src/presentation/media/PostMediaField/`, que
  pintan las dos pantallas. La unica diferencia entre ellas es de donde sale la lista inicial: vacia
  al publicar, la que ya tiene la publicacion al editar.
- `PostMediaTray` gana dos flechas por archivo (`onMove`, opcional), que solo se pintan donde pueden
  hacer algo. Reordenar es de la bandeja, no de la pantalla, y por eso lo prueba el componente.
- El repositorio **reemplaza** el conjunto en vez de calcular un diff, y lo hace **dentro de la misma
  transaccion** que el texto: separarlos dejaria el hueco en el que la publicacion se queda sin la
  fila que leen la tarjeta, el carrito y el bot con `ORDER BY sort_order LIMIT 1`.
- Regla nueva, en la Server Action: **al menos un archivo**.

**Criterios de aceptacion**

- Quien edita su publicacion ve los archivos que ya tiene y puede quitar uno.
- Puede anadir uno nuevo respetando el mismo tope de 10, y el anadido va al final.
- Puede cambiar cual es la portada, y el cambio se refleja en la tarjeta, en el carrito y en el bot.
- Quitar el ultimo archivo no se guarda: se explica que hace falta al menos uno, y la publicacion
  conserva el que tenia. (No estaba en el roadmap; ver la bitacora del slice 3.)

### Slice 4 - Verla en grande y arrastrarla de sitio

**Alcance**

La bandeja se quedo corta en cuanto se pudo editar: 88 px no bastan para reconocer cual de tres
etiquetas parecidas es cual, y para llevar el cuarto archivo a la portada hacen falta tres toques de
flecha. Las tres piezas son de `PostMediaTray`, asi que publicar y editar las reciben a la vez.

- **Ver en grande.** La miniatura pasa a ser un boton que abre el archivo a tamano completo sobre la
  pantalla. Lo pinta `MediaContent`, el mismo que la ficha publica, para que un video se vea como
  video y una foto vertical no se recorte; el tipo se normaliza antes con `mediaTypeFromMime`,
  porque en el formulario todavia es un MIME (`image/jpeg`) y `MediaContent` conmuta por categoria.
- **Arrastrar para ordenar.** Con el raton se arrastra la miniatura hasta el sitio que le toca, en
  vez de empujarla de una en una. **Las flechas se quedan**: son el unico camino con teclado y con
  lector de pantalla, y quitarlas cambiaria una mejora por una regresion de accesibilidad.
- **Miniaturas mas grandes**: de 88 a 112 px.

**Criterios de aceptacion**

- Tocar una miniatura abre el archivo en grande; `Escape`, el boton de cerrar y el clic fuera lo
  cierran, y el foco vuelve a la miniatura desde la que se abrio.
- Un video se abre como video —con sus controles— y no como una imagen rota.
- Arrastrar el tercer archivo sobre el primero lo deja de portada, y los otros dos corren un puesto
  sin cambiar su orden relativo.
- Soltar un archivo sobre si mismo no cambia nada.
- Las flechas siguen haciendo lo mismo que antes, y el orden que producen es el mismo que el del
  arrastre.

### Slice 5 - Que se vea que estan cargando, y que tarden menos

**Alcance**

Tres sintomas distintos con tres causas distintas, y solo el tercero es "poner un indicador":

- **El listado tardaba en la primera carga** porque `MediaContent` pedia **todas** las imagenes con
  `loading="eager"`. Nueve tarjetas eran nueve descargas simultaneas peleandose el mismo ancho de
  banda, y la que la persona miraba llegaba la ultima. Ahora la carga es diferida y solo se adelanta
  la de la ficha (`priority`), que es la unica que se ve sin desplazarse.
- **Se pedian imagenes mas grandes que el hueco.** Sin `sizes`, `next/image` deja que el navegador
  elija por ancho de ventana y no por el hueco real: la variante de 1920 para una tarjeta de 380, o
  la de 1920 para una miniatura de 112. Cada uno declara lo que ocupa.
- **No habia ninguna senal mientras llegaban.** `ImageWithSkeleton` y `VideoWithSkeleton` pintan un
  hueco que late detras del archivo, del tamano final, y lo apagan cuando llega. Los usan
  `MediaContent` y `Thumbnail`, o sea la ficha del visitante, las tarjetas del listado, la bandeja de
  publicar y la de editar, sin tocar ninguna de esas pantallas.

Y una cuarta, invisible: `minimumCacheTTL` sube a 30 dias. El valor por defecto es de minutos, con lo
que el servidor volvia a descargar el original de Cloud Storage y a reoptimizarlo en visitas
sucesivas. Es seguro porque estas URL no cambian de contenido: llevan marca de tiempo y
discriminante, asi que editar produce una URL nueva en vez de pisar la anterior.

**Criterios de aceptacion**

- Mientras una imagen no ha llegado se ve un hueco que late, del tamano que va a ocupar, y no un
  salto de maquetacion cuando llega.
- El hueco deja de latir cuando la imagen carga, cuando falla, y cuando ya estaba en cache antes de
  que la pagina hidratara.
- Un video hace lo mismo: el `<video>` de HTML no lo trae resuelto —solo `poster`, que aqui no se
  genera—, asi que la senal es `loadedmetadata`.
- En el listado, las imagenes de mas abajo no se descargan hasta que se llega a ellas; la de la ficha
  si se adelanta.

### Slice 6 - Que no se suba un archivo diez veces mas grande de lo que se ve

**Alcance**

Hasta aqui no se optimizaba **nada**: `useStorageUpload` hacia `xhr.send(file)` con el archivo tal y
como salio del telefono, y no habia ningun tope de tamano en el picker, ni en el hook, ni en
`/api/storage/signed-url`. Una foto de un telefono actual son 4000x3000 y entre 3 y 8 MB, y el sitio
no la ensena nunca a mas de unos 800 px de ancho. Ese archivo se paga tres veces: disco en Cloud
Storage, datos moviles de quien publica —que es quien menos puede pagarlos— y el trabajo del
optimizador de Next, que se descarga el original para reducirlo en cada tamano que sirve.

- `shrinkImageForUpload` encoge la imagen en el navegador antes de subirla: tope de 2048 px en el
  lado largo y WebP al 82 %. El tope no es el tamano con el que se ve, es el techo de calidad del que
  se podra tirar despues.
- **Nunca bloquea.** Ante cualquier problema devuelve el archivo original, igual que `readImageSize`:
  publicar no puede fallar porque un ahorro no salga. Tampoco sube el resultado si peso mas que el
  original.
- Las dimensiones que se guardan pasan a ser **las del archivo que se sube**, no las del que se
  eligio.
- **El video no se toca**, y no por olvido: ver "Lo que no se puede hacer en el navegador".

**Criterios de aceptacion**

- Una foto de 4000x3000 llega a Cloud Storage con el lado largo en 2048 y en WebP, y `post_media`
  guarda esas medidas y no las del original.
- Una foto que ya cabe no se recodifica ni se agranda.
- Un GIF, un SVG y un video suben intactos.
- Si el navegador no sabe decodificar, se sube el original y se publica igual.

**Lo que no se puede hacer en el navegador**

Recodificar video exige un codec: `ffmpeg.wasm` son unos 25 MB que habria que descargar antes de
subir nada, y un telefono de gama media tarda mas en recodificar un minuto de video que en subirlo
tal cual. `WebCodecs` lo haria bien pero no esta en las versiones de Safari que usa buena parte de la
comunidad. Las dos salidas son de producto y estan sin decidir:

1. **Un tope de tamano o duracion**, dicho al elegir el archivo. Barato y honesto, pero es un numero
   que puede dejar fuera a un vendedor con un video legitimo.
2. **Recodificar del lado del servidor**, con un trabajo aparte que reemplace el archivo cuando
   termine. Es lo correcto y es infraestructura nueva.

## Validacion

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run check:i18n`
- `pnpm run test:e2e:run` **en dos mitades**, `--shard=1/2` y `--shard=2/2`, y no de una sola vez: de
  corrido la maquina se queda sin memoria y Chromium deja de arrancar (ver la bitacora de i18n). Con
  el slice 3 cerrado dio **280 escenarios en verde, 3 saltados, 0 fallos**.
