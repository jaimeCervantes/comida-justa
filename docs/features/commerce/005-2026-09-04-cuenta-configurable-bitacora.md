# Bitácora — La cuenta se configura sola

## Slice 1 — La cuenta se lee de un vistazo (2026-09-04)

### Objetivo

Que quien abre `/cuenta` sepa en el primer vistazo **cuál es su tienda, qué direcciones reparte y
qué le falta por configurar**, sin cambiar el sistema de diseño ni ninguna dirección pública.

### El diagnóstico que se acordó

`/cuenta` montaba cinco `AccountCard` del mismo peso visual repartidas en dos columnas por un
criterio interno —«lo que se enseña» / «lo que se edita»—. Ese corte partía las sucursales en dos
(lista en una columna, alta en la otra) y dejaba las direcciones públicas compitiendo por sitio con
formularios largos. El `h1` decía «Mi cuenta», que es literalmente lo que dice el menú de la
izquierda dos centímetros más allá.

### Decisiones, y por qué

**1. La regla de «qué falta» es dominio puro, no una consulta más.**
`readAccountSetup` (`src/domain/entities/seller/accountSetup.ts`) recibe un retrato —nombre de
tienda, dirección personal, logo, descripción y las coordenadas de cada sucursal— y devuelve los
cinco pasos con su marca. **No cuesta ni una consulta nueva**: los cinco datos salen de lo que la
página ya leía para pintarse. Ponerlo en el dominio hace que el caso interesante —`0,0` no cuenta
como ubicación, porque es el Golfo de Guinea— se compruebe en milisegundos y no montando una
pantalla. Reutiliza `areValidCoordinates`, que ya tomaba esa decisión para el mapa.

**2. El orden de los pasos es fijo, no se reordena al cumplirlos.**
Una lista que se recoloca sola obliga a releerla entera para saber dónde ibas. Con `ACCOUNT_SETUP_ORDER`
el que ayer estaba tercero sigue tercero y solo cambia su marca. Es además el orden de dependencia
real: sin tienda no hay logo que subir.

**3. La lista desaparece cuando no falta nada.**
Cinco marcas verdes permanentes son ruido con forma de logro: ocupan el sitio más valioso de la
pantalla para no pedir nada. `SetupChecklist` devuelve `null` con `setup.complete`.

**4. La cabecera se llevó dos tarjetas por delante, y no fue alcance de más.**
`AccountHeader` pasa a ser la dueña de las dos direcciones públicas. Dejar además `StoreCard` y la
rama «ya reservada» de `UsernameSection` habría pintado **cada dirección dos veces en la misma
pantalla**, que es peor que el problema que veníamos a arreglar. Así que:

- `StoreCard` se borró. Su mensaje «esta tienda no tiene página pública» —el caso de los vendedores
  que creó el chatbot— **se conservó** dentro de la cabecera: se dice, no se calla.
- La rama «ya reservada» de `UsernameSection` se borró **después de comprobar que nunca llegaba a
  verse**: `claimUsername` revalida `/cuenta`, la página vuelve con la dirección puesta y la sección
  entera deja de montarse. Los seis escenarios que buscaban `username-card` la esperaron cinco
  segundos y no apareció. Es el mismo caso que `StoreReadyMessage` en `BecomeSellerForm`, que el
  slice anterior ya había retirado por lo mismo. El **formulario** sigue montándose mientras no haya
  dirección: ahí no es un duplicado, es la acción que falta.
- Con `StoreCard` se fue también el enlace duplicado a la agenda, que ya estaba en `AccountNav`.
  Estaba planificado para el slice 3; llegó gratis aquí.

**5. El `h1` nombra la tienda.**
El único encabezado de nivel 1 de la pantalla se gastaba en repetir lo que dice el menú. Ahora dice
lo único que esta página puede decir y el menú no. Sin tienda abierta sigue siendo «Mi cuenta»,
porque entonces no hay nada más que nombrar.

**6. Los enlaces de la lista llevan al ancla del bloque, no al principio de la página.**
`anchors.ts` existe porque el ancla es un **contrato entre dos archivos** —el que enlaza y el que se
deja enlazar—; escrita dos veces se rompe en silencio (el enlace sigue funcionando, solo que no
lleva a ningún sitio). `AccountCard` lleva `scroll-mt-24` siempre: con el encabezado fijo del sitio,
un salto sin margen deja el título debajo de la barra.

**7. `ChecklistProgress` es design system; `SetupChecklist` no.**
La pieza genérica —avance escrito, barra, renglones con marca y acción— no sabe nada de tiendas y no
traduce nada, igual que `EmptyState` y `Alert`. La acción de cada renglón llega como `ReactNode`
porque un `Link` de `~/i18n/navigation` necesita el idioma activo y esa carpeta tiene que poder
pintarse fuera del árbol de next-intl. La barra va `aria-hidden` y el número escrito al lado: una
barra es la peor forma de contar cinco cosas para quien no la ve.

**8. Dos correcciones que solo aparecieron al mirar la pantalla.**
Se capturó `/cuenta` en escritorio, móvil (390 px) y sin tienda, y salieron dos cosas que ninguna
prueba iba a ver:
- Sin tienda ni dirección, la cabecera era **una tarjeta con un título dentro y nada más**: un marco
  alrededor del vacío. Ahí se queda en el `h1` pelado y quien manda en la pantalla pasa a ser la
  lista de pendientes, que es justo lo que esa persona necesita.
- Los cinco «Configurar» eran botones **rellenos**, y en columna pesaban más que el «Guardar ficha»
  que sí es la acción principal. Pasaron a contorno (`color="white"` + `border-separator`), sin
  inventar una variante nueva.

### Desviaciones del roadmap

- El `.feature` decía que sin logo se leen **las iniciales «PL»**. Se reutilizó `StoreLogo`, que ya
  existe y cae a **una sola inicial**, en vez de escribir un avatar nuevo o cambiarle el respaldo a
  los otros cuatro sitios donde se usa. El escenario se corrigió a «la inicial "P"». La promesa
  —no hay imagen rota y la fila mide lo mismo— es la misma.
- El enlace duplicado a la agenda estaba planificado para el slice 3 y salió en este, arrastrado por
  la retirada de `StoreCard`.

### Archivos tocados

**Dominio**
- `src/domain/entities/seller/accountSetup.ts` (nuevo) + `.test.ts`

**Design system**
- `src/presentation/design_system/feedback/ChecklistProgress.tsx` (nuevo)

**Ruta `/cuenta`**
- `anchors.ts` (nuevo), `ui/AccountHeader.tsx` (nuevo) + `.test.tsx`, `ui/SetupChecklist.tsx` (nuevo)
  + `.test.tsx`
- `page.tsx` (reparto de columnas y montaje), `ui/AccountCard.tsx` (`id` + `scroll-mt-24`),
  `ui/UsernameSection.tsx` (se queda solo el formulario), `ui/BecomeSellerForm.tsx`,
  `ui/AddBranchForm.tsx`, `ui/StoreProfileForm.tsx` (prop `id`)
- `ui/StoreCard.tsx` (**borrado**)

**Catálogos**
- `src/i18n/messages/es.json`, `en.json`: 20 claves nuevas en `account` (cabecera y los cinco pasos
  con su consejo)

**Pruebas**
- `src/e2e/sellerStore/cuentaConfigurable.feature` (nuevo), `cuentaConfigurable.spec.ts` (nuevo)
- `src/e2e/testUtils/completeStoreSetup.ts` (nuevo)
- `src/e2e/sellerStore/SellerAccountPage.ts` y `ProfilePage.ts`: **cambian de ancla, no de promesa**
  (`store-card` y `username-card` → `account-identity`)
- `src/e2e/compartir/cuentaLayout.spec.ts`: el `h1` ahora nombra la tienda; `storeCardTitle` sale de
  la lista de bloques; y la regla «lo que se comparte va antes que lo que se edita» se reescribió
  como lo que ahora promete la pantalla —las direcciones van **encima de todo**— en vez de como el
  orden de dos títulos concretos, que es lo que se rompía cada vez que un bloque se movía

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest run src/domain/entities/seller/accountSetup.test.ts` | 17/17 |
| `pnpm run test:run` | **2666/2666** en 245 archivos |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` (`biome check .`) | limpio, 1104 archivos |
| `pnpm exec playwright test src/e2e/sellerStore/cuentaConfigurable.spec.ts` | **7/7** |
| `pnpm exec playwright test src/e2e/compartir src/e2e/sellerStore` | **69/69** (primera pasada: 6 fallos, todos por el ancla `username-card`; ver decisión 4) |
| `pnpm exec playwright test src/e2e/compartir` (repetición) | 27/28 — ver «Un fallo que no es de este slice» |

### Un fallo que no es de este slice

`cuentaLayout.spec.ts › Y el hilo sobrevive a la paginación del perfil` falla, y **no lo rompió este
trabajo**: se comprobó guardando el slice en un `git stash` y corriendo el mismo escenario contra el
árbol base, donde falla exactamente igual.

Lo que pasa es que `/u/<username>/page/1` responde **404** —«Esta página se cosechó ya»—, así que la
barra de vuelta nunca llega a pintarse; el escenario informa «no encuentro `account-back-bar`»
cuando el problema real es que la página no existe. El perfil pagina sobre las publicaciones de la
cuenta de la suite, y el escenario da por hecho que hay al menos una. Es una prueba acoplada a un
dato que no siembra ella misma —justo el patrón que `AGENTS.md` llama frágil—.

Queda anotado como pendiente aparte, no se arregla aquí: tocarlo dentro de este slice mezclaría dos
cambios sin relación en el mismo commit.

> **Corrección, escrita al cerrar el slice 2.** Este escenario **no está roto**: pasa en cuanto la
> base compartida está limpia (25/25 en el shard 1 de la validación final). Lo que se comprobó
> contra el árbol base seguía teniendo residuo de una corrida interrumpida, así que la conclusión
> «no lo rompió este trabajo» era correcta pero la de «está roto» no. Lo frágil sigue siendo real y
> es otra cosa: el escenario da por hecho que la cuenta de la suite tiene publicaciones, en vez de
> sembrar la suya, y por eso responde 404 cuando otra corrida se llevó por delante ese dato.

**Nota de operación**: dos corridas de Playwright se interrumpieron a medias durante este slice. Sus
`afterEach` no llegaron a correr y el residuo en la base compartida hizo fallar 7 escenarios de
`src/e2e/compartir` en la siguiente pasada —incluidos cuatro de `compartirPublico`, que no tocan la
cuenta—. El `globalTeardown` barrió el residuo y esos siete volvieron a pasar. Si vuelve a verse un
fallo raro en esa área, mirar primero si quedó una corrida a medias (y un `next dev` huérfano
ocupando el puerto 3000).

**Escrito en la base compartida**: las corridas de Playwright crean tiendas con prefijo `e2e-`,
direcciones personales `e2e-…` y sus sucursales, y las borran en `afterEach`
(`deleteTestSellerByHandle`, `releaseUsername`, `deleteSession`). No queda nada que deshacer a mano.

### Recap

`/cuenta` ya no abre con un muro de cinco formularios iguales: abre con una cabecera que dice cuál
es tu tienda y las dos direcciones que repartes, y debajo una lista de cinco pasos que se marca sola
y desaparece cuando no falta nada. La regla de qué falta vive en el dominio y no cuesta ninguna
consulta nueva; la pieza que la pinta es genérica y vive en el design system. Se retiraron dos
tarjetas que habrían duplicado cada dirección, y con ellas un enlace duplicado a la agenda. Las dos
columnas de abajo pasaron a ser dos temas —la tienda y sus sucursales— en vez del corte «se enseña /
se edita», que era lo que partía las sucursales en dos. Todo lo demás del sistema de diseño está
intacto: ni un token nuevo, ni una `dark:` suelta.

### Próximos pasos (opciones)

1. **Slice 2 — Las sucursales, en un solo bloque.** Lista y alta en la misma tarjeta, el formulario
   plegado detrás de un botón cuando ya hay al menos una, y cada sucursal diciendo si el mapa la
   encuentra. Arregla de paso el `"Ver en el mapa"` en duro de `BranchList`, que se pinta también en
   la página pública. Es lo que más queda por juntar después de este slice.
2. **Slice 3 — La ficha sin muro.** Campos agrupados por sentido y vista previa del logo que la
   tienda **ya** tiene (hoy solo se ve el que acabas de subir). El enlace duplicado a la agenda ya
   salió aquí, así que el slice queda más corto de lo planificado.
3. **Slice 4 — Abrir tienda deja de ser una bifurcación.** Quitar el «Cancelar» que expulsa a `/` y
   dejar el alta como paso único.
4. **Añadir la agenda como sexto paso de la lista.** Se dejó fuera a propósito porque es la única
   que pediría una consulta más (`findWeeklyHours`). Si te interesa que se reclame, es un cambio de
   media hora.
5. **Arreglar el escenario preexistente de la paginación del perfil.** Que siembre su propia
   publicación en vez de dar por hecho que la cuenta de la suite tiene alguna. Es pequeño y va en su
   propio commit, sin mezclarse con el rediseño.

**Pendiente de tu lado**: decidir cuál de las cuatro va ahora. La rama es `feat/cuenta-configurable`
y no se ha empujado.

---

## Slice 2 — Las sucursales, en un solo bloque (2026-09-04)

### Objetivo

Que la lista de sucursales y su alta dejen de ser dos bloques separados, que el formulario no domine
la tarjeta cuando ya no hace falta, y que el enlace al mapa se lea en el idioma de quien mira.

### El hallazgo que cambió el alcance

El roadmap prometía cuatro cosas. **Una de ellas describía un estado que no puede existir.**

«Cada sucursal dice si el mapa la puede encontrar» daba por hecho que una sucursal podía guardarse
sin ubicación. No puede:

- `branches.location` es **`NOT NULL`** — la semilla del propio escenario reventó contra la
  restricción, y así se destapó.
- `AddBranchUseCase` la rechaza antes de llegar ahí, con `BranchLocationUnresolvedError`.
- Su docstring ya lo decía, y con el motivo: «sin coordenadas no hay sucursal (…) una sucursal sin
  punto en el mapa no aporta nada al único lugar donde se usa —el radio de
  `search_posts_semantic`—, y guardarla daría la impresión de que ya te pueden encontrar cerca
  cuando no es cierto».

Fue un error de diagnóstico al escribir el roadmap, no un fallo del código. Se paró la entrega y se
consultó; la decisión fue **retirar el aviso** en vez de conservarlo por si acaso: un aviso de algo
imposible es código que nadie ve fallar. El escenario se queda escrito en el `.feature` como bloque
`RETIRADO`, con el porqué, para que nadie lo vuelva a proponer.

**Efecto sobre el slice 1**: el paso de la lista de pendientes decía «Agrega una sucursal con
ubicación». El matiz no existe —toda sucursal la tiene por fuerza—, así que pasa a decir «Agrega una
sucursal». El consejo de debajo («sin un punto en el mapa no apareces en las búsquedas por
cercanía») sigue siendo cierto y sigue explicando por qué importa. La fila `0,0` de la corrida de
escritorio se conserva anotada como **defensa**, no como caso real.

### Decisiones, y por qué

**1. Una tarjeta, `BranchesCard`, sujeta las dos mitades.** `AddBranchForm` perdió su `AccountCard`
propia; ahora es solo el formulario. El título del alta deja de ser un `h2`: en un desplegable, la
etiqueta del botón hace ese trabajo.

**2. Se pliega con `<details>` y no con estado de React.** Es exactamente lo que ese elemento
resuelve: funciona antes de que hidrate nada, el navegador pone el `aria-expanded`, y no añade un
componente de cliente a una página que ya tiene cinco. El `open` inicial lo decide el servidor con un
dato que ya tenía —cuántas sucursales hay—, así que la tarjeta llega al navegador en la forma
correcta y no parpadea.

**3. Sin ninguna sucursal, arranca desplegada.** Plegarla ahí escondería la única acción de la
tarjeta detrás de un clic de más, y quien no tiene ninguna viene justamente a dar de alta la primera.
El rótulo del botón cambia con el caso: «Agregar mi primera sucursal» / «Agregar otra sucursal».

**4. `BranchList` traduce el rótulo del mapa, pero no el mensaje de vacío.** Es la diferencia entre
un texto que cambia con **quien mira** y uno que cambia con **dónde se pinta**. «Ver en el mapa» dice
lo mismo en la cuenta y en la tienda —y estaba en duro en español, pintándose también para un
visitante inglés—, así que sale del catálogo dentro del componente. `emptyMessage` sigue llegando por
prop porque dice cosas distintas según la pantalla.

**5. La reserva de dirección personal sube a ancho completo.** Se vio en la captura: metida en la
columna izquierda empujaba la ficha hacia abajo y dejaba media pantalla vacía a la derecha. Es una
acción pendiente —la misma que reclama la lista de arriba—, así que va con ella.

**6. La página ya no lee el catálogo.** Al mudarse el último texto a `BranchesCard`, `page.tsx` se
quedó sin ni una cadena propia. Es lo que hace que mover un bloque de columna no toque ese archivo.

### Una regresión que encontró la suite

`branches.spec.ts › puede tener más de una y ambas se listan` falló, y **con razón**: tras guardar la
primera sucursal la página revalida, ya hay una, y el alta vuelve plegada — así que el segundo alta
escribía en campos ocultos. Es la promesa del escenario funcionando, no una prueba frágil: dar de
alta la segunda **pide ahora un clic que antes no existía**. `BranchesPage.addBranch` despliega el
formulario si viene plegado, preguntando por el `open` del `<details>` y no por la visibilidad del
campo, que es el dato que decide.

### Archivos tocados

**Presentación compartida**
- `presentation/directory/BranchList/BranchList.tsx`: traduce `seeOnMap`, `data-testid` por renglón
- `presentation/directory/BranchList/BranchList.test.tsx` (nuevo)

**Ruta `/cuenta`**
- `ui/BranchesCard.tsx` (nuevo), `ui/AddBranchForm.tsx` (pierde su tarjeta), `page.tsx`,
  `anchors.ts` (se va `addBranch`), `ui/SetupChecklist.tsx` (el paso apunta a la tarjeta fundida),
  `ui/SetupChecklist.test.tsx` (afirma contra `ANCHOR`, no contra la cadena)

**Catálogos**
- `branches.seeOnMap`, `account.branchesIntro`, `account.addBranchOpen`,
  `account.addBranchOpenFirst`; se reescribe `account.setupStepBranchLocation`

**Pruebas**
- `e2e/sellerStore/sucursalesEnUnBloque.spec.ts` (nuevo), `e2e/testUtils/seedBranch.ts` (nuevo),
  `e2e/testUtils/completeStoreSetup.ts` (lo reutiliza), `e2e/sellerStore/BranchesPage.ts`,
  `e2e/compartir/cuentaLayout.spec.ts` (el alta ya no es un `h2` propio)

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2681/2681** en 247 archivos |
| `pnpm run typecheck` y `typecheck:tests` | limpios |
| `pnpm run lint` | limpio |
| `playwright src/e2e/sellerStore` | 44/45 → tras arreglar `BranchesPage`, `branches.spec` **4/4** |
| `playwright src/e2e/sellerStore/{sucursalesEnUnBloque,cuentaConfigurable}.spec.ts` | **11/11** |
| `playwright src/e2e/compartir/cuentaLayout.spec.ts` | 11/14 con la base sucia; ver abajo |
| `playwright src/e2e/{sellerStore,compartir}` **en 3 shards** | **73/73** (25 + 24 + 24) |

**Los tres fallos intermedios eran todos residuo, ninguno un defecto.** Una corrida que el `timeout`
cortó a media faena dejó sin ejecutar sus `afterEach`, y las tiendas y direcciones `e2e-` que
quedaron hicieron fallar `/cuenta/agenda`, la barra de vuelta del perfil y la paginación del perfil
—las tres responden 404 cuando el dato que dan por hecho no está—. Con la base limpia pasan las
tres: la validación final en shards salió **73/73**.

Eso corrige lo que el slice 1 anotó como «fallo preexistente» de la paginación: no lo es. Lo frágil
de ese escenario es otra cosa, y sigue en pie —da por hecho que la cuenta de la suite tiene
publicaciones en vez de sembrar la suya—.

**De aquí en adelante las corridas largas van partidas en shards** (`--shard=n/3`), para que cada
tramo termine dentro de la ventana y ningún `afterEach` se quede sin correr. Es la segunda vez que
una corrida cortada envenena la siguiente.

**Escrito en la base compartida**: tiendas, direcciones personales y sucursales con prefijo `e2e-`,
borradas por los `afterEach` y por el barrido de `globalTeardown`. Nada que deshacer a mano.

### Recap

Las sucursales dejaron de estar partidas: la lista y su alta viven en una sola tarjeta, con el
formulario plegado tras un botón en cuanto hay al menos una y abierto de par en par cuando no hay
ninguna, resuelto con `<details>` y sin un solo componente de cliente nuevo. El «Ver en el mapa» que
estaba en duro en español —y se pintaba también en la página pública— sale ya del catálogo en los dos
idiomas. Y el slice se quedó por el camino una de sus cuatro promesas: avisar de las sucursales sin
ubicación, que resultó describir un estado que ni el esquema ni el caso de uso permiten. Está
documentado en el `.feature` para que no vuelva.

### Próximos pasos (opciones)

1. **Slice 3 — La ficha sin muro.** Agrupar los campos de `StoreProfileForm` por sentido y enseñar el
   logo que la tienda **ya** tiene, no solo el que acabas de subir. Es lo que queda del plan
   original; el enlace duplicado a la agenda ya cayó en el slice 1.
2. **Slice 4 — Abrir tienda deja de ser una bifurcación.** Quitar el «Cancelar» que expulsa a `/` y
   dejar el alta como paso único.
3. **Que el escenario de la paginación del perfil siembre su propia publicación** en vez de dar por
   hecho que la cuenta de la suite tiene alguna. No está roto —pasa con la base limpia—, pero es el
   primero que cae cuando otra corrida deja residuo, y diagnosticarlo cuesta media hora cada vez.
4. **Verificar que el punto de una sucursal es el correcto.** Es el problema real que sí existe y que
   el aviso retirado no atacaba: `coordinates.ts` tiene dos patrones porque la gente copia el centro
   del mapa en vez del pin, así que una sucursal puede estar situada en el sitio equivocado sin que
   nadie lo note. Sería alcance nuevo, no lo acordado.

**Pendiente de tu lado**: elegir cuál va ahora. La rama sigue siendo `feat/cuenta-configurable` y no
se ha empujado.

---

## Slice 3 — La ficha se edita sin muro (2026-09-04)

### Objetivo

Que la ficha de la tienda deje de ser una lista de cinco campos seguidos, que se vea el logo que la
tienda ya tiene sin abrirla en otra pestaña, y que guardar diga algo también a quien no mira la
pantalla.

### Decisiones, y por qué

**1. Tres tramos en vez de cinco campos seguidos.** Nombre, descripción, teléfono, sitio web y logo
caían uno detrás de otro, cada uno con su propio `mb-6`, y no había forma de ver de un vistazo
cuántas decisiones distintas se estaban pidiendo. Ahora son tres preguntas: **Identidad** (quién
eres y qué haces), **Contacto** (cómo te escriben) e **Imagen** (cómo te ven).

**2. `FieldGroup` es un `<fieldset>` con `<legend>`, no un `<div>` con un título.** La diferencia no
se ve, se oye: un lector de pantalla anuncia «Contacto, teléfono de contacto» al entrar en el campo,
así que el tramo se sabe sin salir de él. Con un `<h3>` suelto, el nombre se queda arriba y el campo
se anuncia solo — que es el mismo muro, para quien no ve la pantalla. Vive en el design system
porque no sabe nada de tiendas y no traduce nada.

De paso, **la separación la reparte el grupo**: se fueron los cinco `containerClassName="mb-6"`, que
eran cinco decisiones de espaciado para una que debería ser una. Es la regla de `cardSpacing`.

**3. El logo que ya tienes se ve.** El selector decía «Cambia tu logo» sin enseñar cuál, así que
para saber si valía la pena cambiarlo había que abrir la tienda en otra pestaña. Ahora está al lado,
con el mismo `StoreLogo` del resto del sitio —cae a la inicial cuando no hay ninguno, en vez de una
imagen rota—, y **al subir uno nuevo la vista previa pasa a ser el nuevo**: lo que se ve es lo que va
a quedar, no lo que hay.

**4. Los avisos son los del sistema.** Guardado y error iban en dos `<p>` con colores elegidos a
mano (`text-pw-green`, `text-brand-clay-700`) y **sin `role` ninguno**, así que al guardar un lector
de pantalla no anunciaba nada. `Alert` decide el `role` por el tono —un error interrumpe
(`role="alert"`), una confirmación espera su turno (`role="status"`)— y obliga a poner la etiqueta
escrita, para quien no distingue verde de rojo. Los `data-testid` se conservan, así que
`storeProfile.spec.ts` no se tocó.

**5. El progreso de la subida sale del catálogo.** `ImageVideoUploader` tenía `⏳ Subiendo... {n}%`
y `✅ Subido` **en duro en español** como texto de reserva, y esta ficha no le pasaba los suyos: quien
subiera un logo en inglés leía español en medio de su idioma. Ahora se los pasa. El componente
conserva su reserva para quien no los pase — no es alcance de este slice arreglarle eso a los demás.

### Una prueba intermitente que ya había costado tres diagnósticos

`cuentaLayout › Y el hilo sobrevive a la paginación del perfil` daba por hecho que la cuenta de la
suite tenía alguna publicación: `/u/<username>/page/1` responde **404** cuando no la hay, y el
escenario informaba «no encuentro la barra de vuelta» — un diagnóstico que costó media hora tres
veces distintas, incluida una en la que se registró por error como fallo preexistente. Ahora
**siembra la suya** con `seedPost` y la borra en su `afterEach`, como ya hacía `profile.spec.ts`.

### Un susto que no era: no hubo pérdida de datos

A mitad de la validación, un shard entero empezó a devolver 404 en rutas públicas que sí existen
—`/tienda/hazlo-sano` entre ellas—, y el barrido de la suite tiene una cláusula que borra tiendas
**por dueño** (`user_id IN (SELECT id FROM users WHERE email = SUITE_ACCOUNT_EMAIL)`). Se paró la
entrega y se auditó la base en solo lectura:

| Comprobación | Resultado |
| --- | --- |
| Tienda `hazlo-sano` | existe, con su dueño real (`jaime.cervantes.ve@gmail.com`) |
| Publicaciones totales | 432 |
| Tiendas y traducciones con prefijo `e2e-` | 0 — sin residuo |
| Tiendas que posee la cuenta de la suite | ninguna |

O sea que la cláusula por dueño no alcanza nada real: la cuenta `pw.healthy.food@gmail.com` no tiene
ninguna tienda abierta, que es justo lo que su docstring promete. **Lo que fallaba era el servidor de
desarrollo**, degradado tras varios `rm -rf .next/dev/types` con compilaciones en vuelo: el shard
tardó 6.2 min en vez de 3.4 y devolvía 404 en rutas compiladas a medias. Con `rm -rf .next` y una
corrida limpia, 25/25.

**Lección operativa**: no tocar `.next` con el servidor de Playwright vivo. Si hay que limpiarlo, se
limpia entero y entre corridas.

### Archivos tocados

**Design system**
- `presentation/design_system/forms/FieldGroup.tsx` (nuevo)

**Ruta `/cuenta`**
- `ui/StoreProfileForm.tsx` (tres tramos, vista previa del logo, avisos del sistema, textos de
  subida traducidos) + `ui/StoreProfileForm.test.tsx` (nuevo)

**Catálogos**
- `common.alertSaved`; `account.storeGroup{Identity,Contact,Image}` y sus tres pistas;
  `account.storeLogo{Current,None,Uploading,Uploaded}`

**Pruebas**
- `e2e/sellerStore/cuentaConfigurable.feature`: los escenarios `@slice-3` dejan de ser esqueleto
- `e2e/compartir/cuentaLayout.spec.ts`: el escenario de la paginación siembra su publicación

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2692/2692** en 248 archivos |
| `pnpm run typecheck` y `typecheck:tests` | limpios |
| `pnpm run lint` | limpio |
| `playwright src/e2e/sellerStore/storeProfile.spec.ts` | **4/4** |
| `playwright src/e2e/{sellerStore,compartir}` **en 3 shards** | **73/73** (25 + 24 + 24) |

**Escrito en la base compartida**: tiendas, direcciones personales, sucursales y una publicación con
prefijo `e2e-`, todas borradas por los `afterEach` y por el barrido de `globalTeardown`. La auditoría
de arriba confirma que no queda nada. Nada que deshacer a mano.

### Recap

La ficha ya no es un muro: tres tramos con nombre —Identidad, Contacto, Imagen—, cada uno anunciado
como grupo para quien navega con lector de pantalla, y el logo actual a la vista con la inicial de
reserva cuando no hay ninguno. Guardar y fallar usan el mismo aviso que el resto del sitio, con su
`role` correcto y su etiqueta escrita, así que por fin se anuncia algo al guardar. Los textos de la
subida dejaron de estar en duro en español. Y por el camino se arregló la prueba intermitente que
llevaba tres diagnósticos, y se auditó la base tras un susto que resultó ser el servidor de
desarrollo y no los datos.

Con esto el roadmap de `005-2026-09-04-cuenta-configurable` va por tres slices de cuatro.

### Próximos pasos (opciones)

1. **Slice 4 — Abrir tienda deja de ser una bifurcación.** Es el único que queda del roadmap: quitar
   el «Cancelar» que expulsa a `/` en medio del alta y dejar abrir la tienda como paso único, con la
   dirección personal como secundaria.
2. **Verificar que el punto de una sucursal es el correcto.** El problema real que el aviso retirado
   del slice 2 no atacaba: `coordinates.ts` tiene dos patrones porque la gente copia el centro del
   mapa en vez del pin, así que una sucursal puede quedar situada en el sitio equivocado sin que
   nadie lo note. Alcance nuevo.
3. **Traducir los textos de reserva de `ImageVideoUploader`.** Este slice le pasó los suyos desde la
   ficha, pero el componente sigue teniendo `⏳ Subiendo...` en duro para quien no los pase. Quedan
   dos llamadores por revisar.
4. **Que el alta de sucursal siga abierta tras guardar.** Hoy se pliega al revalidar, lo cual es un
   buen «listo» pero obliga a reabrirla si vas a dar de alta tres seguidas. Depende de si eso pasa.

**Pendiente de tu lado**: elegir. La rama es `feat/ficha-sin-muro`, sin empujar.
