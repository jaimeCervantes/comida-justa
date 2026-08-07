# Bitácora: Design System & Tooling

## Slice 1: Base Tooling y Migración del Componente Button

**Objetivo:** 
Reemplazar ESLint y Prettier por Biome para mejorar la velocidad de formateo y linting. Establecer las bases del Design System migrando el componente `Button` usando herramientas modernas (`cva`, `tailwind-merge`, `clsx`).

**Decisiones y Racional:**
- Se eliminaron las dependencias de ESLint y Prettier.
- Se instaló Biome como linter y formateador unificado (se agregó `biome.json`).
- Se introdujo la carpeta `src/presentation/design_system` respetando Clean Architecture para la UI.
- Se implementó la utilidad `cn` (con `clsx` y `tailwind-merge`) para manejo eficiente de clases de Tailwind.
- Se migró `Button.tsx` a `cva` (Class Variance Authority) para tipar fuertemente las variantes (color, size) y se actualizaron todos sus usos en el proyecto.
- Se migró exitosamente la configuración a Tailwind CSS v4.

**Archivos Tocados:**
- **Configuración:** `package.json`, `biome.json`, `tailwind.config.ts` (eliminado), `postcss.config.mjs`.
- **Utilidades:** `src/presentation/design_system/styling/merge-class-names.ts`
- **Componentes:** `src/presentation/design_system/buttons/Button.tsx` (Migrado de `src/infra/UI/components/Button`)
- **Refactors (Imports):** Múltiples archivos para el componente Button y Tailwind v4.

---

## Slice 2: Sistema de Tokens CSS

**Objetivo:**
Crear un sistema unificado y escalable de tokens CSS para colores, tipografía y estructura visual, separándolos de la implementación específica de Tailwind, pero haciéndolos consumibles por él.

**Decisiones y Racional:**
- Se crearon los archivos `colors.css`, `typography.css`, `layout.css` y el entry point `tokens.css` dentro de `src/presentation/design_system/tokens/`.
- Se expusieron las variables de colores mapeadas como utilidades de Tailwind (`bg-pw-green`, etc.) a través de la directiva moderna `@theme` en `colors.css`.
- Se limpió el archivo `globals.css` centralizando las definiciones de tema en los tokens base, eliminando variables repetitivas y permitiendo fácil adaptación al dark mode.

**Archivos Tocados:**
- **Tokens:** `src/presentation/design_system/tokens/colors.css`, `src/presentation/design_system/tokens/typography.css`, `src/presentation/design_system/tokens/layout.css`, `src/presentation/design_system/tokens/tokens.css`
- **Estilos Globales:** `src/app/styles/globals.css`

**Resultados de Validación:**
- Build: Compilación exitosa de Next.js (Turbopack).
- Los tokens están en su lugar y listos para ser consumidos por los componentes.

### Recap
Se completó la segunda iteración estableciendo una base sólida de CSS puro para tokens visuales que interactúa de manera nativa con Tailwind CSS v4, logrando alta mantenibilidad para colores, espacios, sombras y tipografías.

### Próximos pasos (opciones)
1. **Migrar TextField:** Refactorizar el componente base para el input de texto usando los nuevos patrones.
2. **Migrar TextArea:** Hacer lo mismo con las cajas de texto enriquecido.
3. **Instalación de MSW:** Agregar Mock Service Worker para simulación de endpoints en pruebas e2e/unitarias.

---

## Slice 3: El chip deja de escribirse tres veces, y los pilares estrenan paleta

**Objetivo:**
Extraer el primitivo `Badge` y darle a los cuatro pilares una paleta derivada de la marca en lugar
de colores por defecto de Tailwind. Roadmap completo en `docs/features/design-system.md`; escenarios
en `src/e2e/design-system/design-system.feature`.

**Decisiones y Racional:**

- **Por qué había que hacerlo.** `SoldOutBadge`, `ProvenanceBadge` y `CategoryTag` pintaban el mismo
  chip (`inline-flex items-center rounded-full px-3 py-1 text-sm`) con tres colores y dos pesos de
  fuente, sin compartir una línea. Es la tercera copia: la señal de que faltaba el primitivo.

- **La paleta extiende la marca, no la inventa.** El logo tiene dos tonos (`#f0380e` el círculo,
  `#538f39` el corazón) y cuatro pilares necesitan cuatro. Tres salen de tokens que ya existían
  —Alimentación de `--brand-orange`, Movimiento de `--brand-lightgreen`, y Mente y Espíritu de
  `--brand-lightorange`, que llevaba definido **sin un solo uso**—. Solo Sueño estrena tono
  (`#4c4a8f`, índigo nocturno). Antes, Sueño y Mente usaban `violet #8b5cf6` y `sky #38bdf8`, que no
  son de la marca, y `pillarColorClasses` mezclaba `text-violet-600` con `text-pw-orange` dentro del
  mismo objeto.

- **Un token por pilar no alcanzaba, y eso lo decidió la medición, no el gusto.** Al calcular el
  contraste WCAG de las semillas salió que **no se pueden usar como color de texto**: `#5dbf17` da
  2.35 sobre blanco y `#f2b705` da 1.82, y el blanco encima de ellos falla igual. Por eso cada pilar
  es una rampa de tres papeles —`solid` (relleno con texto blanco), `soft` (fondo del chip) e `ink`
  (tinta sobre `soft`)—, derivada de la semilla conservando tono y saturación y moviendo la
  luminosidad hasta cruzar 4.5:1.

- **El test lee el CSS, no una copia.** `pillarPalette.contrast.test.ts` parsea `colors.css` y mide
  cada par. Un espejo de los hexadecimales en TypeScript se desincroniza en cuanto alguien edita el
  token y olvida el espejo; leyendo el archivo que se publica, retocar un hex y romper AA falla en
  CI en vez de en la cara de un usuario.

- **El tema oscuro se declara dos veces, a propósito.** CSS no permite compartir un bloque de
  declaraciones entre una media query y un selector normal, y hacían falta los dos: la media query
  para seguir al sistema (lo que el sitio hace hoy) y `[data-theme="dark"]` para poder forzarlo, que
  es lo que Storybook necesita para enseñar claro y oscuro lado a lado. La duplicación se convirtió
  en invariante verificada: `darkThemeParity.test.ts` compara las dos copias declaración por
  declaración.

- **`emphasis` en vez de tocar lo que ve el visitante.** `ProvenanceBadge` era el único en
  `font-semibold`. En lugar de unificar y cambiar la apariencia, se volvió una variante con
  significado: la procedencia es la afirmación de confianza de la tarjeta y pesa más que la
  categoría o la disponibilidad. Las tres insignias se ven exactamente igual que antes.

- **Aviso que quedó por escrito en el código.** Como tinta, Movimiento (`#3c7b0f`) y Mente
  (`#8e6b03`) contrastan **1.06** entre sí: casi idéntica luminosidad, solo los separa el tono. Hay
  una prueba que lo deja documentado. Consecuencia no negociable: el color nunca puede ser el único
  portador del significado de un pilar; siempre va con su número o su etiqueta.

**Archivos Tocados:**
- **Documentación:** `docs/features/design-system.md` (nuevo roadmap), `src/e2e/design-system/design-system.feature` (nuevo)
- **Tokens:** `src/presentation/design_system/tokens/colors.css`, `contrast.ts` (nuevo), `pillarPalette.contrast.test.ts` (nuevo), `darkThemeParity.test.ts` (nuevo), `PillarPalette.stories.tsx` (nuevo)
- **Primitivo:** `src/presentation/design_system/badges/Badge.tsx`, `Badge.test.tsx`, `Badge.stories.tsx` (nuevos)
- **Migrados a `Badge`:** `src/infra/UI/components/SoldOutBadge/SoldOutBadge.tsx`, `ProvenanceBadge/ProvenanceBadge.tsx`, `CategoryTag/CategoryTag.tsx`
- **Storybook:** `.storybook/preview.ts` (selector de tema claro/oscuro)

**Comandos clave:**
```bash
pnpm run test:run      # 785 pruebas
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
```

**Resultados de Validación:**
- `pnpm run test:run`: **785/785 en verde**, 85 archivos. De ellas, 42 nuevas (14 de `Badge`, 25 de
  la paleta, 3 de la paridad de temas).
- `pnpm run typecheck`: **exit 0**. Nota: `tsc` fallaba con ~20 errores en `.next/dev/types/`, que
  eran artefactos truncados de un dev server interrumpido, no código del repo; se borró la carpeta y
  Next la regenera.
- `pnpm run lint`: limpio tras `pnpm run format` (4 archivos reformateados).
- `pnpm run check:i18n`: sin texto en español escrito a mano en componentes.
- Playwright **no** se ejecutó en este slice: no hay escenario e2e nuevo. Los escenarios de la
  paleta están marcados `@component` en el `.feature` porque son presentación pura, sin recorrido de
  navegación ni dato de base que justifique un navegador.

**Desviaciones del roadmap:**
- El selector de tema de Storybook obligó a añadir soporte de `data-theme` en `colors.css`, que no
  estaba previsto. Se hizo porque sin él no se puede validar visualmente el modo oscuro, que era uno
  de los cuatro problemas acordados. Efecto colateral útil: queda el camino abierto para un selector
  manual de tema en el sitio.

**Follow-ups:**
- Los tokens `--pillar-*` existen pero todavía no los consume ninguna página: eso es el slice 4.
- `pilaresData.ts` sigue con `color: "violet" | "orange" | "emerald" | "sky"` y `colorHex` a mano.

### Recap
El chip del sitio dejó de estar escrito tres veces y pasó a ser un primitivo con variantes, y los
cuatro pilares tienen por primera vez una paleta que sale de la marca en lugar de las utilidades por
defecto de Tailwind. La accesibilidad dejó de ser una intención: cada par de color está medido
contra WCAG AA por una prueba que lee el CSS publicado, y Storybook ya permite ver claro y oscuro
lado a lado. Nada de esto cambió todavía lo que el visitante ve — las tres insignias se ven igual
que antes y las páginas de pilares siguen con sus colores viejos.

### Próximos pasos (opciones)
1. **Slice 4 — Los pilares estrenan su paleta:** que `pilaresData.ts` y las páginas de `/pilares`
   consuman los tokens. Es donde el trabajo se vuelve visible.
2. **Slice 5 — Superficie y tarjeta:** atacar los 71 `rounded-*` sueltos en 31 archivos con un
   primitivo `Surface`.
3. **Slice 6 — Tipografía:** `Heading` y `Text` atados a `typography.css`, cuyos tokens `--fs-*` hoy
   no consume nadie.