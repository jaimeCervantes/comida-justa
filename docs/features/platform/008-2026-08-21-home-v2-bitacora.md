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
