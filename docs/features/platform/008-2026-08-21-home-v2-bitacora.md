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
