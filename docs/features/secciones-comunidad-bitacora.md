# Bitácora — Secciones de comunidad

Registro append-only. Narra el **por qué**; el qué está en `git log`.

---

## Slice 0 — Que el menú deje de mentir (2026-08-02)

### Objetivo

Las seis entradas de «Comunidad» llevaban a rutas que llaman a `notFound()`. Como viven en el
header, eran **seis 404 enlazados desde todas las páginas del sitio**: quien llega se topa con una
puerta cerrada, y quien rastrea gasta ahí su presupuesto y desconfía del resto. Ocultarlas es media
hora y recupera el enlazado interno entero.

### Decisiones y por qué

**Se ocultan, no se borran.** Es lo que pediste y además es lo correcto: la lista *es* el plan.
`docs/features/secciones-comunidad.md` dice qué es cada sección, cuál se resuelve con lo que ya
existe y en qué orden se entregan; borrar el arreglo dejaría el documento hablando de algo que ya
no está en el código.

**El interruptor vive en el dato, no en el consumidor.** Cada entrada tiene `published`, y los dos
menús —escritorio y móvil— leen `VISIBLE_COMMUNITY_ITEMS`. La alternativa (comentar el bloque en
`Nav` y otra vez en `MobileNav`) habría dejado dos sitios que olvidar cuando una sección se
publique.

**El rótulo «Secciones» se va con ellas.** Un encabezado seguido de nada se lee como un error de
la página, no como una sección vacía. El menú «Comunidad» no queda huérfano: sigue teniendo
publicaciones, productos y las categorías del catálogo.

**La prueba afirma la regla, no el estado.** No comprueba que la lista visible esté vacía —eso
caducaría el día que se publique la primera— sino que **ninguna entrada visible apunta a una ruta
que sigue siendo un stub**. Y comprueba que las seis siguen en el arreglo, porque perderlas es
perder el plan.

**Los escenarios que afirman que esas rutas responden 404 se quedan como están.** Son el
recordatorio deliberado que dejó el slice 1 de SEO: el día que una deje de ser un stub, esa prueba
falla y avisa de que hay que meterla al sitemap y poner su `published` en `true`.

### Archivos tocados

- **UI:** `Header/menuItems.ts` (+ prueba), `Header/Nav.tsx`, `Header/MobileNav.tsx`.
- **Docs:** `docs/features/secciones-comunidad.md` (el plan completo de las seis).

### Validación

Entró en la misma corrida que el slice 5 de SEO: `typecheck`, `lint` y `check:i18n` limpios,
**558 pruebas unitarias** verdes (+2 de este slice) y la suite e2e completa en verde.

### Pendientes que deja

- Los cinco slices siguientes están en `docs/features/secciones-comunidad.md`. El próximo sin
  bloqueo es el de **productores y negocios locales**, que no necesita migración: `origin.ts` ya
  distingue `productor_local` de `reventa_local`.
- **Bloqueado a propósito:** salud infantil, medio ambiente y deportes esperan las referencias
  científicas, que las aporta el usuario.

### Recap

El header ya no enlaza ninguna página inexistente. Las seis secciones siguen escritas en el código
con su texto, su destino y su descripción, apagadas con un `published: false` que se enciende
cuando cada una tenga contenido.

### Próximos pasos (opciones)

1. **Productores y negocios locales** (slice 1 del documento), cuando el slice 5 de SEO ya fijó la
   regla de qué entra al sitemap: los directorios la heredan.
2. **Pasar las referencias** para desbloquear salud infantil y medio ambiente.
3. Dejarlo así: el menú ya no miente, y el resto puede esperar a que haya vendedores que listar.

---

## Slice 1 — Productores y negocios locales (2026-08-02)

### Objetivo

Dos de las seis puertas cerradas del menú se abren con lo que ya existe. Y de paso el sitio gana las
primeras páginas que hablan de **quién** vende, no de qué se vende: hasta hoy una tienda solo se
encontraba si alguien repartía su enlace.

### La decisión que cambió el plan

El documento decía —y yo lo escribí— que **negocios locales** salía de `origin = reventa_local`. Al
implementarlo, tú preguntaste si no convenía agregar un `venta_local`, y la pregunta destapó que el
error era anterior: **`origin` describe la publicación, no al vendedor.**

- Un restaurante del pueblo **cocina** lo que vende: publicaría `productor_local` y quedaría fuera
  del directorio de negocios.
- Una tienda de abarrotes que revende producto de fuera publica `reventa_foranea` y también quedaría
  fuera, siendo el negocio más del pueblo que hay.

Tampoco hacía falta el valor nuevo: el eje `rol` responde "¿quién lo produjo?", y un `venta_local`
genérico no responde nada distinto de `reventa_local` — dos valores que nadie sabe cuándo elegir son
peores que uno. Además **ninguna publicación usa todavía los orígenes locales**, así que ampliar el
vocabulario habría sido adivinar sin datos.

La definición que quedó:

- **Negocios locales = todas las tiendas** (`sellers` con `slug`). Quien abrió tienda aquí.
- **Productores locales = las que además publican algo con `productor_local`**, o sea las que
  **hacen** lo que venden. Un `EXISTS` sobre el mismo listado.

Se solapan a propósito: un productor también es un negocio del pueblo.

### Decisiones y por qué

**Quién produce lo dice lo que publica, no una casilla.** El filtro es un `EXISTS` sobre `posts`, así
que una tienda entra al directorio de productores el día que publica su primer producto propio, sin
que nadie tenga que marcarla. Es la misma idea que hace que una categoría entre al sitemap sola.

**Cada sección lleva su texto arriba y el directorio debajo.** Hoy productores está **vacía** y
negocios tiene **una** tienda: una página que fuera solo lista sería una página hueca. Con el texto
vale desde el primer día, y el estado vacío no dice "no hay nada" sino "esta sección es tuya", con
el enlace para abrir tienda.

**Vacía pide `noindex` y no entra al sitemap.** La misma regla del slice 5 de SEO para las
categorías, heredada tal cual en vez de inventar otra. Las dos vuelven al índice solas.

**La prueba que avisaba, avisó dos veces.** El slice 1 de SEO dejó un escenario afirmando que estas
rutas respondían 404, precisamente para que fallara el día que dejaran de ser stubs. Falló, y por eso
este slice se acordó de sacarlas de esa lista y meterlas al sitemap. Las otras cuatro siguen ahí.

Y volvió a avisar: el primer intento de editar esa lista **no coincidió con el texto del archivo**
—el orden de las rutas era otro— y el reemplazo pasó en silencio. Lo cazó la suite completa, con el
sitemap sirviendo `/negocios-locales` mientras la prueba afirmaba que no debía estar. Un reemplazo
por texto que no encuentra su patrón no falla: no hace nada.

**Sin paginación todavía.** Con una tienda, paginar es una promesa vacía; el repositorio ya recibe
página y tamaño, así que añadirla es un rato cuando haya con qué llenarla.

**El directorio lista tiendas, no perfiles.** Quien produce sin abrir tienda no aparece — y el
enlace de "abre tu tienda" es exactamente la invitación a que lo haga.

### Lo que costó y no debería costar dos veces

Al limpiar un archivo que **creí** haber creado, borré `src/domain/entities/post/origin.test.ts`,
que existía desde antes con 8 pruebas. Lo delató el total de la suite: 587 → 579 sin que ninguna
prueba fallara. Está restaurado, con una prueba más para el filtro nuevo. **Un `rm` de un archivo de
pruebas no falla nada: solo baja el número.** Si el total baja sin que nadie lo explique, hay que
mirar `git status` antes de seguir.

### Archivos tocados

- **Dominio:** `entities/seller/directory.ts` (qué es cada directorio), `isLocalProducerOrigin` en `entities/post/origin.ts` (+ prueba), `sections` en `seo/sitemap.ts` (+ prueba).
- **Infra:** `dataAccess/sellers/PostgresStoreDirectory.ts`; la consulta de secciones vivas en `PostgresSitemapRepository`.
- **Presentación:** `presentation/directory/StoreSummaryCard.tsx`.
- **App:** `[locale]/directorio/` (plantilla, datos y metadata compartidos) y las dos rutas, que dejan de ser stubs.
- **UI:** `published: true` para las dos entradas del menú.
- **i18n:** el espacio `directory` completo, en los dos idiomas.
- **e2e:** `src/e2e/seo/directories.spec.ts`; escenarios `@directorios` en `seo.feature`; `seo.spec.ts` deja de afirmar que estas dos rutas son 404.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **589 pruebas en 68 archivos**, todas verdes |
| `pnpm run test:e2e:run` | **94 escenarios verdes, 3 saltados**, 0 fallos (+5) |

El tercer escenario siembra una publicación de origen `productor_local` en la tienda real
`hazlo-sano` y la borra en `afterEach`: es la única forma de comprobar que una tienda entra al
directorio de productores cuando publica algo suyo, y el barrido de la suite la cubre igual.

### Pendientes que deja

- Paginación de las dos secciones cuando haya tiendas que lo pidan.
- Un productor sin tienda no aparece en ninguna de las dos.
- Quedan **cuatro** secciones stub: `habitos/grupos`, `salud-infantil`, `medio-ambiente` y
  `deportes`. Las tres de contenido siguen bloqueadas esperando las referencias científicas.

### Recap

Las secciones de productores y negocios locales existen y salen de la base: negocios lista la única
tienda con dirección pública, y productores explica de qué va mientras nadie publique algo que
elabore. Las dos entraron al menú, respetan la regla de sitemap del slice 5 —la vacía pide
`noindex`— y comparten plantilla, datos y metadata, así que la tercera sección de este tipo es un
archivo de veinte líneas.

### Próximos pasos (opciones)

1. **Las referencias científicas** para desbloquear salud infantil y medio ambiente.
2. **Paginar los directorios**, cuando haya tiendas suficientes para que importe.
3. **Que un productor sin tienda aparezca**, si resulta que la gente publica antes de abrir tienda.

---

## Arreglo — el menú móvil recortaba las secciones nuevas (2026-08-02)

### Qué pasaba

Lo reportaste tú: en el teléfono no aparecían «Productores locales» ni «Negocios locales». En
escritorio sí.

La causa no era el `published`, que estaba bien. Era una **altura fija**: el desplegable del menú
móvil abría con `max-h-[500px]` y `overflow-hidden`. Con las dos secciones nuevas, «Comunidad» pasó
a **14 enlaces** —publicaciones, productos, las 10 categorías y las 2 secciones— y las dos últimas
quedaron fuera del recorte. Existían en el DOM, se podían enlazar, y ningún dedo podía llegar a
ellas.

De paso apareció el segundo tope: el contenedor del menú es `overflow-hidden` y su `<nav>` no
declaraba desplazamiento, así que con los dos acordeones abiertos tampoco se podía llegar al final
del menú.

### Decisiones y por qué

**La animación pasa a `grid-template-rows` (`0fr → 1fr`).** Es lo que evita que esto vuelva: con
`max-height` la altura la decide un número que alguien escribió una vez, y el día que la lista crece
el recorte no avisa —no hay error, no hay prueba en rojo, solo enlaces que nadie ve—. Con `grid` la
altura la pone el contenido y la transición se conserva.

**El menú se puede desplazar.** `overflow-y-auto` en el `<nav>`, más `overscroll-contain` para que
al llegar al final no arrastre la página de detrás.

**La prueba tuvo que aprender a distinguir "se ve" de "se puede tocar".** Los dos primeros intentos
pasaron con el fallo delante:

- `toBeVisible()` no sirve: un elemento recortado por `overflow-hidden` **conserva su caja**, así
  que cuenta como visible.
- `click()` tampoco: Playwright desplaza por API contenedores que un dedo no puede desplazar, así
  que el clic llegaba igual.

Lo que sí distingue es **desplazar con la rueda** —que solo mueve lo que de verdad se puede
desplazar— y luego preguntarle al navegador qué hay en ese punto de la pantalla
(`document.elementFromPoint`). Con eso, la prueba falla sin el arreglo y pasa con él; se comprobó
guardando el arreglo aparte y corriéndola en rojo antes de darla por buena.

### Archivos tocados

- **UI:** `Header/MobileNav.tsx` — la animación del acordeón y el desplazamiento del menú.
- **e2e:** `src/e2e/menu/menu.feature` y `src/e2e/menu/mobileMenu.spec.ts`, con viewport de teléfono.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run test:e2e:run` | **96 escenarios verdes, 3 saltados**, 0 fallos (+2) |

### Pendientes que deja

- El menú de «Comunidad» ya lleva 14 entradas y las categorías van a seguir creciendo. Con esto
  cabe y se desplaza, pero llegará el momento de decidir si las categorías merecen su propio nivel
  en vez de vivir junto a las secciones.

### Recap

Las dos secciones nuevas ya se pueden tocar desde un teléfono, y el menú entero se recorre aunque no
quepa. El recorte por altura fija —que no avisaba de ninguna forma— se cambió por una animación cuya
altura la pone el contenido.

---

## Las categorías estrenan desplegable en el menú móvil (2026-08-02)

### Objetivo

Cerrar el pendiente que dejó el arreglo anterior. «Comunidad» juntaba cuatro cosas distintas —las
publicaciones, los productos, **las diez categorías** y las secciones—, y las categorías, que son la
lista que crece con el catálogo, empujaban al resto hacia abajo. Con su propio acordeón hay que
tocar para verlas y el menú se lee de un vistazo.

### Decisiones y por qué

**Solo en móvil.** En escritorio el desplegable es ancho y reparte las categorías en columnas: ahí
no estorban y separarlas obligaría a aprender dos menús distintos. En el teléfono hay una sola
columna y cada entrada se paga en desplazamiento.

**La etiqueta es «Por categoría» (`nav.byCategory`), no «Catálogo de categorías»** — esa segunda ya
nombra el enlace de administración, y dos entradas del mismo menú con el mismo texto es lo que
confunde a un admin. Además es la misma con la que el escritorio encabeza este bloque, así que las
dos pantallas lo llaman igual.

**La sección no aparece si no hay categorías.** Un desplegable vacío es peor que ninguno.

**El panel móvil estrena `data-testid`.** El menú de escritorio también está en el DOM —lo esconde
el CSS, no deja de existir—, así que sin acotar la búsqueda las pruebas afirmaban sobre el menú
equivocado. Se vio al escribir el escenario: la primera versión daba por buena una categoría que
estaba en el otro menú.

**Que algo esté plegado no se afirma con `toBeHidden`.** Un hijo recortado por `overflow-hidden`
conserva su caja y cuenta como visible. Se afirma con la misma medida que el arreglo anterior: que
**nadie pueda tocarlo** mientras está plegado, y que sí se pueda después de desplegar.

### Archivos tocados

- **UI:** `Header/MobileNav.tsx` — la sección nueva y el `data-testid` del panel.
- **e2e:** un escenario más en `src/e2e/menu/`.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:e2e:run` | **97 escenarios verdes, 3 saltados**, 0 fallos (+1) |

### Recap

En el teléfono, «Comunidad» vuelve a ser corta —publicaciones, productos y las dos secciones— y las
categorías esperan detrás de «Por categoría». En escritorio no cambia nada.

---

## El menú móvil se recorre por niveles (2026-08-02)

### Objetivo

Cuatro cosas que pediste, todas del mismo problema: en un teléfono, un menú que crece hacia abajo se
convierte en un desplazamiento interminable.

1. Que el desplazamiento cubra **todo** el contenido, no solo la lista de secciones.
2. Que los elementos de cada sección **entren desde la derecha** en vez de crecer hacia abajo.
3. Que «Por categoría» liste primero las raíces y de ahí se abran sus sub-categorías.
4. Que «Publicar» y la sesión vayan **en una fila de dos columnas**, más pequeños.

### Decisiones y por qué

**Los niveles se sustituyen, no se apilan.** El acordeón sumaba: abrir «Comunidad» y «Por
categoría» ponía veinte filas en la pantalla. Ahora cada nivel ocupa lo que ocupa, entra desde la
derecha con `enterFromRight` —la misma animación que ya usa el menú de escritorio— y se vuelve con
la flecha. Los otros niveles **no se pintan**: no es que estén recortados, es que no existen hasta
que se entra, y por eso ya no hay nada que recortar.

**`motion-safe`**, para quien pidió que no le muevan la pantalla.

**El menú es datos, no JSX.** `mobileMenuTree.ts` describe el árbol —enlaces y puertas— y es lo
único de este menú que se puede probar sin navegador. Con tres niveles, la forma dejó de ser algo
que se lee de un vistazo en el componente.

**Una raíz con hijas es una puerta; una raíz sin hijas es un enlace.** `alimentacion` tiene ocho
sub-categorías y `movimiento_y_ejercicio` ninguna: mandar a la segunda tras una puerta que da a una
lista vacía sería un toque para no llegar a nada. La regla se deriva del catálogo, no está escrita.

**El catálogo se lee de dos formas.** El escritorio lo sigue enseñando aplanado —su desplegable es
ancho y lo reparte en columnas— y el móvil por niveles. Es el mismo `categoryTree` del dominio,
hermano de `navigableCategories`, y ninguna de las dos pantallas impone su forma a la otra.

**Un solo desplazamiento para todo.** Antes solo se desplazaba la lista y los botones quedaban
clavados abajo; en una pantalla corta se comían el menú. Ahora el menú, los enlaces de
administración, los botones de la cuenta y el pie están dentro del mismo contenedor que se
desplaza. Lo único fijo es la cabecera con el logotipo y la X, que es la salida.

**Publicar y la sesión, en dos columnas y `size="sm"`.** Una debajo de la otra ocupaban el alto de
tres filas del menú. El bloque de la cuenta —avatar, nombre— se queda a ancho completo encima,
porque es identificación, no acción.

### Lo que volvió a costar

**Un reemplazo por texto que no encuentra su patrón no falla: no hace nada.** Pasó por segunda vez
en el día. El escenario de las categorías se quedó sin el paso de «Alimentación» porque el
formateador había reunido en una línea lo que yo buscaba en tres, y la prueba falló señalando a otro
sitio. Cuando el patrón viene de un archivo que acaba de pasar por el formateador, hay que releerlo
antes de reemplazar.

### Archivos tocados

- **Dominio:** `categoryTree` en `entities/post/taxonomy.ts` (+ pruebas).
- **UI:** `Header/mobileMenuTree.ts` (+ prueba) y `Header/MobileNav.tsx` reescrito; `Header.tsx` pasa el árbol y arma la fila de dos columnas.
- **i18n:** `nav.back`.
- **e2e:** el escenario de categorías baja ahora dos niveles.

### Validación

| Comando | Resultado |
|---|---|
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio |
| `pnpm run check:i18n` | limpio |
| `pnpm run test:run` | **600 pruebas**, todas verdes (+11) |
| `pnpm run test:e2e:run` | **97 escenarios verdes, 3 saltados**, 0 fallos |

### Pendientes que deja

- El menú de escritorio sigue enseñando las categorías aplanadas. Es lo correcto para su ancho, pero
  el día que haya tres raíces convendrá revisar si también quiere agruparlas.
- No hay gesto de deslizar para volver: se vuelve con la flecha. Si la gente lo intenta, es un rato.

### Recap

El menú móvil se recorre como una aplicación: cada nivel entra desde la derecha, ocupa lo suyo y se
vuelve con la flecha. «Por categoría» agrupa por raíz, así que llegar a «Panadería» son tres toques
en vez de un desplazamiento entre nueve. Y todo el contenido —menú, cuenta y pie— se desplaza junto,
con «Publicar» y la sesión en una sola fila.
