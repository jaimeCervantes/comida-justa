# Listados compactos: facetas arriba, tarjeta de iconos, cuatro columnas

## Contexto

- **Problema.** En el teléfono, el panel de facetas de la búsqueda se apila arriba a ancho completo
  y mide unos 360 px: hay que recorrerlo entero —debajo del encabezado, del «mostrando resultados
  para» y del resumen— antes de ver el primer resultado. En escritorio pasa lo contrario: las
  tarjetas miden 394 px en el home y 306 en la búsqueda para un contenido que no llena ni la mitad
  del renglón, y cada acción cae en su propia línea porque los botones llevan texto.
- **Ahorro.** El primer resultado visible sin desplazarse en móvil; el doble de publicaciones por
  pantalla en escritorio (3 → 4 columnas) y en móvil (1 → 2); una tarjeta más corta porque tres
  renglones de botones se vuelven uno.
- **Por qué.** El sitio vive de que alguien reconozca lo que hay cerca. Cuantas más publicaciones
  entran en una pantalla sin encoger la foto, más corto es el camino entre abrir y reconocer.

## Lo que está medido

El ancho de contenido lo pone `container-width` (`max-w-7xl` + `px-8`): **1216 px** como tope.

| Listado             | Ancho disponible hoy | Columnas | Ancho por tarjeta |
| ------------------- | -------------------- | -------- | ----------------- |
| Home, categoría, productos, tienda, perfil | 1216 | 3 | 394 px |
| Búsqueda (con barra lateral de 240 + 24 de separación) | 952 | 3 | 306 px |

Las columnas no se declaran: salen de `columns-[300px]` en `cardList.ts`, y `MasonryColumns` repite
ese mismo 300 en `MIN_COLUMN_WIDTH` con un test que vigila que no se separen.

**Por eso las 4 columnas no salen de bajar el mínimo.** Con 280 px el home daría 4 y la búsqueda se
quedaría en 3; para que la búsqueda diera 4 el mínimo tendría que bajar a 226, y entonces el home
daría 5. No hay un número que resuelva los dos anchos a la vez. Subir las facetas iguala los dos
listados en 1216, y el número de columnas pasa a declararse (2 / 3 / 4) en vez de deducirse.

Anchos que resultan, con `gap-4`:

| Pantalla                    | Columnas | Ancho por tarjeta |
| --------------------------- | -------- | ----------------- |
| Teléfono (360 px de ventana) | 2       | 156 px            |
| Tableta (768 px)            | 3        | 226 px            |
| Escritorio (≥1280 px)       | 4        | 292 px            |

Con `p-5`, una tarjeta de 156 px deja **116 px útiles**: no caben la firma con avatar, nombre y
fecha, ni una fila de botones con texto. De ahí sale el orden de los slices: la tarjeta tiene que
adelgazar **antes** de que las columnas se estrechen.

## Slices

### Slice 1 — Las facetas, arriba

El `aside` de 240 px pasa a ser una fila de chips a lo ancho, encima de los resultados: los cuatro
pilares con su número, «Todo», y «Solo con existencia». Se desplaza en horizontal cuando no cabe,
con el patrón que ya usa `NearbyBar` (`no-scrollbar scroll-hint-x overflow-x-auto`).

Los resultados recuperan 264 px y quedan con los mismos 1216 que el resto del sitio.

**Criterios de aceptación**

- Con un término buscado, las facetas se ven encima del primer resultado, no a su izquierda.
- Cada faceta sigue haciendo lo mismo: enlace con la búsqueda y el filtro cambiado, cuenta por
  pilar, `aria-pressed` en disponibilidad, y la página vuelve a la 1.
- Sin término no hay facetas.
- Los `data-testid` no cambian: `busquedaFacetada.spec.ts` tiene que pasar **sin editarlo**. Si hay
  que tocarlo, es que se rompió una promesa de verdad, y eso se reporta.

### Slice 2 — La tarjeta habla por iconos

- Carrito, apoyar y compartir se quedan sin texto: icono con nombre accesible.
- Compartir se sube sobre la imagen, junto al pilar y al contador de archivos que ya viven ahí.
- Editar, marcar agotado y guardar existencias salen de la tarjeta a un menú «⋯»: son de una sola
  persona y hoy ocupan la mitad de la altura compitiendo con el botón de comprar.
- Mismo criterio en la ficha de la publicación, que es donde el visitante llega después.

**Criterios de aceptación**

- Cada acción conserva su nombre accesible completo aunque no enseñe texto.
- Los controles de dueño siguen siendo alcanzables y siguen sin aparecerle a quien no es dueño.
- La tarjeta de una publicación ajena pierde al menos un renglón de alto.

### Slice 3 — Dos, tres y cuatro columnas

Número de columnas declarado (2 / 3 / 4) en vez de deducido de un ancho mínimo, y la tarjeta
decidiendo su forma por **su propia columna** con `@container` —156, 226 o 292 px— y no por el
tamaño de la ventana: la misma tarjeta vive en los tres anchos y en los 240 px de «Publicaciones
relacionadas», y ninguno se deduce del viewport.

**Criterios de aceptación**

- En una ventana de 1280 px, los resultados de una búsqueda se reparten en 4 columnas.
- En una de 390 px, en 2.
- Cargar más publicaciones en el home no mueve las que ya se estaban viendo (la promesa que
  `MasonryColumns` ya sostiene).
- `MIN_COLUMN_WIDTH` deja de tener que decir lo mismo que una clase de Tailwind, o su test sigue
  vigilando la nueva relación.

## Decisiones

- **Mampostería, no rejilla.** Con 10 de 15 fotos verticales, recortarlas todas a cuadrado para que
  las filas casen cuesta más de lo que ahorra. El motivo por el que `cardList.ts` descartó la
  rejilla —el hueco que `mt-auto` deja bajo una tarjeta corta— se debilita al quitar la firma, pero
  no lo suficiente para cambiar de máquina.
- **La tarjeta mira su columna, no la ventana.** Es lo que permite una sola tarjeta para los cuatro
  anchos. El patrón ya está en el repo (`PublicHabitCelebrationList`, `CommunityHabitGarden`).
- **«Marcar agotado» no recibe icono, recibe menú.** No existe un icono entendible para eso, y la
  condición era que lo fuera.

## Lo que no entra

- Barrido de iconos en el resto del sitio (publicar, cuenta, agenda, carrito, pedidos). Acordado:
  tarjeta y ficha de publicación.
- Tocar `SEARCH_PAGE_SIZE` (6). Con 4 columnas la segunda fila queda de 2, y en mampostería eso no
  deja hueco. Si al ver el resultado molesta, es un cambio de una línea en otro slice.
- Filtro por distancia o cualquier faceta nueva: se mudan las que hay.

## Corrección — más aire y una etiqueta en el menú del dueño *(2026-09-16)*

**Problema:** el usuario reportó que, dentro del menú «⋯» de una tarjeta editable (editar / agotado
o disponible / existencias), los controles quedaban muy juntos, que el botón «Guardar existencias»
era innecesariamente largo, y que el campo de existencias no decía para qué era.

**Causa:** `StockControl` nació para dos sitios con una sola bandera (`compact`), y uno de los dos
—la tabla de `/cuenta/inventario`— tiene una columna «Existencias» que rotula el campo por él; el
otro —este menú— no tiene ninguna columna al lado, así que el campo se quedaba mudo salvo para un
lector de pantalla.

**Arreglo:**

- `StockControl` separa esa suposición en dos props: `compact` (ancho) y `showLabel` (si pinta su
  propia etiqueta), con `showLabel` siguiendo a `compact` por omisión —la tabla no cambia— y
  `CardOwnerControls` forzándolo aparte.
- `stockSave` pasa de "Guardar existencias" a "Guardar": con la etiqueta ya visible al lado, repetir
  «existencias» en el botón era decirlo dos veces.
- Más separación entre los tres grupos del menú: el botón de agotado/disponible y el bloque de
  existencias ganan `mt-2` / `my-2` en vez de `mt-1`.

**Cobertura:** dos pruebas nuevas en `StockControl.test.tsx` (con `showLabel` y sin él); las
existentes (`existenciasEnLaTarjeta.spec.ts`, `inventario.spec.ts`, `panelDeInventario.spec.ts`)
siguieron pasando sin tocarlas.
