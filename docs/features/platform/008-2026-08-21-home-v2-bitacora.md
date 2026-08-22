# Bitácora — El home estrena su portada

Roadmap: `docs/features/platform/008-2026-08-21-home-v2.md`.

---

## Slice 1 — La portada del 5.2 (2026-08-21)

### Objetivo

Que el home diga qué es antes de enseñar el catálogo, y que la voz de la marca —la serif que se
descargaba sin pintarse— llegue por fin a la pantalla.

### El hallazgo: dos fallos que ningún test veía

Este slice destapó **dos** errores que pasan por `tsc`, por `next build` y por Vitest, y que solo se
ven pidiendo la página:

1. **`buttonVariants` exportado desde un Client Component.** Para que los CTA fueran enlaces de
   verdad y no copiaran el relleno del botón, se exportó la `cva` desde `Button.tsx` — que lleva
   `"use client"`. Un Server Component que la llame revienta en tiempo de ejecución:
   *«Attempted to call buttonVariants() from the server»*. El home devolvía **500**. Arreglo: la
   `cva` se muda a `buttons/buttonVariants.ts`, sin directiva, y `Button` la importa.

2. **`text-display` desaparecía del `class`.** El titular salía a tamaño de cuerpo en una serif.
   `cn()` es `tailwind-merge`, que desempata **por el nombre de la clase**: sin `display` en su
   lista de tamaños le parecía un color de texto, chocaba con `text-text-base` y lo descartaba.

   Lo brutal es que `merge-class-names.ts` **ya documentaba exactamente este síntoma** —«el
   componente se queda literalmente sin clase de tamaño, y no lo ve nadie hasta que la página está
   en pantalla»— y decía que la lista «debe coincidir con los tokens de `typography.css`». Nada lo
   verificaba, y `display` nunca llegó a la lista cuando el slice 10 lo añadió. Ahora hay
   `fontSizeMerge.test.ts`, que **lee los `--text-*` de `typography.css`** y comprueba uno por uno
   que sobreviven al desempate. De paso entraron `text-muted` y `highlight` a la lista de colores.

### Decisiones y por qué

1. **Los CTA son enlaces, no `LinkButton`.** Un CTA de portada tiene que abrirse en pestaña nueva,
   copiarse y poder seguirlo un rastreador. `LinkButton` es un `<button>` que empuja con
   `router.push` tras 500 ms artificiales: sirve para el header, no para una portada.

2. **El énfasis viaja dentro del mensaje** (`"…cuidar <em>tu tiempo</em>"` con `t.rich`), no
   partiendo la cadena en el componente. En inglés el énfasis no cae en la misma palabra, y hay una
   prueba por idioma que lo fija.

3. **El rótulo usa el `total` que ya trae la página.** El canvas quería «34 productores activos»;
   con dos tiendas eso delata. Las publicaciones sí son un número real, y la consulta del feed ya
   las contaba: cero lecturas nuevas.

4. **Nada de foto de portada.** No existe el archivo, y un marcador de posición en producción es
   peor que una columna bien compuesta.

5. **Nada de «Ordenar: cercanía».** El docstring de `page.tsx` dice que el home es cronológico por
   contrato —«es un feed: lo que promete es lo último que publicó la comunidad»—. Un selector de
   orden ahí rompería lo que la página promete.

### Archivos tocados

**Nuevos**
- `src/app/(home)/HomeHero.tsx` · `HomeHero.test.tsx`
- `src/presentation/design_system/buttons/buttonVariants.ts`
- `src/presentation/design_system/styling/fontSizeMerge.test.ts`
- `src/e2e/home/home.feature` · `src/e2e/home/homeHero.spec.ts`
- este roadmap y esta bitácora

**Modificados**
- `src/app/[locale]/page.tsx` — monta la portada y el encabezado «Recién publicado»
- `src/presentation/design_system/buttons/Button.tsx` — importa la `cva` en vez de definirla
- `src/presentation/design_system/styling/merge-class-names.ts` — `display`, `text-muted`, `highlight`
- `src/i18n/messages/{es,en}.json` — `home.heroEyebrow` (con plural), `heroTitle` (con `<em>`),
  `browseCta`, `publishCta`; `feed.latestHeading`

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/(home)"` | 3 archivos, **21 pruebas** en verde |
| `pnpm exec vitest --run …/styling` | **11 pruebas** (la regresión nueva) |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (959 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test src/e2e/home` | **4/4 en verde** (2.5 min) |

**Clases en el CSS compilado**: `font-display`, `text-display`, `text-highlight`, `text-body-lg`,
`text-pretty`, `text-label` y el `letter-spacing:.14em`.

**Comprobado contra el servidor de producción**: el `h1` llega con
`font-display text-display …` en su `class` —que era justo lo que se caía— y el e2e mide el tamaño
computado (≥ 40px) y la familia (`newsreader`) en el navegador, no en el `className`.

### Desviaciones del roadmap

Ninguna en alcance. Dos arreglos que el roadmap no anticipaba y que el slice destapó: la mudanza de
`buttonVariants` y la lista de tamaños de `tailwind-merge`. Los dos eran bugs preexistentes o
inmediatos, y los dos quedan con prueba.

### Escrituras en recursos compartidos

La e2e sembró y borró su propia tienda y publicación, como hace siempre (`globalTeardown` falla si
queda algo). Nada más.

### Recap

El home ya no abre en la cuadrícula: se presenta con el rótulo de su comunidad real, un titular a 56
px en la serif de la marca —la primera vez que `--fs-display` y Newsreader llegan a un píxel—, la
entradilla, la firma y dos CTA que son enlaces de verdad. Debajo, el feed se presenta como «Recién
publicado». En el camino aparecieron dos fallos invisibles para el compilador y para Vitest: una
`cva` exportada desde un módulo de cliente que devolvía 500, y un `text-display` que tailwind-merge
descartaba por no estar en su lista; los dos arreglados y los dos con prueba que impide la recaída.

### Próximos pasos (opciones)

1. **Slice 2 — la tarjeta del feed del 5.2**: insignia de pilar sobre la imagen, precio en serif y
   la fila de vendedor + distancia separada por un filete.
2. **Slice 3 del chrome — una sola fila de acciones** en el header, que sigue pendiente.
3. **Las pantallas 5.6–5.9** (pilar, búsqueda, comunidad, acceso), que v2 dejó registradas.
4. **Material de portada**: la foto 4:3, cuando exista el archivo.

---

## Slice 2 — La tarjeta del feed, como el 5.2 (2026-08-21)

### Objetivo

Que la cuadrícula se lea de un vistazo: el pilar donde primero se mira —la foto— y el precio con la
voz que le corresponde.

### El hallazgo: el precio estaba pisado

`CurrencyAmount` ya decidía su apariencia, y su docstring la razona: **serif, tamaño de sección y
tinta**, «porque un precio es un dato que se lee, no una acción que se pulsa» y «cuando todo lo
importante es verde, el verde deja de señalar nada».

`CardForList` le pasaba `className="text-xl text-pw-green"`, que contradecía las dos cosas. Y peor:
`CurrencyAmount` **concatenaba** las clases en vez de usar `cn()`, así que el `class` salía con dos
tamaños de fuente y ganaba el que decidiera el orden del CSS, no el de quien llama. Ahora usa `cn()`
—un override es deliberado y determinista— y la tarjeta deja de pasarle nada.

### Decisiones y por qué

1. **El pilar sale de la categoría raíz, en el dominio.** `publicationPillarForCategory()` es la
   vuelta de `categoryKeyForPublicationPillar`, y se deriva de `PUBLICATION_PILLARS` en vez de
   escribir un segundo mapa a mano: añadir un pilar a la lista lo hace conocido en las dos
   direcciones a la vez.

2. **`null` es la respuesta correcta y frecuente.** Los diez anuncios de la base van sin categoría, y
   `jugos` es una sub-categoría, no una raíz. Ahí la insignia se calla en lugar de inventar un pilar.

3. **El número acompaña siempre al color.** Es la regla que dejó medida
   `pillarPalette.contrast.test.ts` (Movimiento y Mente contrastan 1.14 entre sí como tinta). El
   círculo lo pone `BadgeCounter`, la misma pieza del filtro de pilares, así que los dos se ven
   iguales.

4. **La insignia lleva sombra propia.** Sobre una foto, el par `soft`/`ink` del pilar no tiene su
   fondo garantizado: la imagen puede ser de cualquier color. El fondo de la insignia es lo que le
   devuelve el contraste que su par ya tenía medido.

### Archivos tocados

**Nuevos**
- `src/presentation/post/PillarBadge/PillarBadge.tsx`
- `src/domain/entities/post/publicationPillars.pillarForCategory.test.ts`
- `src/e2e/home/feedCard.spec.ts`

**Modificados**
- `src/domain/entities/post/publicationPillars.ts` — `publicationPillarForCategory`,
  `publicationPillarNumber`
- `src/presentation/post/CardForList/CardForList.tsx` — la insignia sobre la foto; el precio deja de
  pisar al primitivo
- `src/presentation/money/CurrencyAmount/CurrencyAmount.tsx` — `cn()` en vez de concatenar

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 203 archivos, **2191 pruebas** en verde (266s) |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (962 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test src/e2e/home` | **7/7 en verde** (4.8 min) |

El e2e mide la **familia y el color computados** del precio en el navegador (`newsreader`,
`rgb(27, 30, 24)`), no el `className`: era justo ahí donde el override se colaba.

En el HTML del servidor de producción, el home sale con **8 insignias de pilar**, una por
publicación con categoría.

### Nota de entorno

Dos builds fallaron con «Failed to fetch Newsreader from Google Fonts». Es la red, no el código:
`rm -rf .next` tira la caché de `next/font` y sin salida a internet el build no puede rehacerla. Al
recuperarse la conexión compiló sin tocar nada.

### Recap

La tarjeta del feed ya se lee como el 5.2: el pilar va encima de la foto con su número —y se calla
en lo que no tiene pilar—, y el precio recuperó la serif y la tinta que su propio primitivo llevaba
documentando desde el slice 12, y que la tarjeta llevaba pisando con un `text-xl text-pw-green`. De
paso, `CurrencyAmount` dejó de concatenar clases, así que ya no puede haber dos tamaños peleándose
en el `class`.

### Próximos pasos (opciones)

1. **Slice 3 del chrome — una sola fila de acciones** en el header, lo último del 5.1.
2. **Las pantallas 5.6–5.9** (pilar, búsqueda, comunidad, acceso), que v2 dejó registradas.
3. **Material de portada**: la foto 4:3, cuando exista el archivo.

---

## Slice 3 — Todas las secciones toman la escala tipográfica (2026-08-21)

### Objetivo

Que el resto del sitio hable con la misma voz que estrenó la portada, en vez de que cada página
decida su propio tamaño de título.

### Lo que había

**18 títulos de página con 6 tratamientos distintos**: `text-xl font-bold`, `text-2xl font-bold`,
`text-xl` a secas (sin peso), `text-4xl font-black`, `text-4xl sm:text-5xl font-extrabold` y
`text-2xl md:text-3xl font-bold`. En total, 51 encabezados crudos en el árbol frente a 28 archivos
que sí consumían `Heading`: la escala estaba a medio adoptar, que es la peor mitad — existe, y aun
así cada página vuelve a decidir.

### Decisiones y por qué

1. **Todos los títulos públicos pasan a `Heading level={1}`.** El primitivo ya separa nivel de
   tamaño y deduce el tamaño del nivel: `lg` es Newsreader a 40px y peso 400, que es lo que su
   propio docstring reservaba para «lo que la marca afirma».

2. **`/nosotros` y `/habitos` piden `size="display"`.** Son las dos portadas de contenido del sitio
   y ya iban a `text-4xl`/`text-5xl` a mano; ahora piden el tamaño por su nombre.

3. **Los márgenes se conservan.** `mb-2`, `my-4`, `mb-6`, `mb-3`, `mb-4` viajan en `className`: lo
   que cambia es la voz, no la maqueta.

4. **El admin se queda fuera.** El canvas no tiene pantalla de administración, y sus tres páginas
   son tablas densas donde un título de 40px en serif se come una pantalla útil. No es una excepción
   por gusto: es que no están en el alcance del rediseño.

### El spec que llevaba en rojo desde el slice 6

`headingHierarchy.spec.ts` afirmaba «ninguna sección pesa más que el título de la página»
comparando los dos `font-weight` en crudo. **Fallaba con el árbol limpio**, antes de tocar nada
—comprobado con `git stash`—: desde el slice 6 el título va en Newsreader a 400 (una serif editorial
a peso normal se lee como una afirmación, y por eso `lg` perdió su `font-extrabold`) y las secciones
siguen en Plus Jakarta a 700. Un 400 de serif display no es «más ligero» que un 700 de sans: son dos
voces, y el número no las compara.

El spec contradecía la decisión que el propio design system había tomado, así que cambió de
instrumento sin cambiar de intención: ahora afirma que el título **es más grande y habla con la voz
de la marca**, mientras la sección habla con la de la interfaz. Es la regla del slice 6 hecha
verificable.

### Archivos tocados

16 páginas y componentes de `src/app/[locale]/` —`buscar`, `categoria` (×2), `cuenta` (×2),
`cuenta/agenda` (×2), `directorio`, `editar`, `eventos` (×2), `habitos`, `nosotros`, `not-found`,
`page/[page]`, `productos` (×2), `publicar`— más `src/e2e/design-system/headingHierarchy.spec.ts`.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 203 archivos, **2191 pruebas** en verde |
| `pnpm run typecheck` · `lint` | limpios (962 archivos) |
| `pnpm run build` | compila; `/`, `/productos`, `/buscar`, `/eventos`, `/nosotros` responden 200 |
| `pnpm exec playwright test src/e2e/design-system` | **6/6 en verde** |

Medido en el navegador: `/productos` y `/buscar` dan `40px`, `Newsreader`, peso `400`. Y
`grep '<h1' src/app/[locale]` fuera de admin devuelve **cero**.

### Nota de entorno

`notFound.spec.ts` cayó con «Connection terminated due to connection timeout» contra la base
compartida, en la misma ventana en que fallaron dos builds por no poder bajar las fuentes de Google.
Es la red, no el código.

### Recap

El sitio entero habla ya con una sola voz tipográfica: dieciocho títulos que decidían su tamaño uno
por uno pasan a pedirlo por su nombre, y no queda un solo `<h1>` crudo en las páginas públicas. De
paso salió a la luz un spec que llevaba rojo desde el slice 6 porque comparaba pesos entre dos
tipografías distintas; ahora verifica la regla que el design system sí tomó — el título es más
grande y habla con la voz de la marca.

### Próximos pasos (opciones)

1. **Los 33 encabezados crudos que quedan** (`h2`/`h3`/`h4` dentro de páginas y componentes), para
   cerrar la adopción de la escala.
2. **Las pantallas 5.6–5.9** (pilar, búsqueda, comunidad, acceso), que v2 dejó registradas.
3. **Slice 4 del chrome** — el filtro de pilares subido a la barra, junto a la ubicación.

---

## Slice 4 — El resto de la escala: h2, h3 y h4 (2026-08-21)

### Objetivo

Cerrar la adopción de la escala tipográfica. El slice 3 dejó los títulos de página; quedaban 33
encabezados de sección decidiendo su tamaño uno por uno.

### Lo que había

45 `h2`/`h3`/`h4` crudos fuera de admin, con toda la gama: `text-body-lg font-bold`, `text-lg
font-bold`, `text-base font-bold`, `text-xl font-black`, `text-2xl font-black`, `text-3xl
font-extrabold`, `text-3xl sm:text-4xl font-bold`, y un `md:tex-3xl` **que no existe** —le falta una
letra—, así que ese encabezado nunca tuvo el tamaño que su autor creyó darle. Es el mismo hallazgo
del slice 13 del design system: en Tailwind v4 una clase mal escrita no falla, desaparece.

### El hueco del primitivo, y por qué había que taparlo

Tres encabezados no se podían convertir: el del pie, el del jardín de la comunidad y el de la lista
de celebraciones son **rótulos en versalitas** —estructuralmente encabezados, visualmente etiquetas
de 12px—. El tamaño más pequeño de `Heading` es `xs` (18px), así que adoptarlo los habría agrandado
y roto el diseño. Se quedaban fuera, y una escala a medio adoptar es la peor mitad: existe, y aun
así cada sitio vuelve a decidir.

El patrón ya estaba repetido a mano en **cinco** sitios —el pie, el jardín, la barra «cerca de ti»,
la portada del home y el hero de cada pilar—, cada uno con su tamaño y su `tracking`. Así que
`Heading` estrena `size="eyebrow"` (`text-caption uppercase tracking-[0.14em] font-semibold`), sin
color: un rótulo es verde en el jardín y apagado en el pie, y esa diferencia es de la sección, no
del tamaño.

### El que el grep no vio

`PillarHero` no usa `<h2>` sino una etiqueta dinámica (`const Title = level === 1 ? "h1" : "h2"`),
así que se había escapado del barrido — y llevaba `text-3xl sm:text-5xl font-black` escrito a mano.
El docstring de `Heading` dice, literalmente, que `display` y `lg` van en Newsreader porque son «la
portada, **el nombre de un pilar**». El nombre de un pilar era justo lo que seguía en sans a peso
900. Ahora pide `size="display"` y el nivel lo sigue decidiendo quien llama.

### Decisiones y por qué

1. **`font-black` y `font-extrabold` desaparecen.** Los pesos los decide la escala; nueve
   encabezados de hábitos los traían a mano.
2. **`text-text-strong`, los tonos de pilar y los de marca se conservan** con `tone="inherit"`: son
   tokens de tinta, no de tamaño, y `Heading` ya tiene la puerta para eso.
3. **Los márgenes y el `flex items-center gap-*` viajan en `className`.** Cambia la voz, no la maqueta.
4. **El admin sigue fuera**, por lo mismo que el slice 3: no está en el alcance del rediseño.

### Archivos tocados

21 archivos: `carrito`, `pedido` (×2), `cuenta` (×2), `tienda`, `[slug]/SlotPicker`, `habitos`,
`nosotros` (10 encabezados), `not-found` (los dos, dentro y fuera de `[locale]`),
`PilaresOverviewPage`, `OrderHistory`, `Card`, `EventAttendeeList`, `StoresMap`, `RouteMap`,
`Footer`, `CommunityHabitGarden`, `HabitChallengeCelebrations`, `HabitChallengePanel`,
`PillarPracticeSection`, `PublicHabitCelebrationList`, `PillarHero`; más `Heading.tsx` y su prueba.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | 203 archivos, **2193 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (962 archivos) |
| `pnpm run build` | compila; `/`, `/nosotros`, `/pilares`, `/habitos`, `/carrito`, `/productos` a 200 |
| `pnpm exec playwright test design-system pilares about notFound` | **21/21 en verde** |

`grep '<h2\|<h3\|<h4'` fuera de admin y de pruebas devuelve **cero**.

Medido en el navegador, la cascada quedó coherente:

| Ruta | Encabezados |
| --- | --- |
| `/nosotros` | 56 Newsreader → 40 Newsreader → 26 sans → 20 sans → 18 sans |
| `/pilares/sueno` | 56 Newsreader (el nombre del pilar) → 26 → 20 |
| `/pilares` | 56 Newsreader → 20 ×4 (las cuatro tarjetas) |

### Recap

La escala está adoptada de punta a punta: no queda un solo encabezado crudo en las páginas públicas.
El primitivo ganó el tamaño que le faltaba —el rótulo en versalitas, que estaba escrito a mano en
cinco sitios— y `PillarHero`, que se había escapado del barrido por usar una etiqueta dinámica, por
fin nombra los pilares con la serif que el propio design system les había reservado.

### Próximos pasos (opciones)

1. **Las pantallas 5.6–5.9** (pilar, búsqueda, comunidad, acceso), que v2 dejó registradas.
2. **Slice 4 del chrome** — el filtro de pilares subido a la barra, junto a la ubicación.
3. **El admin**, si se decide meterlo en el alcance del rediseño.

---

## Slice 4 — La portada enseña lo último publicado (2026-08-22)

### Objetivo

Llenar el hueco que el canvas reservaba para una «foto de portada, mercado local, 4:3» que no existe
como archivo.

### La decisión

En vez de un marcador de posición —o de esperar a que alguien haga la foto—, la portada enseña **la
publicación más reciente**: su imagen, su título y un enlace a ella. Es una foto real, cambia sola
conforme la comunidad publica, y **demuestra** la promesa del titular en lugar de ilustrarla. Hoy es
«Sesión de yoga para dolor de espalda, principiantes».

`posts[0]` es siempre la última porque el home es cronológico por contrato, así que no hace falta
ninguna consulta nueva: la portada usa lo que la página ya había traído para el feed.

Se repite justo debajo, en la primera tarjeta. Esa repetición es el punto, no un descuido: lo primero
que se ve al entrar es lo último que alguien subió.

### Tres cosas que solo se vieron mirando

1. **El enlace se iba del sitio.** `to` llega **absoluto** desde el mapper (`createAbsoluteUrl`),
   que es lo que hace falta para compartir; como destino interno hacía recargar la página entera, y
   en local apuntaba a producción. Se usa el slug, igual que `CardForList` para su enlace de edición.

2. **La foto no salía.** El marco estaba vacío: había un `<div>` dentro de un `<span>` —anidación
   inválida— y el navegador saca el `div` fuera del contenedor. `MediaContent` envuelve en `div` y
   `ImageWithSkeleton` en un `span` más, así que posicionar desde fuera no llega: el alto tiene que
   viajar **hasta la imagen**. Es lo que el propio docstring de `MediaContent` ya decía —«quien lo
   pinta lo acompaña de un alto fijo que recorta con `object-cover`»— y es como lo hace `CardForList`.

3. **`transition-transform` borraba el esqueleto.** `ImageWithSkeleton` pone `transition-opacity`
   para apagar su animación de carga, y `cn` desempata entre las dos porque son la misma familia: la
   imagen aparecía de golpe. Ahora es `transition-[opacity,transform]`, que cubre las dos.

### Hallazgo fuera de alcance: `priority` no hace nada

Comprobando que la portada se adelantara, apareció que **ninguna imagen del sitio emite
`fetchpriority="high"`** — ni la de la portada, ni la galería de una ficha, ni el logo del header,
que pasa `priority` **directo a `next/image`** sin intermediarios. Medido sobre el HTML del servidor
de producción: 13 imágenes en `/suero-natural`, cero con `fetchpriority`.

No lo introduce este slice y no se arregla aquí: es rendimiento, afecta a las seis llamadas que ya
pasaban `priority`, y huele a cambio de contrato de `next/image` en Next 16. Queda anotado como
slice propio.

### Archivos tocados

- `src/app/(home)/HomeHero.tsx` · `HomeHero.test.tsx` (13 pruebas)
- `src/app/[locale]/page.tsx` — pasa `posts[0]`
- `src/i18n/messages/{es,en}.json` — `home.coverLabel`
- `src/e2e/home/homeHero.spec.ts` — la portada lleva de verdad a esa publicación

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/(home)"` | 3 archivos, **25 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (966 archivos) |
| `pnpm run build` | compila |
| `pnpm exec playwright test src/e2e/home` | **8/8 en verde** |

Medido en el navegador: la imagen ocupa 501×288 en escritorio y 356×256 en teléfono, y el enlace es
`/sesion-de-yoga-para-dolor-de-espalda-principiantes` — relativo, no absoluto.

### Recap

El hueco de la portada lo llena ahora lo último que publicó la comunidad, sin inventar un archivo
que no existe y sin pagar una consulta nueva. Tres fallos aparecieron solo al mirar la pantalla —un
enlace que se salía del sitio, una anidación inválida que dejaba el marco vacío y una clase que
borraba la animación del esqueleto— y ninguno lo habría visto un test de componente.

### Próximos pasos (opciones)

1. **El bottom nav de cinco pestañas** (5.1, móvil).
2. **El atajo ⌘K** del buscador.
3. **La búsqueda facetada** del 5.7.
4. **`priority` no emite `fetchpriority`**: seis llamadas afectadas, ninguna imagen priorizada.
