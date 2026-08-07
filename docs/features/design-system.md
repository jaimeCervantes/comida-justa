# Design System — primitivos, tokens y la paleta de los cuatro pilares

> Este documento retoma un trabajo que ya empezó. Los slices 1 y 2 están en
> `docs/features/design-system-bitacora.md` (Biome + `cva` + `Button`; y la capa de tokens CSS).
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
- **La marca no gobierna su propio discurso.** Los cuatro pilares son el eje narrativo del sitio y
  `pilaresData.ts:20-49` le da a dos de ellos colores genéricos de Tailwind (`violet #8b5cf6`,
  `sky #38bdf8`). Peor: `pillarColorClasses:59-92` mezcla los dos idiomas dentro del mismo objeto
  —`text-violet-600 dark:text-violet-400` conviviendo con `text-pw-orange`—. Y
  `--brand-lightorange: #f2b705` está definido en los tokens **sin un solo uso**.
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

## La paleta: extender la marca, no inventarla

El `public/logo.svg` tiene **dos tonos** y negro:

| Elemento del logo | Hex | Token existente |
| --- | --- | --- |
| Círculo contenedor y nombre | `#f0380e` | `--brand-orange` |
| Corazón | `#538f39` | `--brand-green` |
| Texto | `#000000` | `--brand-black` |

Cuatro pilares necesitan cuatro tonos distinguibles, así que la paleta **extiende** la marca: tres de
los cuatro salen de tokens que ya existen y solo Sueño estrena tono.

| # | Pilar | Semilla | Origen |
| --- | --- | --- | --- |
| 1 | Sueño | `#4c4a8f` | **Nuevo** — índigo nocturno |
| 2 | Alimentación | `#f0380e` | `--brand-orange` (del logo) |
| 3 | Movimiento | `#5dbf17` | `--brand-lightgreen` |
| 4 | Mente y Espíritu | `#f2b705` | `--brand-lightorange` (existía sin uso) |

### Por qué un token por pilar no alcanza

Las semillas de marca **no se pueden usar como color de texto**. Medido contra WCAG 2.1:

| Pilar | Semilla | Texto s/ blanco | Blanco s/ semilla |
| --- | --- | --- | --- |
| Sueño | `#4c4a8f` | 7.83 ✅ | 7.83 ✅ |
| Alimentación | `#f0380e` | 3.98 ⚠️ solo texto grande | 3.98 ⚠️ |
| Movimiento | `#5dbf17` | **2.35 ❌** | **2.35 ❌** |
| Mente y Espíritu | `#f2b705` | **1.82 ❌** | **1.82 ❌** |

El ámbar y el verde vivo fallan por mucho en ambas direcciones: ni sirven de tinta sobre claro ni
aguantan blanco encima. Por eso cada pilar es una **rampa de tres papeles**, derivada de la semilla
conservando su tono y su saturación, y bajando o subiendo la luminosidad hasta cruzar 4.5:1:

| Papel | Qué es | Contra qué se mide |
| --- | --- | --- |
| `--pillar-<k>-solid` | Relleno saturado: insignia sólida, número del pilar | texto blanco encima ≥ 4.5 |
| `--pillar-<k>-soft` | Tinte de fondo del chip tenue y de las superficies del pilar | — |
| `--pillar-<k>-ink` | Tinta: texto, iconos, bordes sobre `soft` | sobre `soft` ≥ 4.5 |

Valores resueltos (modo claro):

| Pilar | `soft` | `ink` | contraste ink/soft | `solid` | blanco/solid |
| --- | --- | --- | --- | --- | --- |
| Sueño | `#e6e6ef` | `#4c4a8f` | 6.30 ✅ | `#4c4a8f` | 7.83 ✅ |
| Alimentación | `#fde3dd` | `#c52e0b` | 4.57 ✅ | `#dd340d` | 4.59 ✅ |
| Movimiento | `#e8f6df` | `#3c7b0f` | 4.64 ✅ | `#408410` | 4.64 ✅ |
| Mente y Espíritu | `#fdf5dc` | `#8e6b03` | 4.53 ✅ | `#936f03` | 4.65 ✅ |

En modo oscuro la rampa se invierte: la semilla vuelve a ser legible sobre `#0d0d0d` (Movimiento
8.26, Mente 10.69, Alimentación 4.88) y solo Sueño necesita aclararse a `#7674b7`.

### La advertencia que el cálculo dejó por escrito

Como **tinta**, Movimiento (`#3c7b0f`) y Mente (`#8e6b03`) tienen contraste **1.06 entre sí**: son
casi idénticos en luminosidad y solo los separa el tono (95° contra 45°). Consecuencia de diseño, no
negociable: **el color nunca puede ser el único portador del significado de un pilar.** Siempre va
acompañado de su número o su etiqueta. Un lector con deuteranopia debe poder distinguirlos sin el
tono, y con el número puede.

---

## Roadmap de slices

### Slice 3 — El chip deja de escribirse tres veces (actual)

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
