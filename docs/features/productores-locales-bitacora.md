# Bitácora — productores locales

Append-only. Una entrada por slice, con el **porqué**; el qué ya está en `git log`.

## Slice 1 — el vendedor declara el rol, la distancia decide el ámbito (2026-08-02)

### Objetivo

Que `/productores-locales` se llene solo. La regla del directorio era buena desde el slice 1 de
`secciones-comunidad` —entras el día que publicas algo que produces— pero el dato que la dispara no
se le pedía a nadie: el selector de procedencia estaba detrás de `isAdmin`, así que las 24
publicaciones de la comunidad nacieron con `origin = null` y el directorio llevaba 0 tiendas desde
que existe.

### Decisiones y por qué

**1. El ámbito se deriva, no se declara.** La conversación arrancó con "¿debería la tienda decir si
es productor o negocio?" y terminó en otro lado, que es donde tenía que terminar: local o lejano no
es opinión del vendedor, es una distancia. Y hay una asimetría que decide el modelo entero — si lo
**produzco**, viene de donde está mi tienda y mis coordenadas lo contestan solas; si lo **revendo**,
el producto viajó y mis coordenadas no dicen nada, así que solo yo lo sé. De ahí sale que se
pregunte una sola cosa (¿lo haces o lo revendes?, y si revendes, ¿de cerca o de lejos?) y que el
"productor foráneo" deje de existir como declaración.

**2. La allowlist se colapsó de 6 valores a 5.** Se hizo **ahora** porque hoy era gratis y mañana no:
ninguna fila usaba los cuatro valores comunitarios (las 13 con procedencia son `hazlo_sano_*`),
`posts.origin` es `text` validado por la app —no un enum de BD, cero migraciones— y se verificó que
el backend Python **no lee la columna**: solo la creó (`0022_2026-07-23_add_kind_and_origin_to_posts`).
En cuanto el directorio se llene, colapsar deja de ser gratis.

**3. El radio sostenible es 50 km, y vive en el dominio con nombre.** Cubre Córdoba (~40 km) y llega
a Orizaba (~55 km al límite): la cuenca real de abasto desde Tezonapa, ida y vuelta el mismo día.
Ese es el criterio pedido —kilómetros que sigan siendo sostenibles en nutrición, ambiente, costo y
desperdicio—. Está en `proximity.ts` como constante con nombre y no suelto en la consulta, para que
moverlo sea una decisión de negocio y no un `sed`.

**4. La insignia dejó de decir "Local" para un productor.** Fue la consecuencia que destapó el
colapso: si el ámbito se deriva, una tarjeta de listado tendría que arrastrar un `ST_Distance` por
fila para poder afirmar locación. En vez de eso afirma lo que el dato respalda —"🧑‍🌾 Lo hace quien
lo vende"— y la locación se resuelve donde importa: el directorio. Terminó siendo una insignia más
honesta que la anterior. `reventa_cercana` conserva el "📍 Local" porque ahí sí hay una declaración
que lo respalda.

**5. `validateNewPost` se separó de `validate`.** Este fue el hallazgo caro del slice. Poner "un
producto exige procedencia" dentro de `validate` rompió `UpdateOnePostUseCase`: la edición valida
con las mismas reglas pero **no recibe** el `origin` (cambia título, texto, precio y categoría), así
que editar cualquiera de los 13 productos existentes empezó a fallar por un campo que su formulario
ni siquiera muestra. Un error que no se puede corregir desde la pantalla es peor que el hueco que
cierra, así que la exigencia vive en `validateNewPost`, que solo llama quien publica.

**6. La tienda sin sucursal no entra a productores.** No es un efecto colateral, es el incentivo que
se buscaba: sin ubicación no hay distancia que verificar. Completar la tienda pasa a tener una
recompensa visible, y es la misma que hará falta para el orden por cercanía de los slices 3-5.

### Archivos tocados

- **Dominio:** `entities/post/origin.ts` (allowlist de 5, `isProducerOrigin`, `isNearbyResaleOrigin`,
  `originsForUser`), `entities/seller/proximity.ts` (**nuevo**: radio, ancla, predicado),
  `entities/seller/directory.ts` (doc del modelo), `schemas/PostValidator.ts` (`validateNewPost`),
  `entities/post/types.ts` (`IPostValidator`).
- **Use cases:** `createOnePost/createOnePostUseCase.ts` (pasa a `validateNewPost`), `mocks.ts`.
- **Infra:** `dataAccess/sellers/PostgresStoreDirectory.ts` (el `ST_DWithin` del radio),
  `UI/labels/postOriginLabels.ts` (nombre vs pregunta, `originOptionsFor`),
  `UI/components/ProvenanceBadge/ProvenanceBadge.tsx`.
- **App:** `publicar/PublishForm.tsx` (selector visible a todos en un producto, requerido,
  opciones por rol).
- **i18n:** `es.json` / `en.json` — claves de `origin` renombradas, bloque `originQuestion` nuevo,
  `provenance.producer` nuevo, `publish.origin` reescrito como pregunta.
- **Pruebas:** `origin.test.ts`, `proximity.test.ts` (**nuevo**), `postOriginLabels.test.ts`
  (**nuevo**), `PostValidator.test.ts`, `originReport.test.ts`, `ProvenanceBadge.test.tsx`,
  `CardForList.test.tsx`, `OriginReportTable.test.tsx`, `createOnePostUseCase.test.ts`.
- **e2e:** `localProducers/localProducers.feature` y `.spec.ts` (**nuevos**),
  `testUtils/seedStore.ts` (**nuevo**), `sellerStore.spec.ts`, `products.spec.ts`,
  `directories.spec.ts`, `productsReport.spec.ts`, `PublishProductPage.ts`,
  `publishProduct.feature`, `seo.feature`, `i18n.feature`.

### Comandos

```
pnpm run typecheck
pnpm run test:run
pnpm run lint
pnpm run test:e2e:run
npx biome format --write .   # tras el rename masivo de valores
```

### Validación

- `typecheck`: limpio.
- `test:run`: **624/624** (72 archivos). Antes del slice eran 600.
- `lint`: sin errores (queda 1 `info` preexistente sobre un Fragment en otra pantalla).
- `test:e2e:run`: **100 pasados, 3 saltados, 0 fallos** (6.5 min), contra la base compartida.

La primera corrida del e2e dio **4 fallos**, y valen como nota: los cuatro eran la misma causa, que
la etiqueta del campo pasó de `"Procedencia (Hazlo Sano):"` a `"¿De dónde viene lo que vendes?"` y
dos page objects buscaban el combobox por esa prosa (`getByRole("combobox", { name: /procedencia/i })`).
Se apuntaron a `#origin`: la etiqueta es una pregunta al vendedor y se va a volver a redactar cada
vez que se afine el tono, así que amarrar un selector a ella es amarrarlo a la redacción. El id es
el contrato.

**Escrito en la base compartida:** nada permanente. La corrida siembra tiendas, sucursales y
publicaciones con el prefijo `e2e-` y las borra en el `globalTeardown`; se verificó después con un
conteo directo — 0 tiendas, 0 sucursales y 0 publicaciones de prueba, y las 24 publicaciones reales
con la misma distribución de `origin` que antes del slice (10 anuncios sin origen, 1 producto sin
origen, 10 `hazlo_sano_propio`, 3 `hazlo_sano_reventa`). Ningún valor viejo quedó en la base, que es
lo que hacía gratis el colapso de la allowlist.

### Desvíos del roadmap

El roadmap se reescribió a media revisión, antes de escribir código: la versión aprobada primero
tenía al vendedor declarando las cuatro procedencias comunitarias. Los dos ajustes del usuario
—"foráneo solo si pasa de ciertos km" y "tal vez: lo traigo de muy lejos"— cambiaron el modelo, y
`docs/features/productores-locales.md` quedó reescrito antes de la primera línea de implementación.

### Recap

`/productores-locales` ya no depende de que un admin marque registros a mano: cualquiera que
publique un producto declara si lo hace o lo revende, y su tienda entra al directorio si tiene una
sucursal dentro de los 50 km del ancla de la comunidad. La allowlist quedó en cinco valores, la
insignia afirma solo lo que el dato respalda, y editar lo ya publicado sigue funcionando porque la
exigencia de procedencia solo aplica a lo nuevo. Falta que alguien pueda **corregir** una
procedencia mal declarada: el formulario de edición sigue sin el campo.

### Próximos pasos (opciones)

1. **Slice 2 — corregir la procedencia** (`EditPostForm` con el mismo selector y las mismas reglas
   de rol). Es el más corto y cierra el único camino sin retorno que dejó este slice.
2. **Slice 3 — la distancia en el producto** (metros / km). El bot ya guarda
   `users.last_latitude`, y `AddBranchForm` ya sabe pedir el permiso al navegador: se reusa, no se
   inventa.
3. **Slice 4 — orden por cercanía en la búsqueda**, con la red de seguridad de mostrar lo lejano
   cuando no hay nada cerca.

**Pendiente del usuario:** qué se le enseña a un visitante anónimo que niega el permiso de
ubicación (bloquea el slice 3, no los demás).

## Slice 2 — corregir la procedencia de lo ya publicado (2026-08-03)

### Objetivo

Cerrar el camino sin retorno que dejó el slice 1: quien declaraba mal su procedencia no podía
corregirla desde ninguna pantalla, ni siquiera siendo admin, porque `EditPostForm` nunca tuvo el
campo.

### Decisiones y por qué

**`validateNewPost` desaparece.** Es la mejor parte del slice y es una resta, no una suma. Ese
método existía por una sola razón: la edición validaba sin recibir el `origin`, y exigir lo que la
pantalla no pregunta habría roto los trece productos que ya existían. Al darle el campo a la
edición el motivo se acabó, y la regla vuelve a `validate` junto a la del precio, que es donde se
lee de corrido. Una abstracción que nació de una limitación temporal debe morir con ella.

**La defensa de servidor se repite, no se comparte.** `updatePost` llama a `resolveOriginForUser`
igual que publicar, con su propio `isAdmin`. Compartir el trámite habría significado una función
que recibe `FormData` y una sesión, o sea acoplar dos acciones que hoy coinciden por casualidad.

**Corregir es también ponerse al día.** El único producto sin procedencia —el anterior a la regla—
se arregla por aquí, sin que nadie entre a la base. El e2e de edición que ya existía se volvió el
escenario de eso: sembraba un producto sin procedencia y ahora, además, la declara.

### Archivos tocados

- **Dominio:** `PostValidator.ts` (la regla vuelve a `validate`), `types.ts` (`IPostValidator`
  encoge).
- **Use cases:** `updateOnePostUseCase.ts` (procedencia en la entrada y en la validación),
  `createOnePostUseCase.ts`, `mocks.ts`.
- **Puertos/infra:** `IPostAdminRepository.ts` (`EditablePost` y `PostContentUpdate` ganan
  `origin`), `PostgresPostAdminRepository.ts` (lo lee y lo escribe).
- **App:** `editar/[slug]/actions.ts`, `editar/[slug]/page.tsx`, `ui/EditPostForm.tsx`.
- **Pruebas:** `PostValidator.test.ts`, `managePost.test.ts`, `readPostRow.ts`,
  `managePost.spec.ts`, `fixProvenance.spec.ts` (**nuevo**).

### Validación

- `typecheck` limpio, `test:run` **624/624**, `lint` sin errores.
- e2e de las áreas tocadas (`localProducers`, `sellerStore`): **31/31**.

### Recap

Una procedencia mal declarada ya se corrige desde la pantalla de edición, con las mismas reglas de
rol y la misma defensa en servidor que al publicar. El desdoble del validador se fue con el motivo
que lo justificaba.

### Próximos pasos (opciones)

1. Slice 3 — la distancia en el producto.
2. Slice 4 — orden por cercanía.

**Pendiente del usuario:** qué se le enseña a quien niega el permiso de ubicación.

## Slice 3 — la distancia en el producto (2026-08-03)

### Objetivo

Que la publicación diga a qué distancia está la tienda de quien la mira. Es la mitad que le faltaba
a la promesa: saber quién produce no sirve si no se sabe quién está cerca.

### Decisiones y por qué

**Dos fuentes para la ubicación del visitante, y en orden.** Primero la cookie que deja el botón
—lo más reciente y lo más explícito—, luego `users.last_latitude`, que **el bot de WhatsApp ya
llenaba** desde su migración `69113f019ca5`. Ese hallazgo cambió el slice: quien ya habló con el bot
ve distancias sin que el sitio le pida nada. Compartirla desde la web escribe las dos, para que no
haya dos verdades sobre dónde está la misma persona.

**Negar el permiso no es un error que haya que remediar.** Se dice una vez y el sitio sigue como
antes: sin distancias y con lo más reciente primero. Fue decisión del usuario, y evita la pantalla
que ruega.

**El dominio devuelve número y unidad, no texto.** `describeDistance` da valor y unidad, y la
traducción la pone el catálogo. Y redondea: metros enteros, kilómetros con un decimal. Cuatro
decimales de kilómetro no ayudan a decidir a nadie, y fingir precisión sobre una coordenada de
navegador es fingir dos veces.

**El módulo de la cookie se separó del que lee la ubicación.** No por gusto: el segundo arrastra
`next-auth` y la suite de Playwright reventaba al importar la constante. Lo descubrió el primer
intento de correrla.

### Archivos tocados

- **Dominio:** `distance.ts` y su test (**nuevos**).
- **Infra:** `location/locationCookie.ts`, `location/visitorLocation.ts`,
  `dataAccess/sellers/PostgresPostDistance.ts` (**nuevos**).
- **Presentación:** `location/StoreDistance.tsx`, `location/ShareLocationButton.tsx`,
  `location/actions.ts` (**nuevos**).
- **App:** `[slug]/page.tsx` (resuelve la distancia), `[slug]/ui/PostDetail.tsx`.
- **i18n:** espacio `distance` nuevo en los dos catálogos.

### Validación

- `typecheck` limpio, `test:run` **638/638**, `lint` sin errores, e2e de `localProducers` **7/7**.

### Recap

La publicación dice a cuántos metros o kilómetros está su tienda cuando se saben las dos
ubicaciones, y ofrece compartir la propia cuando falta. Sin ubicación no se inventa nada.

### Próximos pasos (opciones)

1. Slice 4 — que el catálogo entero salga por cercanía.
2. Slice 5 — el mapa.

## Slice 4 — el catálogo por cercanía (2026-08-03)

### Objetivo

Que el catálogo salga de lo más cercano a lo más lejano, con la red de seguridad que pidió el
usuario: si no hay nada cerca, mostrar lo lejano en vez de una página vacía.

### Decisiones y por qué

**`NULLS LAST` y la ausencia de filtro por radio son la misma decisión.** Nada desaparece del
catálogo por no tener ubicación: lo publicado sin tienda, o por una tienda sin sucursal, baja al
final en vez de esfumarse. Y como no hay filtro, la red de seguridad no necesita código aparte —
sale sola de cómo está escrito el orden. Lo único que se añadió es el renglón que lo dice.

**El aviso mira la primera fila, no todas.** La consulta ya viene ordenada por distancia: si la más
cercana está lejos, todas lo están.

**Sin ubicación, por fecha descendente, exactamente como antes.** No compartir la ubicación no
degrada el sitio; lo deja como estaba.

### El fallo que enseñó algo

El escenario del orden falló en la primera corrida y la causa vale más que el arreglo: **la sucursal
de Hazlo Sano está en el ancla**, así que sus trece productos quedan a cero metros y llenan enteras
las páginas de cuatro. El orden estaba bien y la prueba no podía verlo. Se arregló plantando al
visitante a 350 m de la tienda sembrada en vez de en el ancla. La segunda lección vino de la cifra:
la siembra desplaza la latitud con 111.32 km por grado y PostGIS mide sobre el elipsoide, así que
los 350 m salen como 348 — el escenario afirma la unidad y el orden de magnitud, no la geodesia.

### Archivos tocados

- **Infra:** `PostgresPostQueryRepository.ts` (columna de distancia y cláusula de orden),
  `IPostQueryRepository.ts`, `mapPostsToCards.ts`, `CardForList.tsx`.
- **App:** `productos/data.ts` y las dos páginas del catálogo.
- **e2e:** `nearbyFirst.spec.ts` (**nuevo**), `seedStore.ts` (`coordinatesAtKm`).

### Validación

- `typecheck` limpio, `test:run` **638/638**, `lint` sin errores, e2e de `localProducers` **10/10**.

### Recap

El catálogo sale por cercanía cuando se sabe dónde está quien mira, cada tarjeta dice su distancia,
y cuando todo queda fuera de los 50 km se muestra igual, diciéndolo.

### Próximos pasos (opciones)

1. Slice 5 — el mapa.
2. Llevar el orden por cercanía a la búsqueda y a las categorías.

## Slice 5 — el mapa de tiendas (2026-08-03)

### Objetivo

Poder elegir por cercanía **viéndolo**, que no es la misma pregunta que responde la lista: esta dice
cuál está más cerca, el mapa dice cuál queda de camino.

### Decisiones y por qué

**Leaflet con teselas de OpenStreetMap.** Sin llave de API y sin cuenta que administrar, que para un
sitio de pueblo es la diferencia entre tener mapa y no tenerlo. Entran dos dependencias nuevas
(`leaflet`, `react-leaflet`) y es la primera vez en esta feature que se añade una: los cuatro slices
anteriores salieron con lo que ya había.

**`next/dynamic` con `ssr: false`, y aquí sí está justificado.** Leaflet toca `window` al
importarse; renderizarlo en el servidor revienta la página. Por eso el mapa vive en su propio módulo
(`StoresMapCanvas`) en lugar de detrás de una condición.

**Pines de HTML, no los iconos del paquete.** Los de Leaflet se referencian por ruta relativa a su
CSS, y con el bundler de Next esa ruta no existe: salen marcadores rotos. Un `divIcon` no depende de
ningún asset, así que no hay nada que se pueda romper al mover un archivo.

**El encuadre incluye al visitante.** Un mapa donde no te ves no sirve para decidir. Y sin tiendas
que situar no se pinta nada: un mapa con un solo pin —el tuyo— no dice nada.

**El `data-testid` va en el contenedor, no en el `MapContainer`.** react-leaflet solo reenvía
`className`, `id` y `style` al div del mapa y se come el resto. Lo descubrió la prueba.

### Archivos tocados

- **Dominio:** `map.ts` y su test (**nuevos**): el encuadre y el límite de pines.
- **Infra:** `PostgresNearbyStores.ts` (**nuevo**).
- **Presentación:** `StoresMap.tsx`, `StoresMapCanvas.tsx` (**nuevos**).
- **App:** `productos/data.ts` y las dos páginas del catálogo.
- **Dependencias:** `leaflet`, `react-leaflet`, `@types/leaflet`.

### Validación

- `typecheck` limpio, `test:run` **641/641**, `lint` sin errores, e2e del mapa **2/2**.

### Recap

Los cinco slices están entregados. Quien publica un producto declara si lo hace o lo revende y de
qué tan lejos lo trae; la distancia decide qué es local; el directorio de productores se llena solo;
la publicación y el catálogo dicen a qué distancia está cada tienda; el catálogo sale por cercanía
con red de seguridad; y un mapa sitúa las tiendas junto a quien mira.

### Próximos pasos (opciones)

1. **Llevar la cercanía al resto del sitio:** la búsqueda, las categorías y `/negocios-locales`
   siguen saliendo por fecha o por nombre. El orden ya está escrito y es un parámetro más.
2. **Ordenar `/productores-locales` por cercanía**, que hoy sale por nombre.
3. **El ancla deja de ser constante** el día que el sitio sirva a más de un pueblo: pasa a ser un
   parámetro de la consulta, el pueblo del visitante o el de la tienda.
4. **Medir**: cuántas tiendas completan su sucursal ahora que sin ubicación no entran a productores.
   Es la hipótesis de incentivo de todo el roadmap, y hoy no se está midiendo.

## Slice 6 — la cercanía en el home, y decir la verdad cuando falta (2026-08-03)

### Objetivo

Que el feed también ponga distancias, y que **ninguna sección se quede callada** cuando no puede
mostrarlas.

### Decisiones y por qué

**Saber la distancia y ordenarse por ella pasan a ser dos decisiones separadas.** El home es un
feed: lo que promete es lo último que publicó la comunidad, y reordenarlo por cercanía rompería esa
promesa —quien entra a ver qué hay de nuevo dejaría de verlo—. Así que gana la distancia como dato
de cada tarjeta y conserva su orden. El orden por cercanía es del catálogo, donde la pregunta es
"¿dónde compro esto?". Separarlo en la consulta es lo que permite las dos cosas sin duplicar nada.

**Un listado sin distancias parece roto si nadie aclara que la parte que falta es la de quien
mira.** De ahí el aviso en las cuatro secciones. Y desaparece en cuanto hay ubicación: lo que queda
entonces son las distancias, que es la información de verdad.

**Negarse recibe un incentivo, no un reproche.** Quien dijo que no ya contestó; lo que se le ofrece
es la razón para cambiar de opinión —distinguir lo que está a dos cuadras de lo que está a dos
horas— y el botón sigue ahí. Decisión del usuario, y evita la pantalla que ruega.

**A quien no vende se le dice la otra mitad.** Sin vendedores situados no hay distancias que
mostrarle a nadie, por muy bien localizado que esté quien busca. A quien ya tiene tienda se le
calla: no necesita el consejo, y por eso `readViewerLocationContext` responde las dos preguntas
juntas y se ahorra la consulta del vendedor cuando ya hay ubicación.

**El trámite de pedir la ubicación se fue a un hook** porque ahora lo usan dos componentes con
distinta cara. Duplicarlo eran dos sitios donde olvidarse de que negar el permiso no es un error.

### Validación

- `typecheck` limpio, `test:run` **645/645**, `lint` sin errores, e2e completa **115 pasados, 3
  saltados, 0 fallos**.

## Slice 7 — arreglar lo propio sin salir del listado (2026-08-03)

### Objetivo

Que toda publicación en forma de tarjeta ofrezca a su dueño editar y marcar agotado, y que el mapa
deje de tapar el submenú del header.

### Decisiones y por qué

**Quién mira baja como prop y no se lee dentro de la tarjeta.** La tarjeta también se pinta dentro
del scroll infinito del home, que es cliente y donde `auth()` no existe. La alternativa —un contexto
de React— habría obligado a volver cliente a la tarjeta entera y con ella a media pantalla de
listados. Ocultar los controles sigue siendo cortesía y no seguridad: quien decide es el servidor.

**La acción de disponibilidad se mudó de la ruta del detalle a `presentation/`.** Ahora se dispara
desde los dos sitios donde aparece una publicación, y una tarjeta compartida no puede importar desde
`app/` sin invertir las capas. De paso invalida el layout: quien marca agotado desde una tarjeta
está mirando un listado, y ese listado tiene que reflejarlo o parecerá que el botón no hizo nada.

**`isolate` en el mapa.** Leaflet apila sus capas con z-index de 400 a 700 y, sin contexto de
apilamiento propio, esos números competían en la raíz contra el `z-50` del header — y 400 gana. El
escenario que lo cubre no mira el z-index: pulsa el enlace del submenú, que es la prueba de que nada
lo tapa.

### El fallo que enseñó algo

El escenario de marcar agotado desde la tarjeta pasaba en aislamiento y fallaba en la suite
completa. No era orden ni datos: el `goto` a la publicación adelantaba a la acción del servidor, así
que la prueba medía la carrera en vez del comportamiento. Se arregló esperando a que la propia
tarjeta lo confirme —el botón pasa a ofrecer lo contrario— antes de navegar.

### Validación

- `typecheck` limpio, `test:run` **649/649**, `lint` sin errores, e2e completa **118 pasados, 3
  saltados, 0 fallos**.

### Recap

La cercanía está en el detalle, en el catálogo (con orden y mapa) y en el home (sin reordenar), y
las cuatro secciones explican su ausencia cuando la hay. Toda tarjeta deja a su dueño editarla y
marcarla agotada. El mapa ya no tapa el menú.

### Próximos pasos — estado real al 2026-08-03

De los cuatro que dejó el slice 5, **uno quedó hecho y tres siguen abiertos**:

1. ✅ **El home.** Hecho en el slice 6, con la distinción de que no reordena.
2. ⬜ **La búsqueda** (`/buscar`) sigue sin cercanía, y es la que **más lejos** está del resto: no
   usa `getPaginatedPosts` sino `PostgresSearchPostRepository`, un `ilike` con su propio orden. No
   hereda nada de lo construido; hay que llevarle la columna de distancia y el orden a mano.
3. ⬜ **Las categorías** (`/categoria/<key>`) tampoco. Esta sí es barata: `getPostsByCategory` ya
   pasa por `getPaginatedPosts`, así que es pasarle `near` y decidir si ordena o solo informa —
   probablemente ordenar, porque una categoría es catálogo, no feed.
4. ⬜ **Los directorios** (`/negocios-locales`, `/productores-locales`) ordenan por `s.name`.
   Ordenarlos por cercanía es el cambio más visible que queda: son las dos páginas cuya razón de
   ser es la proximidad, y hoy son las únicas que no la usan para nada más que filtrar.
5. ⬜ **El ancla como parámetro**, el día que el sitio sirva a más de un pueblo.
6. ⬜ **Medir** cuántas tiendas completan su sucursal. Sigue sin instrumentarse, y sigue siendo la
   hipótesis que sostiene el roadmap entero.
