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

## Ajuste — La tarjeta de móvil, al estilo de un catálogo (2026-09-12)

### Objetivo

El renglón horizontal del teléfono no gustó al verlo: la foto parecía una estampilla con un hueco
blanco debajo, el título gritaba más que el precio y las acciones se partían en dos renglones. La
referencia pedida fue Mercado Libre en su lista de móvil.

### Qué se midió antes de tocar

En la tarjeta de un teléfono de pie la columna de texto son **191 px útiles** y la fila de acciones
pedía **210**: cinco botones de 32, el contador y cinco separaciones. Por eso el «⋯» caía abajo. Con
tres controles la fila pide unos 130 y entra con holgura.

### Decisiones y por qué

**1. La foto llena el alto del renglón.** Era un cuadrado, y como la columna de texto siempre es más
alta quedaba un hueco blanco debajo — que es exactamente lo que se leía como «la imagen se ve muy
pequeña». Estirada al alto de la tarjeta, la foto es la mitad izquierda entera. El recorte al centro
es el precio de que una vertical de 1200x1600 no estire el renglón.

**2. Los controles de dueño vuelven al «⋯», deshaciendo lo que se pidió dos mensajes antes.** Se
autorizó explícitamente («si es necesario poner menos acciones, adelante») y sin eso la fila no cabe
por mucho que se apriete: estrechar separaciones y relleno dejaba 207 contra 200, al filo, a costa de
juntar objetivos táctiles. Lo paga quien administra una publicación —una persona por tarjeta— con una
pulsación más; lo cobraba, en alto, todo el que sólo viene a mirar.

**3. La jerarquía se invierte: manda el precio.** El título baja a `text-body` con peso medio y se
corta a dos renglones; el precio sube a `text-heading-md`. Un título de tarjeta a peso semibold
compitiendo con la cifra hacía que ninguno de los dos mandara. Cortar el título a dos renglones
además hace que dos tarjetas seguidas midan parecido, que es lo que convierte un listado en una
lista.

**4. La firma se encoge a una línea.** El avatar de 45px y la fecha en su propio renglón se llevaban
un tercio del alto para decir algo que no decide ninguna compra. Queda el nombre; el retrato y el día
exacto vuelven en cuanto la tarjeta es apilada y hay alto de sobra. **Quién publicó no se quita**: es
de lo que vive el sitio, y es la diferencia con la referencia, que no lo enseña.

**Todo lo anterior es del renglón horizontal.** La tarjeta apilada —escritorio, tableta, teléfono
girado— no cambia ni un píxel: las cinco condiciones son consultas de contenedor.

### Archivos tocados

- `src/app/styles/globals.css` — `card-media` estira en vez de cuadrar.
- `src/presentation/post/Card/Card.tsx` — proporciones, tipografía y firma del renglón.
- `src/presentation/post/CardForList/CardForList.tsx` — el precio.
- `src/presentation/post/CardOwnerControls.tsx` — los tres controles, de vuelta al menú.
- Pruebas: `CardForList.test.tsx`, `PostsWithLoadMore.test.tsx`, `cardControls.spec.ts`,
  `existenciasEnLaTarjeta.spec.ts`, `tarjetaCompacta.spec.ts` y el `.feature`.

### Validación

| Qué | Resultado |
| --- | --- |
| `pnpm run typecheck` / `lint` | limpios, 1209 archivos |
| `pnpm run test:run` | **278 archivos, todas verdes** |
| Playwright acotado | **19/19** en 3.7 min |
| A ojo, con sesión iniciada | 390 de pie y 1280, con una publicación propia |

Los 3 escenarios de `inventory` que quedaron sin diagnosticar al cortarse una corrida anterior se
repitieron aislados: **3/3 en verde**. No eran regresiones ni fallos preexistentes — eran los
`page.goto` expirando con el servidor ahogado dentro del sandbox.

### Desviaciones

1. **Tercer cambio de rumbo sobre el mismo control.** Los controles de dueño fueron menú, luego fila,
   y ahora menú otra vez. Los dos primeros se decidieron sin medir la columna; el tercero se decidió
   **después** de medirla en el navegador con sesión iniciada. La medida está escrita arriba para que
   el cuarto cambio, si llega, empiece por ahí.
2. **`data-testid="card-edit"`** sobrevivió a la mudanza al menú, así que las pruebas que apuntaban al
   enlace de editar siguieron sirviendo con sólo abrir el panel antes.

### Recap

La tarjeta de un teléfono de pie se lee como un renglón de catálogo: foto a toda la altura a la
izquierda, título discreto a dos renglones, precio mandando, tres acciones en una sola fila y una
firma de una línea. Lo que sólo puede hacer quien administra cuelga de un «⋯» que comparte ese
renglón. Nada de esto toca la tarjeta apilada, porque las cinco condiciones preguntan por el ancho de
la tarjeta y no por el de la pantalla.

### Próximos pasos (opciones)

1. **Mirar el home y el perfil en un teléfono**, que heredan el renglón horizontal sin haberse visto.
2. **La foto ocupa el 38%.** Es un número elegido a ojo entre los 33% y 40% de la referencia; si al
   usarlo se ve estrecha o ancha, es una línea.
3. **El contador de apoyos junto al corazón** enseña «0» cuando nadie apoyó. La referencia no enseña
   ceros; podría callarse hasta el primer apoyo.

## Ajuste — La foto llena su mitad (2026-09-12)

### Objetivo

En el renglón de móvil la foto seguía viéndose pequeña aunque ya estirara: quedaba angosta dentro de
su columna y con aire por abajo. Se pidió además texto más chico.

### Decisiones y por qué

**1. El fallo estaba en la cadena de alturas, y lo encontró el usuario inspeccionando el DOM.** Un
`height: 100%` sólo resuelve si su padre tiene alto, así que basta con que un eslabón quede en
automático para que todo lo de abajo colapse. La cadena tiene cuatro: el envoltorio que posiciona las
insignias, **el enlace que envuelve la foto**, el hueco que pinta `MediaContent` y el marco del
esqueleto de carga. `card-media` ponía el alto en el primero y en el tercero; el enlace, en medio, se
quedaba fuera.

El usuario lo comprobó moviendo el `<img>` fuera del `<a>` en el inspector: así se ve bien, porque se
salta el eslabón roto. No se hizo así. La foto es de las primeras cosas que alguien toca en un
listado, y sacarla del enlace la deja sin llevar a ninguna parte. Se completó la cadena en el CSS,
con los cuatro eslabones enumerados y el motivo escrito, porque es un fallo que vuelve en cuanto
alguien mete un `div` más en medio.

**2. La foto ocupa la mitad exacta del renglón.** Se pidió «mínimo el 50%». Un mínimo de verdad —que
crezca si sobra— no tiene sentido aquí: la foto y el texto se reparten un ancho fijo, así que lo que
se le da a una se le quita a la otra. A partir de ~55% el título empieza a cortarse en la primera
palabra.

**3. Todo el texto baja un escalón** en el renglón horizontal: título a `text-label`, categoría a
`text-caption`, firma a `text-tiny`, precio a `text-heading-sm`. El precio baja con los demás y sigue
mandando: lo que lo hace grande es el contraste con el título, no su tamaño absoluto.

**El coste, que se avisó:** con la columna más angosta y el texto más chico, un título largo se corta
antes. «Falcon Protein – Proteína Vegana en Polvo – Chocolate 1.8 kg» ya no cabe entero en dos
renglones. Se aceptó a cambio de la lista compacta; las salidas son un tercer renglón de título o
devolver la foto al 46%.

### Archivos tocados

- `src/app/styles/globals.css` — la cadena de alturas de `card-media`, completa.
- `src/presentation/post/Card/Card.tsx` — la foto al 50%, título y firma más chicos.
- `src/presentation/post/CardForList/CardForList.tsx` — precio y categoría más chicos.

### Validación

| Qué | Resultado |
| --- | --- |
| `pnpm run typecheck` / `lint` | limpios, 1209 archivos |
| `pnpm run test:run` | **278 archivos, todas verdes** |
| Playwright acotado | **19/19** en 4.3 min |
| A ojo | 390 de pie, búsqueda y home, con y sin sesión |

### Recap

La foto del renglón de móvil llena su mitad entera —ancho y alto, recortada al centro— y el texto
cabe alrededor en cuatro escalones más bajos. El enlace sigue envolviendo la imagen, así que tocarla
sigue llevando a la publicación. Nada de esto toca la tarjeta apilada.

### Próximos pasos (opciones)

1. **El título cortado**, si molesta: tres renglones en vez de dos, o foto al 46%.
2. **El «0» del contador** cuando nadie ha apoyado, que la referencia no enseña.
3. **La insignia del pilar sobre la miniatura** quedó reducida a su número; en una foto oscura se lee
   suelta.

## Corrección — más aire y una etiqueta en el menú del dueño (2026-09-16)

### Objetivo

El usuario reportó que, dentro del menú «⋯» de una tarjeta editable, los tres controles (editar,
agotado/disponible, existencias) quedaban muy juntos; que "Guardar existencias" era un botón
innecesariamente largo; y que el campo de existencias no decía para qué era.

### Decisiones y por qué

- **La causa era una suposición mezclada en una sola bandera.** `StockControl` usaba `compact` para
  decidir dos cosas a la vez: el ancho del campo y si pintaba su propia etiqueta. Eso funcionaba en
  `/cuenta/inventario` —una tabla con columna «Existencias»— pero el menú de la tarjeta también es
  compacto y no tiene ninguna columna al lado: el campo se quedaba mudo salvo para un lector de
  pantalla, que sí oía el `aria-label`.
- **Se separó en dos props independientes**, `compact` (ancho) y `showLabel` (etiqueta visible),
  con `showLabel` siguiendo a `compact` por omisión para no tocar la tabla existente, y
  `CardOwnerControls` forzándolo aparte. Es la solución mínima: ni un componente nuevo ni una copia
  del campo, solo separar dos decisiones que nunca debieron viajar juntas.
- **"Guardar existencias" → "Guardar".** Con la etiqueta ya visible al lado del campo, el botón
  repetía la misma palabra dos veces. Se acortó en las dos traducciones (`es`/`en`), y afecta
  también a la tabla de inventario — ahí es igual de redundante y el cambio es una mejora, no solo
  un efecto colateral.
- **Espaciado:** el botón de agotado/disponible y el bloque de existencias pasan de `mt-1` a
  `mt-2`/`my-2`, con `cn()` para no tocar `MENU_SEPARATOR_CLASS` (compartida con otros menús).

### Archivos tocados

- `src/presentation/post/StockControl/StockControl.tsx` + `.test.tsx`: prop `showLabel`, dos
  pruebas nuevas.
- `src/presentation/post/CardOwnerControls.tsx`: `showLabel` forzado, más espaciado.
- `src/i18n/messages/es.json` / `en.json`: `stockSave` acortado.
- `docs/features/platform/039-2026-09-10-listados-compactos.md` (esta sección).

### Comandos y validación

- `pnpm exec vitest run src/presentation/post/StockControl/StockControl.test.tsx` — 6 tests,
  verdes.
- `pnpm exec vitest run src/presentation/post/CardForList/CardForList.test.tsx` — 50 tests, verdes,
  sin tocarlos.
- `pnpm run test:run` — 278 archivos, 2929 tests, verdes.
- `pnpm run typecheck` / `pnpm run lint` — limpios.
- `pnpm exec playwright test src/e2e/inventory/existenciasEnLaTarjeta.spec.ts` — 5/5, verdes.
- `pnpm exec playwright test src/e2e/inventory/inventario.spec.ts src/e2e/inventory/panelDeInventario.spec.ts` —
  20/20, verdes — confirma que la tabla de `/cuenta/inventario` no cambió de comportamiento.

### Desviaciones

Ninguna. Acortar `stockSave` afecta también a la tabla de inventario, pero es deliberado: ahí el
botón también repetía la columna que ya rotula el campo.

### Recap

El menú del dueño de una tarjeta ya no amontona sus tres controles: hay más aire entre editar,
agotado/disponible y existencias, el botón dice solo "Guardar" y el campo de existencias tiene su
propia etiqueta visible, sin que la tabla de inventario haya cambiado de comportamiento.

### Próximos pasos (opciones)

1. Cerrar aquí: lo reportado queda resuelto y documentado.
2. Confirmar visualmente en un teléfono real que el menú se ve con el espaciado esperado.
