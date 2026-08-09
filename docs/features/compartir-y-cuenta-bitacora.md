# Bitácora — Compartir y Mi cuenta

## Slice 1 — Compartir la tienda y el perfil desde Mi cuenta (2026-08-08)

### Objetivo

Que repartir la dirección de la tienda o del perfil sea un clic, en vez de seleccionar un texto que
además es un enlace —arrastrar sobre él navega—, copiarlo, cambiar de aplicación y pegarlo.

### Decisiones y por qué

**Los enlaces de compartir viven en el dominio, no en el componente.** `shareTargets.ts` es una
tabla de constructores, uno por red. Puestos dentro del JSX no se pueden probar sin navegador; aquí
se prueban con una corrida de escritorio de once casos y los reusará el slice 4 sin tocar nada.

**A Facebook no se le manda texto, y hay una prueba que lo fija.** `sharer.php` solo lee `u`: desde
2017 descarta `quote` y `description` y compone la publicación con las etiquetas Open Graph del
destino. Pasarle el texto habría sido código muerto con aspecto de funcionar, y el día que alguien
"arreglara" la vista previa habría empezado por el sitio equivocado.

**Instagram y TikTok no están en la lista porque no tienen dirección de compartir web.** No es un
recorte de alcance: no existe la URL. La única vía real a esas dos es `navigator.share`, y por eso
la hoja nativa es el camino principal y no el respaldo.

**El reparto nativo/menú se decide después de montar.** `navigator` no existe en el servidor. Si el
componente lo consultara durante el render, el HTML del servidor y el del cliente no coincidirían y
React descartaría el árbol al hidratar. El estado arranca en "no hay hoja nativa", que además es el
que funciona en todas partes.

**La confirmación de copiado vive fuera del menú.** Elegir "Copiar enlace" cierra el desplegable de
Radix; dentro, el "¡Copiado!" se desmontaría en el mismo gesto que lo provoca. Va al lado del botón,
con `role="status"` para que se anuncie sin robar el foco.

**Las clases del desplegable se extrajeron en vez de copiarse.** Al nacer el segundo menú, `UserMenu`
y `ShareMenu` habrían tenido las mismas tres cadenas de Tailwind duplicadas. Viven en
`design_system/styling/menuSurface.ts`: son solo clases, no saben qué cuelga de ellas.

### Archivos tocados

**Dominio**
- `src/domain/sharing/shareTargets.ts` (nuevo) + `shareTargets.test.ts` (nuevo).

**Presentación**
- `src/presentation/sharing/ShareMenu/ShareMenu.tsx` (nuevo) + `ShareMenu.test.tsx` (nuevo).
- `src/presentation/design_system/styling/menuSurface.ts` (nuevo).
- `src/presentation/chrome/Header/UserMenu.tsx` — consume las clases extraídas; sin cambio visual.

**Rutas**
- `src/app/[locale]/cuenta/ui/StoreCard.tsx`, `ui/UsernameSection.tsx` — montan el menú.

**i18n**
- `src/i18n/messages/{es,en}.json` — namespace `share` (10 claves) y `account.shareStoreText` /
  `account.shareProfileText`.

**Especificación y pruebas**
- `docs/features/compartir-y-cuenta.md` (nuevo, roadmap de 4 slices).
- `src/e2e/compartir/compartir.feature` (nuevo, 14 escenarios).
- `src/e2e/compartir/compartir.spec.ts`, `src/e2e/compartir/SharePanel.ts` (nuevos).

### Comandos

```
pnpm exec vitest run src/domain/sharing/ src/presentation/sharing/
pnpm run typecheck
pnpm run lint
pnpm run test:run
pnpm exec playwright test src/e2e/compartir/ --reporter=list
```

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **994/994** en 104 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | sin errores; queda 1 `info` **preexistente** en `admin/productos/ui/IndexingStatusPanel.tsx` |
| `playwright test src/e2e/compartir/` | **4/4** en 51.6 s |
| `pnpm run test:e2e:run` (suite completa) | **NO EJECUTADA** — pendiente |

### Desviaciones del roadmap

Ninguna en alcance. Dos notas de ejecución:

1. **La suite e2e completa no se corrió.** Se interrumpió a petición del usuario. Los 4 escenarios
   nuevos sí pasaron; lo que queda sin verificar es la no-regresión del resto (~91 escenarios), en
   particular los 7 de `sellerStore.feature` que tocan `/cuenta`.
2. **Se detuvo un `next dev` del usuario (PID 35072).** Next se niega a levantar un segundo dev
   server sobre el mismo directorio —el bloqueo es por proyecto, no por puerto—, y
   `playwright.config.ts` tiene `reuseExistingServer: false` a propósito. Se recupera con
   `pnpm run dev`.

### Aprendizajes de las pruebas

`userEvent.setup()` **instala su propio `navigator.clipboard`**. Los dos casos de copiado fallaban
afirmando sobre un doble que nadie miraba: el mock se ponía antes del `setup()` y este lo pisaba.
El orden correcto es `setup()` primero y los dobles encima, y así quedó documentado en el archivo.

En Playwright pasa lo simétrico pero al revés: el Chromium de Windows **sí** trae `navigator.share`,
así que sin quitarlo el componente ofrecería la hoja del sistema operativo —un diálogo que Playwright
no puede cerrar— y la prueba colgaría hasta el timeout. `withoutNativeShare()` lo retira con un
`addInitScript` antes de cargar la página.

### Pendientes

- Correr `pnpm run test:e2e:run` completa.
- Dos `sellers` `e2e-…` huérfanos con `user_id = NULL` en la base, residuo de una corrida caída
  anterior a este trabajo.
- 20 de los 21 usuarios no tienen dirección personal reservada.

### Recap

El slice 1 está implementado y verde en todo lo que se ejecutó: el dominio de compartir es una tabla
pura probada con once casos, el `ShareMenu` resuelve hoja nativa y desplegable con ocho pruebas de
componente, y los dos sitios de `/cuenta` que enseñaban una dirección como texto ahora la reparten en
un clic. `typecheck`, `lint` y las 994 pruebas unitarias pasan, y los 4 escenarios e2e nuevos también.
Lo único sin verificar es la no-regresión de la suite e2e completa, que se interrumpió a petición.

### Próximos pasos (opciones)

1. **Correr la suite e2e completa** para cerrar la validación del slice 1. Requiere que ningún
   `next dev` esté levantado sobre este directorio. *(Recomendado antes de commitear.)*
2. **Seguir con el slice 2** — los enlaces a la tienda y al perfil en el menú del avatar, con el
   bloque de identidad y el `@usuario`.
3. **Saltar al slice 3** — la jerarquía en tarjetas de `/cuenta`, si lo que más molesta hoy es cómo
   se ve la página.
4. **Commitear lo que hay** en `feat/compartir-y-cuenta` y decidir después.

**Pendiente del usuario:** decidir si se corre la e2e completa antes de commitear, y volver a
levantar su `pnpm run dev` cuando lo necesite.

---

## Slice 2 — El menú del avatar lleva a mi tienda y a mi perfil (2026-08-08)

### Objetivo

Que quien tiene tienda o dirección personal llegue a ellas desde el avatar, en vez de entrar a
`/cuenta` y buscar el enlace entre los formularios. Y que el menú diga **con qué identidad** estás
mirando el sitio, como hacen Instagram, TikTok y X en ese mismo sitio.

### Decisiones y por qué

**Se ofrece solo lo que existe, y no una puerta a darlo de alta.** El menú no pinta «Mi tienda»
apagada ni un «Abre tu tienda»: para eso ya está «Mi cuenta», que es lo único que ven **20 de los 21
usuarios** de la base. Añadir promesas al menú de todo el mundo para un caso que hoy es único habría
sido optimizar por el usuario que no existe.

**El dato se lee con `cache()` de React, no con `unstable_cache`.** Esto es dato de sesión: el caché
de datos de Next guarda **entre peticiones** y le habría enseñado la tienda de una persona a la
siguiente que entrara. `cache()` solo deduplica dentro del render en curso, que es justo lo que hace
falta — y como `/cuenta` pasó a usar los mismos lectores, esa página sigue haciendo **dos** consultas
y no cuatro, pese a que ahora también las pide el encabezado.

**El bloque de identidad repinta el avatar.** El del disparador queda tapado por el propio
desplegable cuando se abre. Repetir el elemento es legal en React y es lo que hacen Facebook e
Instagram: el menú tiene que sostenerse solo.

**En móvil, la dirección personal desplaza al texto genérico.** Donde antes decía «Mi cuenta y mi
tienda» ahora dice `@tu-direccion` si la reservaste: ocupa lo mismo y dice más.

**`MobileAccountCard` salió de `Header`.** El bloque de la cuenta pasó de ser composición a tener
lógica propia —qué existe y qué no—, y `Header` ya reparte escritorio, móvil, buscador e idioma.

### Archivos tocados

**Infra**
- `src/infra/dataAccess/identity/sessionIdentity.ts` (nuevo) — `findSellerOfUser`,
  `findProfileOfUser` y `findPublicAddresses`, los tres cacheados por render.

**Presentación**
- `src/presentation/chrome/Header/UserMenu.tsx` — bloque de identidad con `@usuario` y las dos
  entradas condicionales.
- `src/presentation/chrome/Header/MobileAccountCard.tsx` (nuevo) — extraído de `Header`.
- `src/presentation/chrome/Header/Header.tsx` — resuelve las direcciones y las reparte a los dos
  menús.
- `src/presentation/chrome/Header/UserMenu.test.tsx` — la tabla de los cuatro estados.

**Rutas**
- `src/app/[locale]/cuenta/page.tsx` — usa los lectores cacheados en vez de los repositorios.

**i18n**
- `src/i18n/messages/{es,en}.json` — `nav.myStore` y `nav.myProfile`.

**Pruebas**
- `src/e2e/compartir/avatarMenu.spec.ts` (nuevo) — 5 escenarios, incluido el móvil.
- `src/e2e/compartir/compartir.feature` — los escenarios del slice 2, ajustados a los datos que la
  prueba siembra de verdad.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **1001/1001** en 104 archivos (7 nuevas) |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | sin errores; sigue el mismo `info` preexistente en `admin/productos` |
| e2e | **NO EJECUTADA** — el usuario las corre todas al final de los slices |

### Desviaciones del roadmap

Se añadió un escenario e2e que el roadmap no listaba: «Quien no tiene nada de eso no ve puertas a
páginas que no existen». Es el caso de 20 de 21 usuarios y solo estaba cubierto por Vitest; con una
regresión en `Header` —pasar `""` en vez de `null`, por ejemplo— la tabla de componente seguiría
verde y el menú real enseñaría un enlace roto.

### Recap

El menú del avatar y el menú móvil ya llevan a la tienda y al perfil propios cuando existen, con el
`@usuario` bajo el nombre, y no ofrecen nada cuando no existen. El dato se resuelve una vez por
render y `/cuenta` no paga consultas de más pese a que ahora el encabezado también las pide. Las
1001 pruebas unitarias, `typecheck` y `lint` pasan; los 9 escenarios e2e de esta rama (4 del slice 1
y 5 del slice 2) están escritos pero **sin ejecutar**, por decisión de correrlos todos al final.

### Próximos pasos (opciones)

1. **Seguir con el slice 3** — la jerarquía en tarjetas de `/cuenta`: un solo `h1`, cada bloque en su
   `Surface` y estados vacíos explícitos. *(Es el último slice del alcance acordado.)*
2. **Correr la e2e completa ahora**, antes de acumular un tercer slice sin ejecutar.
3. **Commitear los dos slices** en `feat/compartir-y-cuenta` y decidir después.

**Pendiente del usuario:** correr `pnpm run test:e2e:run` cuando cierre los slices, con ningún
`next dev` levantado sobre este directorio.

---

## Slice 3 — La UX de Mi cuenta, ordenada (2026-08-08)

### Objetivo

Que `/cuenta` se lea como una página con jerarquía y no como una lista de formularios pegados. Sin
tocar Server Actions ni la forma de ningún formulario, para que los siete escenarios de
`sellerStore.feature` sigan siendo la red de seguridad.

### Lo que se encontró al abrirlo

**La página tenía tres `h1`.** El de `page.tsx`, el de `StoreCard` y el de `BecomeSellerForm` (más
un cuarto en `StoreReadyMessage`). Las dos ramas de la página —con tienda y sin ella— llegaban a dos
títulos principales cada una. Quien navega por encabezados con un lector de pantalla no tenía forma
de saber cuál era el de verdad.

**Cuatro cadenas en español escritas en el JSX**, en `StoreProfileForm`: `"Ficha guardada."`,
`"Cambia tu logo"`, `"Sube tu logo"` y el marcador `"https://mitienda.mx"`. En inglés se veían en
español. Se movieron al catálogo porque la regla de `AGENTS.md` aplica a lo que se toca, y este
archivo se tocaba de todas formas.

### Decisiones y por qué

**Nació `AccountCard` en vez de envolver cinco veces con `Surface`.** Los cinco bloques repetían el
mismo patrón —`<section>`, encabezado en negrita, a veces un párrafo de intro— cada uno con sus
propias clases. Envolverlos desde `page.tsx` habría dejado un `<section>` dentro de otro y las cinco
copias del patrón intactas. Con la tarjeta, el `h2` se decide en **un** sitio: es lo que hace que
«un solo `h1`» siga siendo cierto el día que alguien añada el sexto bloque.

**`AccountCard` no traduce nada.** Recibe `title` e `intro` ya resueltos, igual que `Button` recibe
su `loadingLabel`. Consume `Surface` del sistema de diseño, que ya trae radio, borde y elevación de
los tokens.

**Las columnas se repartieron por función, no por tamaño:** a la izquierda lo que se enseña —la
tienda y la dirección personal, cada una con su botón de compartir del slice 1—, a la derecha lo que
se edita —la ficha y las sucursales—. Antes la dirección personal caía al final de la segunda
columna, **debajo del alta de sucursales**: era lo último que veía quien entraba justo a repartir su
enlace. En móvil el orden de lectura queda tienda → dirección → ficha → sucursales.

### Archivos tocados

**Rutas**
- `src/app/[locale]/cuenta/ui/AccountCard.tsx` (nuevo).
- `ui/StoreCard.tsx`, `ui/UsernameSection.tsx`, `ui/BecomeSellerForm.tsx`, `ui/AddBranchForm.tsx`,
  `ui/StoreProfileForm.tsx` — pasan por `AccountCard`; se van los `h1` y los `<section>` propios.
- `page.tsx` — único `h1`, sucursales en tarjeta, columnas repartidas por función.

**i18n**
- `src/i18n/messages/{es,en}.json` — `storeProfileSaved`, `storeLogoChange`, `storeLogoUpload`,
  `storeWebsitePlaceholder`.

**Pruebas**
- `src/e2e/compartir/cuentaLayout.spec.ts` (nuevo) — 4 escenarios.
- `src/e2e/compartir/compartir.feature` — slice 3 detallado.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **1001/1001** en 104 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | sin errores; sigue el `info` preexistente en `admin/productos` |
| e2e | **NO EJECUTADA** — el usuario las corre todas al cerrar los slices |

### Desviaciones del roadmap

Dos añadidos que el roadmap no listaba, ambos por lo que apareció al abrir los archivos:

1. **Las cuatro cadenas en duro de `StoreProfileForm`.** No era el alcance del slice, pero la regla
   de i18n aplica a todo lo que se toca y el archivo se tocaba igual.
2. **Un escenario e2e de orden** («lo que se reparte va antes que lo que se edita»). Sin él, el
   reparto por columnas es una decisión que el siguiente cambio deshace sin que nada se ponga rojo.

### Riesgo conocido

Los selectores de la suite existente se respetaron a propósito: `store-card`, `username-card`,
`store-ready`, los `aria-label` de los cuatro formularios y los `data-testid` de errores y vistas
previas siguen donde estaban. En particular `ProfilePage.expectClaimed` hace
`getByTestId("username-card").getByRole("link")`, que exige **un solo enlace** dentro de esa tarjeta:
el botón de compartir es un `button` y su menú vive en un portal, así que sigue habiendo uno. Esto
no se ha verificado ejecutando la suite.

### Recap

`/cuenta` pasó de cinco bloques al mismo nivel visual con tres `h1` a una página con un título y
cinco tarjetas colgando de él, repartidas entre lo que se enseña y lo que se edita. La jerarquía se
decide en un único componente, `AccountCard`, y no en cada archivo. Con esto se cierra el alcance
acordado de los tres slices: compartir, el menú del avatar y la UX de la cuenta. Las 1001 pruebas
unitarias, `typecheck` y `lint` pasan; los **13 escenarios e2e** de la rama (4 + 5 + 4) están
escritos y sin ejecutar.

### Próximos pasos (opciones)

1. **Correr `pnpm run test:e2e:run` completa** — es lo que cierra los tres slices. Ningún `next dev`
   puede estar levantado sobre este directorio. *(Recomendado ahora.)*
2. **Commitear los tres slices** en `feat/compartir-y-cuenta`, por zonas o uno por slice.
3. **Abrir el slice 4** (`@future`): reusar `ShareMenu` en `/tienda/[slug]` y en el detalle de la
   publicación, que es donde comparte el comprador y no la vendedora.
4. **Limpiar los dos `sellers` `e2e-…` huérfanos** de la base, anteriores a este trabajo.

**Pendiente del usuario:** correr la e2e y decidir el reparto de commits.

---

## Slice 4 — Compartir en todas partes, y el ajuste de `/cuenta` (2026-08-08)

### Objetivo

Dos cosas que pidió el usuario tras ver el slice 1 en marcha: arreglar cómo se ven las direcciones
en `/cuenta`, y llevar el botón de compartir a la tienda pública, al perfil, a la ficha de una
publicación y a las tarjetas de cualquier listado.

### El ajuste de `/cuenta`

El usuario ya había movido a mano el enlace y el botón a un mismo renglón. Al refactorizarlo
aparecieron tres cosas:

**El `<p>` que los envolvía era HTML inválido.** `ShareMenu` renderiza un `<div>`, y un `<div>`
dentro de un `<p>` hace que el navegador **cierre el párrafo antes de tiempo**: el árbol que React
espera y el que el navegador construye dejan de coincidir, y eso es un error de hidratación. Ahora
es un `<div>`.

**La dirección absoluta partía el renglón.** Se lee el camino (`/tienda/hazlo-sano`) y se comparte
la absoluta. Es decir: se acorta lo que se lee, no lo que se copia.

**Se abre en una pestaña nueva.** Quien pulsa ahí está comprobando cómo se ve su página antes de
repartirla, no navegando: perder la cuenta a medio configurar es justo lo que no quiere.

El par «enlace + compartir» aparecía dos veces, así que vive una sola en `PublicAddressRow`.

**Un detalle que casi rompe la suite sin tocarla:** el aviso de «pestaña nueva» iba a ir como
`<span class="sr-only">` dentro del enlace. Eso lo habría metido en el **nombre accesible** del
enlace, y el nombre de este enlace *es su dirección*: `SellerAccountPage.expectStoreLink` lo
localiza con `new RegExp('/tienda/' + handle + '$')`, y el `$` habría dejado de casar. El aviso
acabó en `title`, que no participa en el nombre accesible cuando hay contenido, y la señal visible
es el icono de enlace externo.

### El slice 4

**El texto va en la voz de quien mira.** En `/cuenta` es «Mira **mi** tienda» porque comparte la
dueña; en la tienda pública es «Mira **esta** tienda» porque comparte quien acaba de decidir que
vale la pena. Son claves distintas (`account.shareStoreText` y `share.storeText`), no una sola
reutilizada, porque no dicen lo mismo.

**Ningún escenario público inicia sesión.** Si compartir exigiera cuenta, la mitad de las veces que
alguien quiere repartir un enlace no podría.

**En las tarjetas, solo el icono.** Doce botones que dicen «Compartir» compiten con los doce
títulos, que es lo que se viene a leer. Lo que **no** se acorta es el nombre accesible: sin
`aria-label` el botón se anunciaría como «botón» a secas, que es lo mismo que no estar. El panel
además abre desde `end`, o se saldría de la tarjeta.

**La dirección de una tarjeta se fuerza a absoluta.** `to` llega absoluta desde `mapPostsToCards`,
pero una tarjeta armada a mano la trae relativa —la de la propia prueba, sin ir más lejos—, y un
camino relativo no resuelve en la aplicación donde acabe pegado.

**`Card` ganó una ranura `actions`**, alineada al final del renglón de la firma. Ahí y no sobre la
imagen: ese renglón ya es el borde inferior de la tarjeta, y encima de la foto taparía justo lo que
se mira para decidir.

### Archivos tocados

**Presentación**
- `src/presentation/sharing/ShareMenu/ShareMenu.tsx` — variante `icon` y alineación del panel.
- `src/presentation/post/Card/Card.tsx` y `Card/types.ts` — ranura `actions`.
- `src/presentation/post/CardForList/CardForList.tsx` — botón de compartir y `absoluteUrl`.

**Rutas**
- `src/app/[locale]/cuenta/ui/PublicAddressRow.tsx` (nuevo).
- `ui/StoreCard.tsx`, `ui/UsernameSection.tsx` — usan la fila; se va el `<p>` inválido.
- `src/app/[locale]/tienda/[slug]/ui/StoreHeader.tsx`, `src/app/[locale]/u/[username]/ui/ProfileHeader.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.tsx` — botón de compartir.

**i18n**
- `share.storeText`, `share.profileText`, `share.postText`, `account.opensInNewTab`.

**Pruebas**
- `src/e2e/compartir/compartirPublico.spec.ts` (nuevo) — 5 escenarios sin sesión.
- `ShareMenu.test.tsx` (+1), `CardForList.test.tsx` (+3).
- `compartir.feature` — slice 4 detallado, ya sin `@future`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **1005/1005** en 104 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | sin errores; sigue el `info` preexistente en `admin/productos` |
| e2e | **NO EJECUTADA** — el usuario las corre todas al final |

### Riesgo conocido

`ProfileHeader` recibe `profile.username` como `string | null`. A `/u/…` solo se llega con una
dirección reclamada, pero el tipo no lo sabe: en vez de forzarlo con un `!`, el botón **se omite**
si es nulo. Compartir una dirección que no resuelve es peor que no ofrecerla.

### Recap

Compartir dejó de ser una función de `/cuenta` para ser una del sitio: está en la tienda pública, en
el perfil, en la ficha de cada publicación y en cada tarjeta de cualquier listado —home, búsqueda y
catálogo de tienda, que comparten componente—. Y las direcciones de `/cuenta` ya no parten el
renglón, se abren en pestaña nueva y viven en un solo componente junto a su botón. Las 1005 pruebas
unitarias, `typecheck` y `lint` pasan. La rama acumula **18 escenarios e2e sin ejecutar**.

### Próximos pasos (opciones)

1. **Correr `pnpm run test:e2e:run`** — son 18 escenarios nuevos y cuatro slices sin verificar. Es
   lo que más valor tiene ahora. *(Recomendado.)*
2. **Commitear los cuatro slices** en `feat/compartir-y-cuenta`.
3. **Revisar en el navegador** cómo queda el icono de compartir en una tarjeta con título largo,
   que es lo único que no se ve bien en una prueba.

**Pendiente del usuario:** correr la e2e, con ningún `next dev` levantado sobre este directorio.

---

## Cierre — la e2e completa, y los tres fallos que dejó al descubierto (2026-08-08)

### Resultado

| Corrida | Resultado |
| --- | --- |
| Primera, suite completa | **193 pasaron, 3 fallaron**, 3 saltadas (10.2 min) |
| Tras corregir | **196 pasaron, 0 fallos**, 3 saltadas (8.4 min) |

Las 3 saltadas son condicionales preexistentes (`HAZLO_SANO_ADMIN_EMAILS` y `GEMINI_API_KEY` sin
configurar en este entorno), no algo que introdujera este trabajo.

### Los tres fallos eran de las pruebas, no de la aplicación

Los tres eran **violaciones de modo estricto** de Playwright por localizadores demasiado laxos, y
ninguno era intermitencia:

| Escenario | Qué casaba de más |
| --- | --- |
| `@dirección` en el menú | El mismo texto en el bloque móvil y en el desplegable |
| «solo se le ofrece su cuenta» | `getByText("Mi cuenta")` casaba con «Mi cuenta y **mi tienda**» |
| «cada bloque en su tarjeta» | `name: "Tu tienda"` casaba con «La ficha de **tu tienda**» |

Los dos primeros tienen la misma raíz, y es una que el repositorio **ya tenía documentada** en
`menu/mobileMenu.spec.ts`: el menú móvil sigue en el DOM aunque el CSS lo esconda. El slice 2 añadió
al bloque móvil el nombre, la `@dirección` y los atajos —los mismos que el desplegable— y las
pruebas del desplegable se escribieron sin acotar. El tercero es que tanto `getByText` como el
`name` de `getByRole` comparan **por subcadena** salvo que se pida `exact`.

### Lo que se cambió para corregirlos

- `UserMenu` pinta ahora `data-testid="user-menu"` en su contenido, simétrico con el `mobile-menu`
  que ya existía. Es cambio de producción, y hace falta: sin él no hay forma de distinguir dos menús
  que muestran deliberadamente lo mismo.
- `avatarMenu.spec.ts` acota al desplegable y usa `getByRole("menuitem", { exact: true })`.
- `cuentaLayout.spec.ts` usa `exact: true` al buscar cada encabezado.

### Aprendizaje

**Añadir una segunda vista de la misma información invalida las pruebas de la primera.** El slice 2
duplicó a propósito la identidad entre escritorio y móvil —es la decisión correcta de producto— y
con ello volvió ambiguos unos localizadores que hasta entonces eran únicos. El fallo no apareció al
escribir el slice 2, sino al correr la suite entera: los específicos de `compartir/` pasaban en
aislamiento porque el problema no era de orden ni de estado compartido, sino de que nunca se habían
ejecutado.

### Recap

Los cuatro slices están verdes de punta a punta: **1008 pruebas unitarias** y **196 escenarios e2e**,
con `typecheck` y `lint` limpios. La rama `feat/compartir-y-cuenta` queda lista para commitear.

### Próximos pasos (opciones)

1. **Commitear la rama**, por slice o por zona.
2. **Limpiar los dos `sellers` `e2e-…` huérfanos** de la base (`user_id = NULL`), residuo de una
   corrida caída anterior a este trabajo.
3. **Revisar en el navegador** el reparto de la fila de datos con nombre de tienda largo y precio de
   cuatro cifras a la vez, que es cuando se parte en dos renglones — lo único que ninguna prueba
   puede juzgar.

**Pendiente del usuario:** decidir el reparto de commits.
