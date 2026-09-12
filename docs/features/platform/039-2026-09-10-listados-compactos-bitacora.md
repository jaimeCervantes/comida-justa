# Bitácora — Listados compactos

## Slice 1 — Las facetas, arriba (2026-09-10)

### Objetivo

Sacar los filtros de la búsqueda de la barra lateral y ponerlos en una fila encima de los
resultados, para que dejen de costar 264 px de ancho en escritorio y unos 360 px de alto en el
teléfono.

### Decisiones y por qué

**1. No se escribió una fila de chips: se reusó la que ya existía.** El plan decía «reusando el
patrón de `NearbyBar`», y al buscarlo apareció algo mejor que un patrón: `PublicationPillarFilter`
ya **es** este control —«Todo» más los cuatro pilares, con su `BadgeCounter`, su color por par, su
`shrink-0` para filas deslizables y su `min-h-10`—, y ya lo montan el home, la barra de cercanía,
categoría, tienda y perfil. Escribir aquí una segunda fila habría sido copiar cinco colores y un
estado activo para que divergieran a la primera vez que alguien tocara uno de los dos.

Lo que la búsqueda añade viaja como prop: `counts` (las cuentas por pilar, que es lo que convierte
un filtro en una faceta) y `testIdPrefix` (para que los chips sigan publicando `facet-pillar-<key>`,
que es el nombre que conocen sus pruebas). Mudar un control no es motivo para romper a quien lo
apuntaba.

**2. Se perdió el «quitar el filtro pulsando el pilar activo», a propósito.** El `SearchFacets`
viejo hacía `hrefWith(query, isActive ? null : key, …)`: pulsar el pilar puesto lo quitaba. El
control compartido no hace eso —el camino de vuelta es «Todo»—, y conservarlo habría pedido una
tercera prop cuyo único trabajo sería que dos listados del mismo sitio se comportaran distinto. En
la barra lateral tenía sentido, porque «Todo» quedaba arriba en una lista de cinco renglones; en la
fila, «Todo» es el primer chip y está siempre a la vista. **Es un cambio de comportamiento y por eso
está escrito aquí**, no escondido en el diff.

**3. `FILTER_CHIP` se exporta.** «Solo con existencia» va en la misma fila que los cinco pilares, y
lo que no puede decidirse dos veces es el alto, el radio y el relleno — es justo lo que se nota
cuando difiere. El color y el estado sí los decide cada uno.

**4. Los rótulos «Pilar» y «Disponibilidad» dejaron de ser `Heading` y son versalitas en la fila.**
Como encabezados costaban dos renglones verticales, que es lo que este slice vino a quitar. Se
esconden por debajo de `sm`, donde el ancho es el caro y los propios chips ya se explican.

**5. Dos arreglos de herramienta que no eran del slice pero lo bloqueaban.** Ver «Desviaciones».

### Archivos tocados

**La mudanza**

- `src/app/[locale]/buscar/ui/SearchFacets.tsx` — reescrito: una fila deslizable que compone
  `PublicationPillarFilter` más el interruptor de existencias.
- `src/app/[locale]/buscar/page.tsx` — fuera la rejilla `lg:grid-cols-[240px_1fr]`; los resultados
  estrenan `data-testid="search-results"` para poder localizarlos sin depender de su forma.
- `src/presentation/post/PublicationPillarFilter.tsx` — props `counts` y `testIdPrefix`, ambas
  opcionales y sin efecto en los cinco montajes que ya existían; `BASE_LINK` pasa a exportarse como
  `FILTER_CHIP`.

**Las pruebas**

- `src/e2e/listadosCompactos/listadosCompactos.feature` — nuevo. Slice 1 detallado, slices 2 y 3
  como esqueletos `@future`.
- `src/e2e/listadosCompactos/listadosCompactos.spec.ts` — nuevo, dos escenarios.

**La herramienta**

- `playwright.config.ts` — `webServer.timeout` de 180 s a 300 s.
- `src/e2e/testUtils/warmRoutes.ts` — entra `/api/search?q=pan`.

### Comandos

```sh
pnpm run typecheck && pnpm run lint && pnpm run test:run
pnpm exec playwright test src/e2e/listadosCompactos src/e2e/busquedaFacetada \
  src/e2e/busquedaRelevante src/e2e/publicationPillarFilter --shard=1/3 --reporter=line
# … y 2/3 y 3/3, uno detrás de otro, con `rm -rf .next` antes de cada uno
```

### Validación

| Qué                                                | Resultado                                                   |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm run typecheck`                               | limpio                                                       |
| `pnpm run lint`                                    | limpio, 1205 archivos                                        |
| `pnpm run test:run`                                | **2901 pruebas en 277 archivos, todas en verde** (258 s)     |
| `listadosCompactos.spec.ts` **antes** del cambio   | **2 en rojo** (con las fuentes en `git stash`)               |
| `listadosCompactos.spec.ts` después                | **2 en verde**                                               |
| Playwright acotado, 28 escenarios en 3 tramos      | tramo 1: 10/10 · tramo 2: 9/9 · tramo 3: 8/9                 |

**El contrato de regresión se cumplió:** los 8 escenarios de `busquedaFacetada.spec.ts` pasaron
**sin editar una línea**. Localizan por `data-testid` y por `aria-pressed`, no por posición, así que
la mudanza les resultó invisible — que es exactamente lo que un spec bien escrito tiene que hacer
cuando el diseño se mueve.

**El 8/9 del tramo 3 fue intermitencia en frío, no una regresión, y está demostrado**: falló un
escenario **distinto** en cada una de las dos corridas —`:95` la primera, `:50` la segunda—, las dos
veces en su primera interacción, y los **3 pasan en aislamiento**. Es la firma que `AGENTS.md`
describe palabra por palabra.

### Desviaciones del plan

1. **La reutilización llegó más lejos de lo planeado** (decisión 1). El plan hablaba de copiar un
   patrón de maquetación; acabó siendo el mismo componente. Es mejor de lo escrito, no distinto.
2. **`webServer.timeout`: 180 s → 300 s.** La suite moría en «Timed out waiting from
   config.webServer» antes de correr un solo escenario. El servidor levanta en 2.6 s; lo que tarda
   es la primera petición: la sonda pide `/`, la ruta más cara del sitio, y con `.next` borrado
   —obligatorio antes de cada corrida— compilar desde cero se midió en **101 s** con la caché a
   medias. Desde frío se pasaba de los tres minutos. El mensaje no dice nada de la aplicación y
   manda a buscar el fallo donde no está.
3. **`/api/search` entra en `warmRoutes.ts`.** Es la tercera de la familia de `/api/auth/providers`
   y `/api/posts/page/N`: `/buscar` no la calienta, porque esa consulta la hace el servidor llamando
   al caso de uso directamente; sólo la pide `SearchBar` desde el navegador, así que nadie la
   compilaba en toda la corrida y el primer escenario que tecleaba en el buscador pagaba esa
   compilación dentro del plazo de 5 s de un `toBeVisible`. Tumbó a
   `publicationPillarFilter.spec.ts:95`; con la ruta caliente, pasa.
4. **`aria-current` de las facetas pasó de `"true"` a `"page"`**, que es el valor del control
   compartido y el correcto para un enlace que representa la vista actual. Ninguna prueba lo
   afirmaba.

### Pendientes que deja

- El «quitar filtro pulsando el pilar activo» (decisión 2), si se quiere de vuelta, conviene
  resolverlo **en el control compartido y para los cinco listados**, no con una excepción para la
  búsqueda.
- `FILTER_CHIP` vive en `src/presentation/post/`. Su casa natural es `design_system/`, pero moverlo
  arrastra los cinco montajes: es una mudanza propia, no un renglón de este slice.

### Recap

La búsqueda ya no tiene barra lateral: los cinco pilares con sus cuentas y el interruptor de
existencias viven en una fila deslizable encima de los resultados, y esa fila la pinta el mismo
`PublicationPillarFilter` que ya usaban el home, la barra de cercanía, categoría, tienda y perfil —
un control menos que mantener, no uno más. Los resultados recuperaron los 264 px que se llevaba el
`aside` y quedan con los mismos 1216 px que el resto del sitio, que es la condición que los slices 2
y 3 necesitaban para que las cuatro columnas salgan iguales en todos los listados. Todo verde:
2901 pruebas unitarias, 28 escenarios acotados, y los 8 de las facetas pasando sin una sola edición.

### Próximos pasos (opciones)

1. **Slice 2 — la tarjeta habla por iconos.** Carrito, apoyar y compartir sin texto; compartir sobre
   la imagen; editar, marcar agotado y guardar existencias a un menú «⋯»; y el mismo criterio en la
   ficha de la publicación, que es el alcance acordado. Es el que más cambia lo que se ve.
2. **Saltar al slice 3 (las columnas) antes que al 2.** Se puede, pero con la tarjeta actual una
   columna de 156 px en el teléfono deja 116 px útiles y la firma no cabe: se vería roto hasta que
   llegue el slice 2. No lo recomiendo.
3. **Mirarlo primero en el navegador.** El slice está verde pero nadie lo ha visto con ojos: la fila
   con 5 chips, sus cuentas y el interruptor, en 1280 y en 390.

**Pendiente de tu parte:** decidir entre 1 y 3, y si el «quitar filtro pulsando el pilar activo»
vuelve o se queda como está.

## Slice 2 — La tarjeta habla por iconos (2026-09-12)

### Objetivo

Que las acciones de una tarjeta quepan en un renglón: carrito, apoyar y compartir sin texto,
compartir encima de la foto, y los controles de quien administra sin llevarse la mitad del alto.
Alcance acordado: la tarjeta del listado **y** la ficha de la publicación.

### Decisiones y por qué

**1. `iconOnly` es una variante del botón, no una clase suelta en cada sitio.** Vive en
`buttonVariants` con `compoundVariants` que fijan el lado por tamaño: sin eso, quitar el relleno
horizontal dejaba un botón tan ancho como su icono —16px— y el objetivo táctil se perdía aunque el
alto se conservara. La variante **exige `aria-label`** a quien la use; el nombre no se pone en el
sistema de diseño porque ahí no se puede leer el catálogo (misma regla que `loadingLabel`).

**2. Compartir sobre la foto obligó a desmontar el enlace.** El pilar y el contador de archivos ya
vivían ahí, pero eran `<span>` **dentro** del `<Link>` que envuelve la imagen. Un `<button>` ahí
adentro es HTML inválido y el navegador se come la pulsación, así que el bloque de media pasó a ser
un contenedor `relative` con el enlace cubriendo sólo la foto y los adornos como hermanos suyos.

**3. Los controles de dueño acabaron en la fila, no en un menú — y ese fue un cambio de rumbo.**
Se construyeron primero detrás de un «⋯» con el argumento de que «marcar agotado» no tiene un icono
que se entienda sin leerlo. El usuario pidió, dos veces y señalando el archivo, que estuvieran en la
misma fila que apoyar. Están: editar y agotar son dos iconos más del renglón, con `title` y nombre
accesible completo para que el dibujo no tenga que explicarse solo. **El campo de existencias es la
única excepción** y por eso queda un «⋯»: es un campo de texto con su botón de guardar, no un icono,
y en una columna estrecha partiría la fila en tres.

**4. El contador de apoyos se encoge, y esto lo encontró la e2e.** «Nadie ha apoyado» mide unos
110px y en una tarjeta de 292 empujaba editar y agotar a un segundo renglón: el spec lo midió como
40px de diferencia de altura entre el carrito y los botones del dueño. Ahora se pinta el número y la
frase entera se dice en `sr-only`.

**5. Sólo tres botones del alcance no tenían icono** —marcar agotado en la ficha y en la tarjeta, y
guardar existencias—, lo cual se comprobó con un barrido sobre las aperturas de `<Button>` en vez de
a ojo. Los CTA propios de práctica y servicio estrenan icono conservando su texto: son acciones raras
y la palabra ahí todavía informa.

### Archivos tocados

**El primitivo**

- `src/presentation/design_system/buttons/buttonVariants.ts`, `.../Button.tsx` — variante `iconOnly`.

**Las acciones**

- `src/presentation/cart/AddToCartButton/AddToCartButton.tsx`,
  `src/presentation/post/PostReaction/PostReactionButton.tsx` — prop `iconOnly`; el contador, compacto.
- `src/presentation/sharing/ShareMenu/ShareMenu.tsx` — variante `onMedia`, con el mismo fondo oscuro
  que el contador de archivos porque debajo hay una foto que sube cualquiera.
- `src/presentation/post/CardForList/CardForList.tsx` — la media desmontada, la fila de acciones.
- `src/presentation/post/CardOwnerControls.tsx` — editar y agotar en la fila; existencias en el «⋯».
- `src/app/[locale]/[slug]/ui/OwnerControls.tsx`, `src/presentation/post/StockControl/StockControl.tsx`
  — los iconos que faltaban.
- `src/i18n/messages/{es,en}.json` — `post.ownerMenu`.

**Las pruebas**

- `src/e2e/testUtils/openWhenHydrated.ts` — nuevo (ver desviaciones).
- `src/e2e/listadosCompactos/tarjetaCompacta.spec.ts` — nuevo.
- `src/presentation/post/StockControl/StockControl.test.tsx` — nuevo; ese componente no tenía ninguna.
- Actualizados: `CardForList.test.tsx`, `PostsWithLoadMore.test.tsx`, `OwnerControls.test.tsx`,
  `localProducers/cardControls.spec.ts`, `inventory/existenciasEnLaTarjeta.spec.ts`.

### Validación

| Qué | Resultado |
| --- | --- |
| `pnpm run typecheck` / `lint` | limpios, 1209 archivos |
| `pnpm run test:run` | **278 archivos, todas verdes** |
| Playwright acotado (19 escenarios) | **19/19** en 5.0 min |

### Desviaciones del plan

1. **El menú «⋯» se construyó y luego se deshizo** (decisión 3). El roadmap lo daba por bueno; el
   usuario pidió la fila. Lo que sobrevive del menú es el campo de existencias.
2. **`Button` no reenvía su `ref`, y Radix la necesita.** `asChild` clona al hijo y le pasa su propia
   ref para anclar el panel; con el componente, el menú no llegaba a abrirse **en el navegador** y sí
   en jsdom, que no ancla nada. El disparador pasó a ser un `<button>` pelado vestido con
   `buttonVariants`, que es justo para lo que esas clases viven fuera del componente.
3. **`openWhenHydrated`, y por qué hizo falta.** El disparador llega del servidor como HTML normal,
   así que Playwright lo ve visible y estable y lo pulsa **antes de que React enganche el
   manejador**: la pulsación no abre nada y no falla nada, y lo que revienta es la línea siguiente.
   Se midió con un spec de diagnóstico: primera pulsación sin efecto, segunda abre. Dos trampas más
   salieron de ahí: la cabecera es `sticky top-0 z-50` y se come la pulsación cuando Playwright
   desplaza el control justo debajo de ella; y `toPass` **reintenta pero no interrumpe**, así que una
   aserción interna con el plazo por omisión gastaba 5s por vuelta y una llamada colgada se llevaba
   el escenario entero.
4. **Un `aria-label` sobre un `<span>` genérico no lo lee nadie**, y el lint lo cazó. La frase del
   contador se dice con `sr-only`, que además sigue contando como contenido para las pruebas.
5. **`cardControls.spec.ts` se editó dos veces**, y las dos por cambios reales de conducta: primero
   para abrir el menú, después para volver a la pulsación directa. No es fragilidad del spec.

### Recap

La tarjeta dice con dibujos lo que antes escribía: carrito, apoyar, editar y agotar son cuatro
iconos de un mismo renglón, compartir se fue a la esquina de la foto y el campo de existencias es lo
único que queda tras un menú. Cada acción conserva su nombre accesible completo, que es la condición
que hacía la operación honesta. La ficha recibió el mismo criterio sin perder sus palabras.

### Próximos pasos (opciones)

1. **Mirar la fila de quien es dueño con sesión iniciada.** Está medida por spec pero no vista: en un
   teléfono de pie son ~200px de columna para cinco controles de 32.
2. **Barrer los iconos por el resto del sitio** (publicar, cuenta, agenda, carrito, pedidos), que fue
   la opción que quedó fuera del alcance acordado.

**Pendiente de tu parte:** decidir si la fila del dueño se revisa a ojo antes de seguir.

## Slice 3 — Las columnas se adaptan al ancho (2026-09-12)

### Objetivo

Que un listado reparta en las columnas que le quepan —nunca más de cuatro—, y que la tarjeta se
acomode a la suya: una sola columna en el teléfono de pie, con la foto a la izquierda.

### Decisiones y por qué

**1. Ni un punto de corte por dispositivo.** `column-width: 220px` pone las columnas que entren y
`column-count: 4` es el tope; cuando los dos están puestos, la multi-columna usa el menor de ambos.
Girar el teléfono no necesita regla propia porque girar es ensanchar el contenedor: de pie da una
columna, girado da tres, y una pantalla de 2400px sigue dando cuatro.

**2. El tope existe porque sin él salían siete.** A 2400px de ventana, columnas de 220 caben siete
veces, y a ese tamaño la tarjeta deja de ser una tarjeta.

**3. Sin suelo, y es una decisión del usuario.** Se construyó primero con suelo de dos columnas y su
frontera calculada (488px, donde dos de 220 dejan de caber) para que la escalera no retrocediera.
El usuario pidió volver a una columna en el teléfono. Con eso desaparece la frontera, la media query
y la mitad del razonamiento: la regla adaptativa sola hace el trabajo.

**4. La tarjeta horizontal se dispara por el ancho de la tarjeta, no por el del teléfono.** A una
columna mide ~358px; en cuanto hay dos o más nunca pasa de ~318. 320px separa esas dos situaciones, y
la pregunta la contesta `@container`, así que la misma regla acierta en un teléfono de pie, en el
mismo teléfono girado y en la columna de «Publicaciones relacionadas».

**5. `SEARCH_PAGE_SIZE` sube de 6 a 12, y no por enseñar más.** La multi-columna **equilibra**: con
seis tarjetas que no se pueden partir le salían dos por columna, le bastaban tres y la cuarta quedaba
vacía — un hueco muerto a la derecha que se lee como que algo falló. Doce es divisible entre 2, 3 y 4.

**6. En la miniatura no caben dos insignias.** El contador de archivos se calla en la tarjeta
horizontal y el pilar deja sólo su número, conservando el nombre en `sr-only`: el número es el dato
que `pillarPalette.contrast.test.ts` dejó como imprescindible, porque Movimiento y Mente contrastan
1.14 entre sí como tinta.

### Archivos tocados

- `src/app/styles/globals.css` — utilidades `card-columns` y `card-media`.
- `src/presentation/design_system/surfaces/cardList.ts` — `CARD_MASONRY` apunta a la utilidad.
- `src/presentation/design_system/surfaces/MasonryColumns.tsx` — `columnsFor` con el mismo cálculo.
- `src/presentation/post/Card/Card.tsx` — la fila horizontal y la miniatura.
- `src/presentation/post/PillarBadge/PillarBadge.tsx`, `.../CardForList.tsx` — las insignias.
- `src/app/[locale]/buscar/data.ts` — el tamaño de página.
- `src/e2e/listadosCompactos/columnasDelListado.spec.ts` — nuevo; cuenta posiciones reales.
- `MasonryColumns.test.tsx` — la corrida de escritorio y las invariantes.

### Validación

| Qué | Resultado |
| --- | --- |
| `pnpm run typecheck` / `lint` | limpios |
| `pnpm run test:run` | **278 archivos, todas verdes** |
| Playwright acotado | **19/19**, con cinco ventanas midiendo columnas de verdad |
| A ojo, en el navegador | 390 vertical (1, horizontal), 844 girado (3), 1280 (4) |

La escalera se afirma de dos maneras que se complementan: una corrida de escritorio sobre
`columnsFor` con diez anchos, y un recorrido de 200 a 2400 px de cuatro en cuatro que comprueba que
**ensanchar nunca quita columnas** — la propiedad que un navegador no puede afirmar sin abrir
seiscientas ventanas.

### Desviaciones del plan

1. **El suelo de dos columnas se construyó y se quitó** (decisión 3), con su frontera y su test.
2. **Una consulta de contenedor no se aplica al elemento que declara el contenedor.** `@min-[320px]:flex`
   puesto sobre la superficie de la tarjeta no se activaba nunca: se resuelve contra el **antepasado**
   que declara `container-type`. La fila bajó un nivel, a un envoltorio de dentro.
3. **El plan decía que no se tocaría `SEARCH_PAGE_SIZE`.** Se tocó, con el motivo medido de la
   decisión 5.
4. **El test que ataba las constantes a la clase de Tailwind cambió de forma**: ahora abre
   `globals.css` y comprueba los números, y además vigila que nadie meta una media query que decida
   columnas — que es lo que haría que el listado dejara de leer el ancho y empezara a adivinarlo.

### Recap

Un listado reparte en las columnas que le quepan y nunca en más de cuatro, sin una sola regla por
dispositivo: el mismo teléfono da una columna de pie y tres girado porque lo que se mira es el ancho.
La tarjeta se acomoda a la suya —horizontal con miniatura cuadrada cuando va sola en el renglón,
apilada cuando es angosta— y lo decide por su propio tamaño, así que sirve igual en el feed, en la
búsqueda, en una tienda y en la columna de relacionadas.

### Próximos pasos (opciones)

1. **Mirar el home y el perfil**, que heredan todo esto sin haberse revisado a ojo: sólo se miró la
   búsqueda.
2. **`FILTER_CHIP` sigue viviendo en `src/presentation/post/`**; su casa natural es `design_system/`,
   pero moverlo arrastra los cinco montajes que lo usan. Es una mudanza propia.
3. **Los 3 escenarios de `inventory` del tramo 2** que quedaron sin diagnosticar cuando se cortó la
   corrida: fallaban con `page.goto` expirando, en la ficha y no en la tarjeta. No se ha demostrado
   que sean preexistentes.

**Pendiente de tu parte:** decidir si la fila del dueño y el resto de listados se revisan a ojo.
