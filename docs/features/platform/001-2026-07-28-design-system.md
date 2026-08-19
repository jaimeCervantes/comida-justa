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
