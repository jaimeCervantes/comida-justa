# Bitácora — La barra de cercanía cabe en un renglón

## Slice 1 — La prosa se muda al nombre accesible (2026-08-28)

### Lo que se pidió

«Que `data-testid="nearby-bar"` sea una sola línea en escritorio: quita el texto descriptivo y deja
solo las acciones que importan, así en móvil ocupará menos espacio vertical».

### Cómo llegó a ser tres renglones

Nadie la diseñó así. Se fue llenando por slices, y cada uno tenía razón por separado:

| Slice | Qué le añadió |
| --- | --- |
| `@slice-1` de chrome v2 | La cara con ubicación (`LocationChip`) y la cara sin ella (`LocationNotice`), con la invitación a abrir tienda que solo vive ahí |
| `@slice-4` de chrome v2 | Los cinco filtros de pilar (`NearbyPillarFilter`) |

El resultado es que la barra decía cuatro párrafos —y como es **chrome**, los decía en todas las
rutas, encima del catálogo:

| Texto | Dónde | Coste |
| --- | --- | --- |
| «Distancias desde tu ubicación» | `LocationChip` | ~185 px de ancho |
| «· actualizada hace 2 horas» | `LocationChip` | ~170 px de ancho |
| «No sabemos dónde estás, así que no podemos decirte qué tan cerca te queda cada cosa.» | `LocationNotice` | 1-2 renglones |
| «¿Vendes algo? Para que te encuentren por cercanía necesitas abrir tu tienda y darle la ubicación de tu sucursal.» | `LocationNotice` | 2-3 renglones |
| «Compartirla es lo que distingue lo que está a dos cuadras…» (al negarse) | `LocationNotice` | 2-3 renglones |

Sumado a los ~620 px de los cinco filtros, no había ancho que alcanzara.

### La decisión: no se borra, se anuncia

La tentación era borrar las frases. Se hizo otra cosa, y es lo único no obvio de este slice: cada
cara **conserva su explicación entera** como su `aria-label` —y como `title`, para el ratón—, así
que quien usa lector de pantalla la sigue oyendo al entrar en la región y quien pasa el cursor la
sigue leyendo. Lo que se dejó de gastar son renglones, no información.

Eso decidió también qué se afirma en las pruebas. Los cinco tests que decían
`toHaveTextContent(/no podemos decirte qué tan cerca/)` ahora dicen `toHaveAccessibleName(...)`: la
promesa —«esta barra explica por qué no hay distancias»— no cambió; cambió por qué canal la cumple.
Y hay dos tests nuevos que afirman lo contrario, que la explicación **no** está dibujada, porque eso
es lo que este slice compró.

### Lo que quedó dibujado

| Cara | Antes | Ahora |
| --- | --- | --- |
| Con ubicación | 📍 Distancias desde tu ubicación · actualizada hace 2 horas [Actualizar] | 📍 [Actualizar] |
| Sin ubicación | Párrafo + [Ver a qué distancia está] + párrafo de «¿Vendes algo?…» | [📍 Ver a qué distancia está] ¿Vendes? **Abre tu tienda** |

`distance.sellerCta` pasó de una frase de 105 caracteres a «¿Vendes?» en los dos catálogos: el
enlace que le sigue ya dice qué hacer, y la explicación completa vivía en un párrafo que nadie leía
en el chrome de una página de catálogo.

### Los filtros: se deslizan, no se parten

Los cinco filtros son la pieza ancha. En un teléfono se partían en dos y tres renglones; ahora son
una fila deslizable. La forma viaja como `className` desde `NearbyPillarFilter` y **no** se cambió
`PublicationPillarFilter`: las otras cuatro rutas que lo montan (categoría, directorio, perfil,
tienda) van debajo de un título, con ancho de sobra, y siguen partiéndose como siempre.

Dos detalles que no son de estilo:

- **`shrink-0` en el enlace base.** Sin él, dentro de un contenedor que no parte, los cinco se
  comprimen hasta romper su etiqueta en dos renglones en vez de salirse y dejarse arrastrar. En las
  otras cuatro rutas no cambia nada: ahí nunca les falta ancho.
- **`py-1` en la fila.** `overflow-x` recorta también en vertical, así que sin ese margen el anillo
  de foco de un filtro se cortaba al tabular.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Chrome | `NearbyBar/NearbyBar.tsx` (fila `lg:flex-nowrap`) |
| Ubicación | `LocationChip.tsx`, `LocationNotice.tsx`, `NearbyPillarFilter.tsx` (+ sus tests) |
| Publicaciones | `PublicationPillarFilter.tsx` (`shrink-0` en el enlace base) |
| Catálogo | `es.json`, `en.json`: `distance.sellerCta` |
| Especificación | `src/e2e/chrome/chrome.feature` (`@slice-5`), `src/e2e/chrome/nearbyBar.spec.ts`, `src/e2e/ubicacionFresca/chip.spec.ts` |

### Lo medido, que es lo único que decide si esto funcionó

Se midió en el navegador con un spec temporal (borrado al terminar), sobre la cara **sin ubicación**
—la que más texto tenía—, en `/`. El «antes» salió de correr esa misma medición con
`git stash push -- src/presentation src/i18n`, o sea contra el código de `dev`.

| Ancho | Alto de la barra, antes | Alto ahora | Ahorro |
| --- | --- | --- | --- |
| 390 (teléfono) | **249 px** | **105 px** | −144 px (−58 %) |
| 1024 (`lg`) | **142 px** | **65 px** | −77 px (−54 %) |
| 1280 | **142 px** | **65 px** | −77 px (−54 %) |
| 1440 | **142 px** | **65 px** | −77 px (−54 %) |

Y lo que se pidió, que no es el alto sino la fila. Centros verticales del control de ubicación y del
filtro de pilares:

| Ancho | Antes | Ahora |
| --- | --- | --- |
| 1024 | 126 vs 178 → **dos filas** | 97 vs 97 → **una** |
| 1280 | 126 vs 178 → **dos filas** | 97 vs 97 → **una** |
| 1440 | 126 vs 178 → **dos filas** | 97 vs 97 → **una** |
| 390 | 195 vs 313, con el filtro de 88 px de alto (**dos renglones de filtros**) | 141 vs 189, filtro de 48 px (**uno**) |

Dos cosas que la medición enseñó y no se sabían de antemano:

- **A 1024 px la barra es una fila, pero el filtro desborda 162 px** y se desliza. Cabe entera sin
  deslizar desde 1280. Es degradación honesta —lo que no cabe se arrastra, no se parte— y coincide
  con el tramo estrecho que el slice 2 de `027` ya documentó como el que aprieta en escritorio.
- **En el teléfono los cinco filtros se deslizan 271 px.** Los dos últimos —Movimiento y
  Mente/Espíritu— quedan fuera de pantalla hasta que se arrastra la fila. Es el precio del renglón
  ganado, decidido a sabiendas; queda anotado abajo por si la telemetría dice que nadie los pulsa.

### Comandos y resultados

```
pnpm exec vitest run src/presentation/{location,chrome/NearbyBar,post}   # 139/139
pnpm run test:run                                                        # 2441/2441
pnpm exec tsc --noEmit                                                   # limpio
pnpm run typecheck:tests                                                 # los 7 errores de siempre (globSync), ajenos
pnpm run check:i18n                                                      # limpio
biome check .                                                            # limpio
pnpm exec playwright test src/e2e/chrome/nearbyBar.spec.ts src/e2e/ubicacionFresca/chip.spec.ts
```

Sobre la e2e: la primera corrida dio **19/21**, con `/categoria/jugos` y `/pilares/alimentacion`
fallando por no encontrar `nearby-bar` en 5 s — dos rutas que se visitaban por primera vez, o sea
compilando en `next dev`. Repetidas, **verdes las dos**. Es la flakiness en frío ya conocida, no una
regresión: ninguno de los dos escenarios toca nada de este slice.

**`.next/dev/types` estaba corrupto** antes de empezar (`"itica-de-privacidad"`, una línea truncada
de una sesión anterior) y hacía fallar `tsc` con 18 errores en archivos generados. Se borró; se
regenera sola. No tiene que ver con este cambio, pero conviene saberlo: parece un error de tipos y
no lo es.

### Recap

La barra de cercanía volvió a ser una fila. En escritorio —de 1024 para arriba— el rótulo, el
control de ubicación y los cinco filtros comparten renglón; en un teléfono pasó de 249 a 105 px, que
es alto que se le devuelve al catálogo en **todas** las rutas, porque esto es chrome. Lo que cedió
el sitio fue la prosa, no las acciones: las tres explicaciones y la antigüedad de la ubicación
siguen dichas enteras, ahora como nombre accesible de cada cara, y siguen ahí el botón de ubicación,
la invitación a abrir tienda y los cinco filtros. La única información que se recortó de verdad es
la frase larga de `sellerCta`, que pasó a «¿Vendes?» delante del enlace que ya decía qué hacer.

### Próximos pasos (opciones)

1. **Mirar si los dos últimos filtros se pulsan en el teléfono.** Movimiento y Mente/Espíritu
   quedan fuera de pantalla hasta que se arrastra la fila. Si no se usan, la salida no es volver a
   partir la fila: es una pista visual de que hay más (un degradado en el borde derecho).
2. **`/productos` y `/buscar`**, los dos siguientes acordados en `027`: el catálogo no tiene ni
   resumen de resultados ni facetas con cuentas, y la búsqueda sí.
3. **La antigüedad de la ubicación ya no se ve.** Vive en el `title` y el `aria-label`, y en un
   teléfono no hay hover: quien tenga una ubicación de hace meses no tiene cómo enterarse mirando.
   `LocationRefresher` cubre a quien concedió el permiso; para el resto, si esto llega a doler, la
   respuesta es enseñar la antigüedad **solo cuando está vieja**, no siempre.

## Slice 2 — Una fila de verdad: el scroll se lleva la barra entera (2026-08-28)

### La corrección

El slice 1 dejó dos comportamientos distintos: en escritorio una fila, y en el teléfono la barra
partida en dos —la ubicación arriba, los filtros abajo en su propio renglón deslizable—. El usuario
lo paró:

> «No me gusta que "cerca de ti" con icono y botón no sean parte del renglón. Creo que si son parte
> del renglón, el scroll horizontal tendrá más propósito y menos espacio vertical: que todo esté en
> un solo renglón con scroll horizontal».

Tiene razón por dos motivos y ninguno es de gusto:

1. **El scroll estaba encerrado en la mitad ancha.** Un contenedor deslizable dentro de una fila que
   además se parte son dos mecanismos de desbordamiento para un mismo problema. Con el
   `overflow-x` en la barra completa hay uno solo, y un gesto arrastra todo.
2. **Un renglón cuesta la mitad que dos.** Y el renglón es justo lo que este slice vino a comprar.

### Qué se movió

El `overflow-x` bajó de `NearbyPillarFilter` a la fila de `NearbyBar`, y con él el `no-scrollbar` y
el relleno vertical. `IN_A_SINGLE_ROW` pasó de siete clases a tres (`shrink-0 flex-nowrap py-0`):
el filtro ya no gestiona su desbordamiento, solo se compromete a no partirse ni comprimirse. La fila
dejó de ser `flex-wrap … lg:flex-nowrap` y es `flex` a secas, con cada pieza `shrink-0`.

`LocationNotice` perdió su `flex-wrap`: dentro de una fila que no parte, nunca se iba a usar, y
dejarlo escrito decía algo que ya no era cierto.

### La pista de que la fila sigue

Esconder la barra de desplazamiento ahorra alto, pero deja la fila sin decir que continúa — y un
filtro al que nadie sabe llegar es un filtro que no existe. El usuario lo pidió así: «unas flechas
para indicar que hay más, o algo minimalista que no quite espacio».

La condición «que no quite espacio» es la que descarta lo obvio: un elemento con una flecha cobra
alto o ancho, y el alto es justo lo que se está comprando. Así que `scroll-hint-x`
(`utility-patterns.css`) **no es un elemento**: son cuatro capas de fondo del propio contenedor, y
todo el mecanismo está en `background-attachment`.

- Las dos **tapas** van `local`, o sea que viajan con el contenido.
- Las dos **flechas** van `scroll`, clavadas a los bordes del contenedor.

De ahí salen los cuatro estados sin una línea de JavaScript ni un `ResizeObserver`:

| Estado | Qué se ve |
| --- | --- |
| Al principio | solo la flecha derecha (la tapa izquierda tapa la suya) |
| En medio | las dos |
| Al final | solo la izquierda |
| Cuando todo cabe | ninguna: las dos tapas se sientan encima de las dos flechas |

Ese último renglón es el que hace que valga la pena el truco. La alternativa con JavaScript —un
componente de cliente en el chrome de todas las rutas, con `scroll` y `ResizeObserver`— daba el
mismo resultado pagando bundle en cada página.

Lo único que se le concede al pragmatismo: las tapas usan `var(--surface-elevation-1)` y siguen al
tema solas, pero dentro de un `data:` URI no entra una variable CSS, así que la flecha lleva el
`#8a9480` que `--text-muted` vale en oscuro — el gris que se lee en las dos superficies (2.9 sobre
el papel claro, 3.5 sobre el oscuro). Es una pista decorativa que repite lo que el desvanecido ya
dice, no información, así que no se duplica el bloque en `@media (prefers-color-scheme)`.

### Lo que cambió en las pruebas

El escenario de escritorio y el de móvil eran el mismo escenario con dos respuestas distintas.
Ahora es **un `Scenario Outline` sobre tres anchos** (390, 1024, 1440) que afirma lo mismo en los
tres: la ubicación y los filtros comparten centro vertical. Y el «no se come un quinto de la
pantalla» se volvió «la barra mide un renglón, no dos», afirmado contra el alto de un filtro y no
contra un número.

La pista de scroll se prueba por su condición, no por su implementación: **la barra mide lo mismo
en el ancho donde la fila desborda que en el que le sobra sitio**. Un desvanecido no se consulta en
el DOM; que no cobre alto, sí. (La primera versión de esa prueba afirmaba
`background-attachment: local, local, scroll, scroll` — o sea cómo está construido. Se cambió antes
de correrla: es exactamente el patrón que `AGENTS.md` prohíbe.)

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Chrome | `NearbyBar/NearbyBar.tsx` (la fila pasa a ser el contenedor deslizable) |
| Estilos | `src/app/styles/utility-patterns.css` (+`.scroll-hint-x`) |
| Ubicación | `NearbyPillarFilter.tsx` (de siete clases a tres), `LocationNotice.tsx` (sin `flex-wrap`) |
| Especificación | `chrome.feature` (`@slice-5` reescrito), `nearbyBar.spec.ts` |

### Lo medido

Misma medición que el slice 1, misma cara (sin ubicación), mismo `/`:

| Ancho | Antes del slice 1 | Slice 1 | **Ahora** | Filas |
| --- | --- | --- | --- | --- |
| 390 | 249 px | 105 px | **57 px** | 4 → 2 → **1** |
| 1024 | 142 px | 65 px | **57 px** | 2 → 1 → **1** |
| 1280 | 142 px | 65 px | **57 px** | 2 → 1 → **1** |
| 1440 | 142 px | 65 px | **57 px** | 2 → 1 → **1** |

Los centros verticales del aviso y del filtro coinciden en los cuatro anchos (145 en 390; 93 en los
tres de escritorio): **una sola fila en todos**. Lo que se arrastra: 643 px en un teléfono, 162 px a
1024, y nada desde 1280.

Los 8 px que se ganan sobre el slice 1 en escritorio salen del `py-1` que el filtro ya no necesita:
el relleno que protege el anillo de foco lo pone ahora la fila, una vez, en vez de acumularse.

### Comandos y resultados

```
pnpm exec vitest run src/presentation/{location,chrome/NearbyBar}   # 52/52
biome check .                                                       # limpio
pnpm exec playwright test src/e2e/chrome/nearbyBar.spec.ts src/e2e/ubicacionFresca/chip.spec.ts
                                                                    # 24/24
```

### Recap

La barra es un solo renglón en cualquier ancho —57 px, de 390 a 1440— y el desbordamiento lo
resuelve un único gesto: arrastrar la fila. Se acabaron los dos comportamientos según el ancho. La
pista de que la fila continúa cuesta cero alto porque no es un elemento sino cuatro capas de fondo,
y aparece solo del lado que todavía tiene contenido: cuando todo cabe, no se ve nada.

### Próximos pasos (opciones)

1. **Mirar cuánto se arrastra de verdad.** En un teléfono quedan 643 px fuera de pantalla: el
   rótulo, la ubicación y los filtros compiten por los primeros 390. Si los filtros resultan ser lo
   que más se usa, el orden dentro de la fila es la palanca —ponerlos primero— antes que cualquier
   otra cosa.
2. **La flecha lleva un hex.** Es la única concesión del slice y está anotada en el CSS. El día que
   haya un tercer tema, o que un `data:` URI acepte variables, se convierte en token.
3. **`/productos` y `/buscar`**, los dos siguientes acordados en `027`.
