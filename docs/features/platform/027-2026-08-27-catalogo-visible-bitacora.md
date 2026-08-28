# Bitácora — El catálogo deja de estar escondido

## Slice 1 — `/productos` entra a la barra del pulgar (2026-08-27)

### De dónde salió

De descartar otra cosa. Se estaba evaluando meter la paginación del scroll infinito en la URL para
poder volver al sitio donde uno se quedó, y el usuario paró la idea: *«un scroll con muchos posts
sería mucho y complica el código; ya tenemos la página de productos y servicios y los resultados de
búsqueda, que también traen paginado — creo que es más productivo mejorar esas, y `/productos`
debería ser más visible»*.

Tenía razón por partida doble. La restauración añadía estado y complejidad para un problema que la
paginación ya resuelve; y `/productos` estaba, medido, casi inalcanzable.

### La medición que lo decidió

Contando enlaces **visibles sin abrir ningún menú** en el home:

| | Enlaces visibles a `/productos` | Dónde |
| --- | --- | --- |
| Escritorio | 2 | el CTA «Ver lo que hay hoy» y el pie |
| **Teléfono** | **1** | **solo el pie, a 6.670 px de scroll** |

El CTA que lleva al catálogo **existe en el DOM del teléfono pero está oculto**: vive en la portada,
que es `hidden lg:block`. Así que en un teléfono se llegaba por hamburguesa → Comunidad → Productos,
o bajando hasta el final de la página.

### Por qué la plaza se le quita a «Pedidos»

La barra tiene cinco plazas y el 5.1 las fijó en cinco. Había que elegir, y el argumento es el
visitante anónimo: **dos de las cinco pestañas —«Pedidos» y «Yo»— son un muro de acceso**, las dos
redirigen a identificarse. En un sitio cuya puerta es mirar lo que hay, la barra del pulgar daba dos
de sus cinco plazas a algo que la mayoría no puede usar todavía, y ninguna a lo que vino a ver.

«Pedidos» no se queda sin camino: lo llevan el menú del avatar y `AccountNav` —o sea, la pestaña
«Yo» de al lado, a dos toques—. `/productos` no tenía ninguno.

### Lo que no se tocó, y por qué

**La barra de escritorio.** La tentación era subir «Productos» a una píldora de primer nivel, pero
`Nav.tsx` tiene escrito por qué hay tres y no cinco: *«Empezó con cinco elementos... y no cabían:
"4 Pilares" se partía en dos renglones»*. Y la medición dice que en escritorio el catálogo ya tiene
dos enlaces visibles. El problema era del teléfono; se arregla donde está.

### Un texto que no cabía

La sección se llama «Productos y servicios» —así se rotula en el menú y en su `h1`— y eso no entra
en una pestaña de 78 px. La etiqueta de la barra es **«Catálogo»**, que es corto, dice lo mismo y no
promete solo productos.

### Una clave que se quedaba sin dueño

Al cambiar la pestaña, `nav.bottomOrders` dejaba de tener consumidor. Se retira de los dos
catálogos en vez de dejarla: una clave traducida que no pinta nadie es la copia muerta que este repo
ya documentó al rescatar `habitCommunity.invitation`.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Chrome | `BottomNav/bottomNavTabs.ts` (+ test), `BottomNav/BottomNav.tsx` (icono de tienda) |
| Catálogo | `es.json`, `en.json`: entra `nav.bottomProducts`, sale `nav.bottomOrders` |
| Especificación | `src/e2e/chrome/bottomNav.spec.ts` (+1 escenario) |

### Comandos y resultados

```
pnpm run validate     # biome + typecheck + typecheck:tests + 2437/2437 en verde
pnpm run check:i18n   # limpio
pnpm exec playwright test src/e2e/chrome/bottomNav.spec.ts
```

Comprobado en un teléfono emulado, que es lo que las pruebas de unidad no ven:

| | Antes | Ahora |
| --- | --- | --- |
| Enlace visible a `/productos` | a 6.670 px (el pie) | **a 742 px, fijo en la barra** |
| Pestaña marcada en `/productos` | ninguna | «Catálogo» |
| Pestaña marcada en `/productos/page/2` | ninguna | «Catálogo» |

### Recap

El catálogo pasó de estar a 6.670 px de scroll —o detrás de dos menús— a tener su plaza fija en la
barra del pulgar. La plaza sale de «Pedidos», que era un muro de acceso para quien todavía no ha
entrado y que conserva dos caminos propios. La barra de escritorio no se tocó: ahí el problema no
existía, y su forma actual responde a una decisión ya documentada.

### Próximos pasos (opciones)

1. **Mejorar `/productos`** (acordado como slice siguiente): hoy la búsqueda está mejor construida
   que el catálogo — tiene resumen de resultados y facetas con cuentas (`SearchSummary`,
   `SearchFacets`), y el catálogo solo el filtro de pilares de la barra. Los dos componentes son
   reutilizables.
2. **Mejorar `/buscar`** (acordado como el último de los tres): falta que el usuario diga qué le
   incomoda; la revisión la encontró bastante completa.
3. **El CTA «Ver lo que hay hoy» sigue siendo de escritorio.** Ahora importa menos —la barra cubre
   el teléfono—, pero conviene saber que la portada entera está oculta por debajo de `lg`.

## Slice 2 — El escritorio: un desbordamiento viejo, y la píldora del catálogo (2026-08-28)

### La pregunta que lo destapó

«¿"Catálogo" también podría estar en el menú superior de escritorio, o definitivamente no cabe?».
Se probó en vez de contestar de memoria — y el docstring de `Nav.tsx` tenía razón, pero por poco, y
midiendo apareció algo peor que ya estaba ahí.

### El defecto que ya existía

El header **desbordaba antes de tocar nada**, y no por poco:

| Ancho | Desborde, sin ningún cambio |
| --- | --- |
| 1024 | **198 px** |
| 1152 | **70 px** |
| 1280 | cabe justo |

La causa: la barra de navegación aparece en `lg` (1024 px), pero el header no cabía hasta 1280. En
esos 256 px de ventana el sitio se veía roto en escritorio — a 1024 quedaban cortados «Iniciar
sesión» y el selector de idioma.

### El arreglo, propuesto por el usuario

«¿Y si los botones de iniciar sesión y publicar los dejamos solo con el icono, sin texto, para que
no ocupen espacio horizontal?». Los dos **ya** ocultaban su texto por debajo de `sm` y ya llevaban
`aria-label`: el patrón existía, solo faltaba extenderlo al tramo que se rompía.

`ACTION_LABEL` es `hidden sm:block lg:hidden xl:block` — solo icono hasta `sm`, con texto de `sm` a
`lg`, solo icono de `lg` a `xl` (donde la barra compite por el ancho), y con texto desde `xl`. Más
`mx-4` en vez de `mx-8` en el buscador dentro de ese tramo, que eran los últimos 20 px.

Resultado medido: **cabe de 640 a 1920**, sin solapamientos —16 px de separación entre bloques en el
tramo apretado, 32 px desde `xl`—.

### Por qué siguen siendo tres píldoras

Con el desbordamiento arreglado se probó una cuarta. No entra: a 1280 desborda 41 px, porque justo
en `xl` vuelven a la vez el texto de los dos botones y el margen ancho del buscador. Tres es el
número, así que la pregunta pasó a ser cuál cede, y la decisión fue del usuario: **«Catálogo» toma
la plaza de «Nosotros»**, que baja al desplegable de «Comunidad».

Queda dicha la tensión: «Comunidad» está descrita como «la puerta a todo lo que publica la gente», y
«Nosotros» habla de la marca, no de lo que la comunidad comparte. Por eso va al final del
desplegable y separado por una línea, en vez de mezclado con las publicaciones. Sigue además en el
pie, bajo «Explora».

### Los dos menús dicen lo mismo

En el teléfono no había problema de espacio —ese menú es una lista vertical— pero «Nosotros» bajó
también ahí. Que una sección esté en un nivel en escritorio y en otro en móvil obliga a aprendérsela
dos veces.

`MenuSection` pierde `about` y gana `products`: un identificador sin ninguna ruta que lo reclame
sería una sección imposible de marcar. `/nosotros` pasa a marcar `community`, que es donde vive
ahora, y `/productos` se marca a sí mismo. Hay una prueba nueva que impide que dos secciones
reclamen la misma ruta: `activeMenuSection` devuelve una sola, así que ganaría la primera del objeto
—la equivocada— sin que nada fallara.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Chrome | `Header/Header.tsx` (`ACTION_LABEL`, margen del buscador), `Header/Nav.tsx`, `Header/MobileNav.tsx`, `Header/menuItems.ts` (+ test) |
| Catálogo | `es.json`, `en.json`: `nav.aboutDescription` |

### Comandos y resultados

```
pnpm run validate     # 2438/2438 en verde
pnpm run check:i18n   # limpio
```

### Recap

La barra de escritorio gana «Catálogo» sin que nada se salga por el borde, y de paso se cerró un
desbordamiento que llevaba tiempo rompiendo el header entre 1024 y 1279 px. El texto de las dos
acciones se esconde solo en el tramo donde estorba, y como ya tenían `aria-label`, quien usa lector
de pantalla oye lo mismo en todos los anchos.

### Próximos pasos (opciones)

1. **Mejorar `/productos`**, el siguiente acordado: la búsqueda tiene resumen de resultados y
   facetas con cuentas, y el catálogo no.
2. **Mejorar `/buscar`**, el último de los tres.
