# Design System — primitivos, tokens y la paleta de los cuatro pilares

> Este documento retoma un trabajo que ya empezó. Los slices 1 y 2 están en
> `docs/features/platform/001-2026-07-28-design-system-bitacora.md` (Biome + `cva` + `Button`; y la capa de tokens CSS).
> El roadmap de abajo continúa la numeración desde el **slice 3**.

## Context

### Problem

El design system tiene cimientos pero no tiene catálogo. Hoy son **5 componentes** —`Button`,
`TextField`, `TextArea`, `InputShell`, `FieldLabel`, `FieldHelper`— más `cn()` y tres archivos de
tokens. Todo lo demás se resuelve a mano en cada pantalla, y ya se nota:

- **Tres insignias que son la misma insignia.** `SoldOutBadge.tsx:22`, `ProvenanceBadge.tsx:42` y
  `CategoryTag.tsx:21` pintan el mismo chip (`inline-flex items-center rounded-full px-3 py-1
  text-sm`) con tres colores distintos y dos pesos de fuente distintos, sin compartir una línea.
- **Los tokens existen y nadie los usa.** `layout.css` define `--radius-*` y `--shadow-*`, pero hay
  **71 usos de `rounded-*` repartidos en 31 archivos** decidiendo el radio archivo por archivo.
- **Storybook está instalado y vacío.** `@storybook/nextjs-vite` configurado, **4 stories** en total
  (`Button`, `TextField`, `ImageVideoPicker`, `MediaContent`). Lo que no se ve, se vuelve a escribir.
- **La marca no gobernaba su propio discurso.** Los cuatro pilares son el eje narrativo del sitio y
  sus colores estaban repartidos entre clases crudas de Tailwind y tokens de marca. El slice 3 los
  convirtió en rampas semánticas; el ajuste posterior documentado en
  `docs/features/wellbeing/002-2026-08-10-colores-pilares-vivos.md` recuperó el violeta y el azul que identificaban mejor a
  Sueño y Mente/Espíritu.
- **El contraste no está garantizado en ninguna parte.** Cada componente decide su color y su modo
  oscuro por su cuenta, sin que nada verifique que la combinación sea legible.

### Savings

Un chip que hoy se reescribe en cada pantalla pasa a ser una variante. El modo oscuro y el contraste
se resuelven **una vez, en el token**, en lugar de una vez por componente y sin red. Storybook deja
de ser un adorno y pasa a ser el catálogo que evita la cuarta insignia.

### Why

Los cuatro pilares —Sueño, Alimentación, Movimiento, Mente y Espíritu— son lo que Hazlo Sano tiene
que decir. Si la mitad de su paleta viene por defecto de una librería de utilidades, el sitio no está
comunicando una marca: está mostrando el CSS que tenía a la mano.

---

## La paleta: marca y colores reconocibles

El `public/logo.svg` tiene **dos tonos** y negro:

| Elemento del logo | Hex | Token existente |
| --- | --- | --- |
| Círculo contenedor y nombre | `#f0380e` | `--brand-orange` |
| Corazón | `#538f39` | `--brand-green` |
| Texto | `#000000` | `--brand-black` |

Cuatro pilares necesitan cuatro tonos distinguibles. Alimentación y Movimiento conservan tonos
derivados de la marca; Sueño y Mente/Espíritu recuperan los colores vivos que los identificaban antes
de la primera tokenización.

| # | Pilar | Semilla | Origen |
| --- | --- | --- | --- |
| 1 | Sueño | `#8b5cf6` | Violeta anterior |
| 2 | Alimentación | `#f0380e` | `--brand-orange` (del logo) |
| 3 | Movimiento | `#5dbf17` | `--brand-lightgreen` |
| 4 | Mente y Espíritu | `#38bdf8` | Azul cielo anterior |

### Por qué un token por pilar no alcanza

Las semillas de marca **no se pueden usar como color de texto**. Medido contra WCAG 2.1:

| Pilar | Semilla | Texto s/ blanco | Blanco s/ semilla |
| --- | --- | --- | --- |
| Sueño | `#8b5cf6` | 4.23 ⚠️ solo texto grande | 4.23 ⚠️ |
| Alimentación | `#f0380e` | 3.98 ⚠️ solo texto grande | 3.98 ⚠️ |
| Movimiento | `#5dbf17` | **2.35 ❌** | **2.35 ❌** |
| Mente y Espíritu | `#38bdf8` | **2.14 ❌** | **2.14 ❌** |

Varios tonos vivos no sirven directamente como tinta sobre claro ni aguantan blanco encima. Por eso
cada pilar es una **rampa de tres papeles**, derivada de la semilla conservando su matiz y ajustando
la luminosidad hasta cruzar 4.5:1:

| Papel | Qué es | Contra qué se mide |
| --- | --- | --- |
| `--pillar-<k>-solid` | Relleno saturado: insignia sólida, número del pilar | texto blanco encima ≥ 4.5 |
| `--pillar-<k>-soft` | Tinte de fondo del chip tenue y de las superficies del pilar | — |
| `--pillar-<k>-ink` | Tinta: texto, iconos, bordes sobre `soft` | sobre `soft` ≥ 4.5 |

Valores resueltos (modo claro):

| Pilar | `soft` | `ink` | contraste ink/soft | `solid` | blanco/solid |
| --- | --- | --- | --- | --- | --- |
| Sueño | `#f5f3ff` | `#7c3aed` | 5.20 ✅ | `#7c3aed` | 5.70 ✅ |
| Alimentación | `#fde3dd` | `#c52e0b` | 4.57 ✅ | `#dd340d` | 4.59 ✅ |
| Movimiento | `#e8f6df` | `#3c7b0f` | 4.64 ✅ | `#408410` | 4.64 ✅ |
| Mente y Espíritu | `#f0f9ff` | `#0369a1` | 5.57 ✅ | `#0369a1` | 5.93 ✅ |

En modo oscuro la rampa se invierte: la tinta recupera una variante brillante y la superficie se
oscurece. Sueño usa `#c4b5fd` sobre `#2e1065`; Mente/Espíritu recupera el azul `#38bdf8` sobre
`#0c2a3b`.

### La advertencia que el cálculo dejó por escrito

Como **tinta**, Movimiento (`#3c7b0f`) y Mente (`#0369a1`) tienen contraste **1.14 entre sí**: son
casi idénticos en luminosidad y solo los separa el tono (95° contra 45°). Consecuencia de diseño, no
negociable: **el color nunca puede ser el único portador del significado de un pilar.** Siempre va
acompañado de su número o su etiqueta. Un lector con deuteranopia debe poder distinguirlos sin el
tono, y con el número puede.

---

## Roadmap de slices

### Slice 3 — El chip deja de escribirse tres veces ✅

**Alcance.** El primitivo `Badge` en el design system, con variantes por token, y la rampa de los
cuatro pilares en `colors.css`. Las tres insignias existentes pasan a ser configuraciones de `Badge`
sin cambiar lo que el visitante ve. Storybook estrena selector de tema para poder mirar claro y
oscuro lado a lado.

**Criterios de aceptación.**
- `SoldOutBadge`, `ProvenanceBadge` y `CategoryTag` no contienen ni una clase de Tailwind propia;
  delegan en `Badge`. Sus tests actuales siguen verdes sin tocarlos.
- `Badge` vive en `src/presentation/design_system/` y **no** importa de `~/domain`, `~/use_cases` ni
  `~/app`; recibe su texto como `children` y nunca llama a `useTranslations`.
- Los tokens `--pillar-*` existen en `colors.css` con sus tres papeles y su bloque oscuro.
- Hay una story de `Badge` con todas las variantes y una story de documentación de la paleta.

### Slice 4 — Los pilares estrenan su paleta

**Alcance.** `pilaresData.ts` y `pillarColorClasses` dejan de mezclar utilidades crudas con tokens y
pasan a consumir `--pillar-*`. Las cuatro páginas de pilar y la portada de `/pilares` adoptan la
rampa.

**Criterios de aceptación.** Ninguna clase `violet-*` ni `sky-*` sobrevive en `src/app/[locale]/pilares/`;
cada pilar se pinta con su token; el número del pilar acompaña siempre al color.

### Slice 5 — Superficie y tarjeta

**Alcance.** Un primitivo `Surface` (radio, elevación, borde, fondo, todo por token) del que cuelgan
`Card`, `CardForList` y `StoreSummaryCard`. Ataca directamente los 71 `rounded-*` sueltos.

### Slice 6 — La tipografía deja de ser `text-sm` a mano

**Alcance.** `Heading` y `Text` atados a `typography.css`. Hoy los tokens `--fs-*` no los consume
nadie.

### Slice 7 — Estado y retroalimentación

**Alcance.** `Skeleton`, `Alert` y un token de anillo de foco visible y consistente.

### Slice 8 — La mampostería se reparte en el cliente ✅

**Alcance.** `MasonryColumns`: el reparto voraz y estable que sustituyó a la multi-columna de CSS en
el feed del home, para que cargar más dejara de mover lo ya visto. Sus escenarios viven en
`src/e2e/design-system/design-system.feature` (`@slice-8`); este documento no lo había recogido.

### Slice 9 — El primer pintado ya trae el ancho correcto

**El fallo, reportado desde un teléfono.** El home abre con el feed en varias columnas apretadas y
de golpe se convierte en una sola. El brinco no es un parpadeo de estilos: es el reparto cambiando.

**Por qué pasa.** `MasonryColumns` arranca en `SERVER_COLUMNS = 3` porque el servidor no tiene ancho
que medir, y corrige en `useLayoutEffect`. Ese `useLayoutEffect` solo protege los renders
**posteriores a la hidratación**: el primer pintado es el HTML del servidor, que el teléfono dibuja
en cuanto llega y mucho antes de que baje y corra el JavaScript. Se comprueba pidiendo la página:

```bash
curl -s http://localhost:3000/ | grep -o 'masonry-column' | wc -l   # → 3
```

Tres columnas escritas en el HTML, en una pantalla donde solo cabe una. Los demás listados
—productos, categoría, buscar, tienda, perfil— no tienen el problema porque usan `CARD_MASONRY`,
multi-columna de CSS pura: el navegador la resuelve en el primer pintado, sin scripts. Esa es la
pista y también el arreglo.

**Alcance.** `MasonryColumns` deja de inventar un número de columnas. Antes de medir se pinta con
`CARD_MASONRY` —la misma multi-columna que ya usan los otros listados—, y solo cuando tiene ancho y
alturas reales cambia al reparto voraz de columnas en flex. El reparto en sí, su estabilidad al
cargar más y el orden de las tarjetas no se tocan: sigue siendo el del slice 8.

En un teléfono las dos maquetaciones dan exactamente lo mismo —una columna, en orden de documento—,
así que el cambio no se ve. En escritorio el número de columnas ya es el correcto desde el primer
píxel, porque `columns-[300px] gap-4` y `columnsFor()` son la misma fórmula sobre los mismos
números; lo único que se reacomoda al medir es en qué columna cae cada tarjeta, que es lo que ya
ocurría.

**Criterios de aceptación.**
- Con JavaScript deshabilitado y una ventana de 390px, todas las tarjetas del home comparten el
  borde izquierdo y ocupan el ancho del contenedor: una sola columna.
- Con JavaScript deshabilitado y una ventana de 1280px, las tarjetas se agrupan en 3 posiciones
  horizontales distintas.
- El render inicial de `MasonryColumns` —sin ancho ni alturas— no contiene ningún
  `data-testid="masonry-column"`; contiene el contenedor con la multi-columna de CSS.
- Con ancho y alturas medidos, `MasonryColumns` vuelve a repartir en columnas de flex como hoy.
- `MIN_COLUMN_WIDTH` y `GAP` no pueden separarse de la clase CSS del primer pintado: hay un test que
  falla si alguien cambia uno de los dos lados.
- Los tests que ya existen sobre el feed (`PostsWithLoadMore.test.tsx`) siguen verdes sin tocarlos,
  incluido el que afirma que la tarjeta ya pintada no se vuelve a montar al cargar más.

---

# v2 — «Del CSS que había a una marca que crece»

**Fuente:** `Hazlo Sano — Sistema de diseño v2` (canvas de Claude Design), secciones 01–07.
**Acordado el 2026-08-19:** fundación + pantallas clave. **La UX nueva de la sección 05 queda
fuera** — ⌘K, barra fija de pilar+distancia, bottom nav de 5 pestañas, cola offline y el asistente
de tres pasos de `/publicar`. Esto es repintado: ningún recorrido cambia, ningún spec e2e vigente
se edita.

## Por qué hay un v2

Los slices 1–9 dejaron los cimientos correctos y nada de eso se tira: tokens semánticos, `cva`, la
rampa de tres papeles por pilar, el anillo de foco único, la mampostería estable. Lo que no
resolvieron es que **el sitio no se ve de nadie**:

- Los neutrales son `slate`. Un gris azulado junto a un verde y un naranja cálidos los apaga: la
  marca compite con el fondo en vez de apoyarse en él.
- La tipografía es Inter para todo. Correcta y sin voz — la misma que la mitad de la web.
- `layout.css` define `--radius-*` y **deliberadamente no los expone**, porque coinciden con la
  escala de Tailwind y exponerlos no añadía nada. El resultado previsto por ese mismo comentario:
  71 `rounded-*` sueltos decidiendo cada uno por su cuenta (`rounded-full` ×56, `lg` ×44, `2xl` ×39,
  `3xl` ×12, `xl` ×10, `sm` ×9, `md` ×8, y un `4xl` solitario).

Y una deuda que los slices anteriores no vieron. El slice 3 midió la rampa de los **pilares** y la
dejó blindada con un test; nunca midió la de la **marca**:

| Uso | Par | Medido | AA |
| --- | --- | --- | --- |
| 28 botones `bg-pw-green text-white` | `#ffffff` sobre `#538f39` | **3.92** | ✕ |
| 57 usos de `text-pw-green` | `#538f39` sobre el fondo | **3.67** | ✕ |

`#538f39` es el corazón del logo. Identifica bien y rellena mal. v2 lo conserva como semilla y baja
dos pasos de luminosidad —sin mover matiz— para el relleno: `#3f6f2a`, que da **5.97** con blanco.

## Lo que el documento propone y no cumple

Dos tokens de la fuente no pasan la medición. Entran corregidos, y queda escrito porque es un
apartarse deliberado de la fuente: **la fuente manda en la intención, la medición manda en el valor.**

| Token | Propuesto | Medida | Da | Mínimo | Entra como | Cumple |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-muted` | `#8a9480` | texto de 11px sobre `#faf7f1` | 2.96 | 4.5 | `#6b7562` | 4.52 |
| `--border-field` | `#c9c0ac` | límite de campo sobre `#ffffff` | 1.81 | 3.0 (WCAG 1.4.11) | `#8f8c78` | 3.39 |

El primero es el `mono` en versalitas que el documento usa para casi todas sus etiquetas pequeñas.
El segundo es el borde de los campos: un límite de control **sí** cae bajo «Non-text Contrast», a
diferencia de un separador decorativo, que puede quedarse en `#e3ddce`.

Tres cifras de las anotaciones tampoco cuadran al medirlas. No cambian ninguna decisión —las tres
siguen cumpliendo AA— pero el repo se queda con la medida, no con la anotación:

| Anotación dice | Medido | Par |
| --- | --- | --- |
| 5.89 | **5.97** | `#ffffff` sobre `#3f6f2a` |
| 8.4 | **6.32** | `#0d1109` sobre `#6ba34a` (oscuro) |
| 6.1 | **5.50** | `#5c6857` sobre `#faf7f1` (la fuente lo midió sobre blanco) |

## Roadmap v2

### Slice 10 — La piel: neutrales cálidos y un verde que aguanta blanco

**Alcance.** Solo la capa de tokens y la carga de fuentes. Ningún componente se edita: como todo el
árbol ya consume los tokens semánticos, el sitio entero cambia de piel con este slice.

- `colors.css` — neutrales cálidos en los tres bloques (claro, `prefers-color-scheme`, `data-theme`);
  la marca gana `--brand-green-600` (semilla `#538f39`), `--brand-green-700` (`#3f6f2a`, relleno),
  `--brand-green-800` (`#355d23`, hover) y `--brand-green-900` (`#2f5320`, tinta sobre chip verde);
  `--brand-green` pasa a apuntar al relleno, que es lo que arregla los 85 usos de golpe. Entran los
  tonos de aviso (`success`/`warning`/`error` con su par fondo+tinta) y `--text-muted`,
  `--border-field`.
- `layout.css` — la escala de radio se expone **con nombre propio**: `rounded-chip` (8px),
  `rounded-control` (12px), `rounded-card` (18px), `rounded-panel` (26px). No sobrescribe
  `rounded-sm/md/lg`: nada cambia hasta que un componente lo pida. Sombras con verde
  (`rgba(31,40,24,…)`), `--duration-base` 300→260ms y `--ease-natural`.
- `typography.css` — `--font-display` y `--font-ui` como tokens.
- `layout.tsx` — Newsreader + Plus Jakarta Sans vía `next/font`; Inter se retira.

**Criterios de aceptación.**
- `brandPalette.contrast.test.ts` (nuevo) lee `colors.css` y mide **todo relleno de marca contra su
  texto**, en claro y en oscuro. Falla si alguien reintroduce un par por debajo de 4.5.
- `darkThemeParity.test.ts` sigue verde **sin editarse**: las dos copias del bloque oscuro siguen
  siendo idénticas declaración por declaración.
- `pillarPalette.contrast.test.ts` sigue verde sin editarse — la rampa de los pilares no se toca, y
  su prueba de «la tinta destaca sobre el fondo de la página» ahora mide contra el papel nuevo.
- `radiusScale.test.ts` (nuevo) verifica que las cuatro utilidades existen y que la escala de
  Tailwind no quedó sobrescrita.
- Ningún archivo bajo `src/app/` ni `src/presentation/` fuera de `tokens/` cambia en este slice.

### Slice 11 — Los primitivos hablan v2 ✅

Ninguna API cambia de nombre; cambian los valores de las variantes de `cva`. `Button` repunta su
relleno al token y sube `md`/`lg` al mínimo táctil de 44px; `Badge` gana el número del pilar dentro
de la insignia y una variante sólida; `Surface` estrena `radius: card | panel`; `InputShell` pasa al
radio de control y al borde de campo; `Alert` y `Skeleton` adoptan los tonos cálidos.

**Lo que el slice enseñó y no estaba en el plan.** Tres cosas, todas por el mismo motivo: un token
sin consumidor no arregla nada, y al buscarle consumidor aparece la deuda real.

1. **El color se pide como par, no como relleno.** El plan decía «repuntar el relleno al token».
   No basta: en oscuro el relleno se aclara y lo que va encima es tinta oscura, no blanco. Un
   `bg-button-primary-bg text-white` habría estado mal en la mitad de los casos. Los botones piden
   ahora el par entero, que es lo que `brandPalette.contrast.test.ts` mide.
2. **El número del pilar necesitaba un consumidor de verdad.** Un `counter` en `Badge` que nadie
   usara habría repetido el error que este repo ya documentó con los tokens del slice 2. El
   consumidor natural —el filtro de pilares— es un enlace, no un chip, así que el círculo se extrajo
   como `BadgeCounter` y el número dejó de estar implícito en el orden de `PUBLICATION_PILLARS`.
3. **Los tres tonos base del `Badge` eran anteriores a los tokens.** `neutral` pintaba con
   `gray-200`/`gray-700` crudos —un gris azulado sobre el papel cálido— y `brand`/`accent` usaban
   una opacidad sobre el color de marca, que hace el contraste imposible de medir. Pasan al par
   `soft`/`ink` como los pilares, y pierden sus variantes `dark:`.

### Slice 12 — Header, feed y el último verde que hacía de tinta ✅

Se planeó como repintado y destapó la última deuda de contraste del sistema. El slice 10 arregló
`--brand-green`; la marca tiene **dos** semillas, y la segunda arrastraba el mismo error:

| Uso | Par | Medido | AA |
| --- | --- | --- | --- |
| 26 usos de `text-pw-lightgreen` (enlaces, precios, hovers) | `#5dbf17` sobre el papel | **2.35** | ✕ |
| «Cargar más» del home | blanco sobre `#5dbf17` | **2.35** | ✕ |
| Página actual de la paginación | blanco sobre `#5dbf17` | **2.35** | ✕ |

`CurrencyAmount` era el peor: **todos los precios del sitio** a 2.35:1. El token correcto ya existía
—`--highlight`, que resuelve a `#3f6f2a` en claro y al vivo en oscuro— y solo le faltaba una utilidad
para poder usarse. Los dos controles pasan al par primario.

Además, el barrido de neutrales: **cero grises crudos de Tailwind en producción** (eran 69 archivos)
y cero `dark:` escritas a mano en el chrome. Un `text-gray-600 dark:text-gray-400` es un gris azulado
sobre papel cálido *y* una pareja que hay que acordarse de mantener; `text-text-support` es las dos
cosas resueltas.

### Slice 13 — Publicar, detalle y tienda

Igual: repintado. El asistente de tres pasos de la sección 5.3 queda fuera por acuerdo.

## Fuera de alcance (registrado, no descartado)

De la sección 05–06 del documento, para un roadmap posterior si se decide: atajo ⌘K, barra fija de
pilar+distancia, bottom nav móvil, «Avísame cuando haya» en agotados, cola offline optimista,
deshacer con 8s en vez de diálogo de confirmación, y las pantallas 5.6–5.9 (pilar, búsqueda,
comunidad, acceso).

---

## Verificación

```bash
pnpm run test:run      # Vitest: Badge y las tres insignias migradas
pnpm run typecheck     # tsc
pnpm run lint          # biome check .
pnpm run check:i18n    # ningún literal en español se coló en un componente
pnpm run storybook     # catálogo visual, claro y oscuro
```

El contraste de cada par de la rampa está verificado numéricamente en `Badge.contrast.test.ts`: si
alguien cambia un hex y rompe AA, el test lo dice antes que un usuario.
