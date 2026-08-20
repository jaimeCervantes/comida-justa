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
de colores por defecto de Tailwind. Roadmap completo en `docs/features/platform/001-2026-07-28-design-system.md`; escenarios
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
- **Documentación:** `docs/features/platform/001-2026-07-28-design-system.md` (nuevo roadmap), `src/e2e/design-system/design-system.feature` (nuevo)
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

---

## Slice 4: Los pilares estrenan su paleta

**Objetivo:**
Que las páginas de `/pilares` dejen de escribir sus colores a mano y consuman los tokens
`--pillar-*` creados en el slice 3. Es donde el trabajo se vuelve visible.

**Decisiones y Racional:**

- **Se encontró podredumbre, no solo inconsistencia.** Al abrir las páginas apareció la cicatriz de
  un find/replace anterior: ` da dark:` como clase suelta en 8 sitios, `bg-violet-50/da` y
  `text-violet-100xt-lg` en `SuenoPage`. Llevaban ahí sin que nadie lo notara, y por una razón
  concreta: **el color estaba escrito cuatro veces en cuatro archivos**, así que romper uno no
  rompía nada visible en los demás. Es el argumento de este slice mejor que cualquier discurso.

- **La clave del pilar sustituye a la cadena de clases.** `PillarArticle`, `PillarCallout` y
  `PillarReferences` recibían `headingClassName`, `className` y `linkClassName` — cadenas de Tailwind
  viajando por props. Ahora reciben `pillar: PillarKey` y resuelven el color ellos. Un pilar ya solo
  puede pintarse de su color: el error de teclear mal una clase deja de ser posible.

- **Desaparecen las variantes `dark:`.** Antes cada color venía en pareja
  (`text-violet-600 dark:text-violet-400`) y había que acordarse de las dos. El token cambia solo de
  valor según el tema, así que la clase es una. Hay una prueba que lo exige: si alguien reintroduce
  un `dark:` en `pillarColorClasses`, falla.

- **`colorHex` era código muerto.** El campo existía en `PillarData` con cuatro valores y no lo leía
  nadie. Se eliminó junto con `color: "violet" | "orange" | "emerald" | "sky"`, que era un segundo
  nombre para lo que `key` ya identificaba.

- **Tokens en kebab-case.** `--pillar-mindSpirit-*` pasó a `--pillar-mind-spirit-*`: Tailwind no es
  fiable con mayúsculas dentro de un nombre de clase. La clave del pilar (`mindSpirit`) y el tono de
  `Badge` siguen en camelCase; solo cambia el nombre del token.

- **`stripComments` se extrajo a su propio módulo.** El test que prohíbe colores ajenos se tropezaba
  con su propia documentación, porque estos archivos citan a propósito las clases rotas que vinieron
  a reemplazar. `checkI18n.ts` ya tenía resuelto exactamente ese problema, así que la función salió
  a `src/scripts/stripComments.ts` y ahora la usan los dos. Ninguna copia nueva.

- **Se añadió `PillarPanel` y `PillarSectionHeading`.** Las cuatro páginas repetían literalmente el
  mismo `<div className="…rounded-2xl p-6 sm:p-8 my-8 border…">` y el mismo `<h2>`. Cuatro copias
  es el mismo error que las tres insignias del slice 3.

**Archivos Tocados:**
- **Datos y color:** `src/app/[locale]/pilares/components/pilaresData.ts`, `pilaresData.test.ts` (nuevo)
- **Armazón:** `PillarArticle.tsx` (+`PillarPanel`, `PillarSectionHeading`), `PillarReferences.tsx`
- **Páginas:** `SuenoPage.tsx`, `AlimentacionPage.tsx`, `MovimientoPage.tsx`, `MenteEspirituPage.tsx`, `PilaresOverviewPage.tsx`
- **Compartido:** `src/scripts/stripComments.ts` (nuevo, extraído de `checkI18n.ts`)
- **Tokens:** `colors.css`, `Badge.tsx`, `pillarPalette.contrast.test.ts`, `PillarPalette.stories.tsx` (kebab-case)

**Comandos clave:**
```bash
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
pnpm run build      # la única prueba real de que Tailwind genera las clases del token
```

**Resultados de Validación:**
- `pnpm run test:run`: **806/806 en verde**, 86 archivos (+21 pruebas nuevas).
- `pnpm run typecheck`: exit 0. `pnpm run lint`: limpio. `pnpm run check:i18n`: limpio.
- `pnpm run build`: **compila**. Verificado en el CSS emitido que existen de verdad
  `.bg-pillar-mind-spirit-soft`, `.text-pillar-mind-spirit-ink`, `.bg-pillar-sleep-solid`,
  `.text-pillar-movement-ink` y `.border-pillar-nutrition-ink`, y que salen tanto el bloque
  `prefers-color-scheme` como el `[data-theme=dark]`.
- Playwright no se ejecutó: no hay escenario e2e nuevo. El criterio de aceptación ("ninguna clase
  `violet-*` ni `sky-*` sobrevive") lo hace cumplir una prueba que escanea los archivos.

### Recap
Las cuatro páginas de pilares ya no escriben un solo color: reciben la clave del pilar y el token
hace el resto, en claro y en oscuro. De paso se limpiaron tres clases rotas que llevaban tiempo en
producción sin que nadie las viera, y se borró `colorHex`, que no leía nadie. La paleta del sitio ya
es la de Hazlo Sano de punta a punta: `violet` y `sky` desaparecieron del árbol de pilares.

### Próximos pasos (opciones)
1. **Slice 5 — Superficie y tarjeta:** el primitivo `Surface` contra los `rounded-*` sueltos.
2. **Slice 6 — Tipografía:** `Heading` y `Text` sobre `typography.css`.
3. **Slice 7 — Estado y foco:** `Skeleton`, `Alert` y un anillo de foco consistente.

---

## Slice 5: Superficie y tarjeta

**Objetivo:**
Que el radio, la elevación, el borde y el fondo dejen de decidirse archivo por archivo. `layout.css`
define `--radius-*` y `--shadow-*` desde el slice 2 y no los consumía nadie: 71 `rounded-*`
repartidos en 31 archivos.

**Decisiones y Racional:**

- **`Surface` es polimórfico (`as`), no un `<div>` envolvente.** Una tarjeta tiene que seguir siendo
  un `<article>` y un bloque de página una `<section>`. Un primitivo que obligara a envolver añadiría
  un nodo por tarjeta y rompería la semántica que el HTML ya tenía bien.

- **Fondos y bordes por token semántico, sin `dark:`.** `bg-white dark:bg-pw-gray` pasó a
  `bg-surface-elevation-1`, que vale exactamente lo mismo en ambos temas (`#ffffff` / `#334155`), así
  que el cambio es invisible y desaparece una pareja de clases más. `border-gray-100
  dark:border-gray-800` pasó a `border-separator`: **este sí cambia un poco el tono del borde**
  (`#e2e8f0` en vez de `#f3f4f6` en claro), y se aceptó porque `separator` es el token que existe
  para eso y tener dos grises de borde distintos era el problema, no la solución.

- **`interactive` es una variante, no el comportamiento por defecto.** El `hover:-translate-y-1` solo
  tiene sentido en una superficie que lleva a algún sitio. Un panel informativo que se levanta al
  pasar el cursor promete un clic que no existe.

- **Apareció una mentira de tipos.** `CardProps.media` declaraba
  `ElementType | JSX.Element | string | null | undefined`. Un *tipo* de componente no se puede pintar
  como hijo —React no lo instancia—, así que ese miembro describía algo que habría fallado en tiempo
  de ejecución; nadie lo usaba. Salió a la luz porque `Surface` tipa `children` como `ReactNode` de
  verdad, mientras que el `<Container>` genérico de antes aceptaba cualquier cosa. Ahora es
  `React.ReactNode`.

**Archivos Tocados:**
- **Primitivo:** `src/presentation/design_system/surfaces/Surface.tsx`, `Surface.test.tsx`, `Surface.stories.tsx` (nuevos)
- **Migrados:** `src/infra/UI/components/Card/Card.tsx`, `Card/types.ts`, `src/presentation/directory/StoreSummaryCard.tsx`, `src/app/[locale]/pilares/components/PillarArticle.tsx` (`PillarPanel`)
- `CardForList` no se tocó: pinta a través de `Card`, así que hereda la superficie.

**Resultados de Validación:**
- `pnpm run test:run`: **817/817 en verde**, 87 archivos (+11 pruebas de `Surface`).
- `pnpm run typecheck`: exit 0 (tras corregir el tipo de `media`). `pnpm run lint`: limpio.
- `pnpm run build`: **Compiled successfully in 14.0s**.

### Recap
El sitio tiene un contenedor con nombre. Las tarjetas del catálogo, las del directorio de tiendas y
los paneles de los pilares ya no eligen su propio radio ni su propia sombra, y el fondo y el borde
salen de tokens semánticos que cambian solos con el tema. De paso se corrigió un tipo que describía
algo imposible de renderizar.

### Próximos pasos (opciones)
1. **Slice 6 — Tipografía:** `Heading` y `Text` sobre `typography.css`, cuyos `--fs-*` sigue sin
   consumir nadie.
2. **Slice 7 — Estado y foco:** `Skeleton`, `Alert` y un anillo de foco consistente.
3. **Barrer el resto de `rounded-*`:** quedan usos fuera de tarjetas (cabecera, paginación, mapa).

---

## Slice 6: La tipografía deja de ser `text-sm` a mano

**Objetivo:**
Dar nombre al papel que cumple cada texto en vez de a su tamaño. Los tokens `--fs-*` llevaban desde
el slice 2 sin que los consumiera **ni un solo componente**, mientras el árbol acumulaba 99
`text-sm`, 47 `text-xl`, 41 `text-lg` y 40 `text-2xl` escritos a mano.

**Decisiones y Racional:**

- **Los tokens no se usaban porque nunca llegaron a `@theme`.** Eran variables CSS en `:root` que no
  generaban ninguna clase de Tailwind: imposibles de usar aunque alguien quisiera. Ahora se exponen
  en el espacio `--text-*`, que es el que Tailwind v4 usa para tamaños, con nombres que dicen para
  qué sirven (`text-label`, `text-heading-md`) en lugar de cuánto miden.

- **`level` y `size` son props separadas en `Heading`, y es la decisión importante del slice.** El
  nivel es estructura —lo que leen un lector de pantalla y un buscador— y el tamaño es apariencia.
  Atarlos obliga a elegir entre una jerarquía correcta y un diseño correcto, y con prisa siempre
  gana el diseño: así es como acaba un `<h1>` en mitad de una tarjeta porque tenía que verse grande.
  Con las dos props, un `<h2>` puede verse pequeño sin mentir sobre el documento.

- **`Text` nombra el papel, no el tamaño**: `body`, `lead`, `label`, `caption`, `tiny`. Un párrafo
  largo lleva interlineado holgado y una etiqueta no, y eso deja de decidirse en cada componente.

- **Salió un bug real que habría llegado a producción.** `tailwind-merge` desempata mirando el
  **nombre** de la clase, no el CSS: sin declararle los tamaños nuevos, `text-body` le parecía un
  color de texto —como `text-red-500`—, chocaba con `text-text-base` y **descartaba uno de los dos**.
  El síntoma es un componente que se queda literalmente sin clase de tamaño. Lo atrapó el test de
  `Text` antes de que se viera en pantalla. `cn()` pasó a usar `extendTailwindMerge` declarando los
  tamaños y los colores semánticos del sistema, incluidas las tintas de los cuatro pilares.

- **`Surface` estrenó `radius="none"`**, para superficies que redondean solo algunos lados: la caja
  con barra lateral de los pilares lleva `rounded-r-xl` y nada más.

**Archivos Tocados:**
- **Tokens:** `src/presentation/design_system/tokens/typography.css` (bloque `@theme`)
- **Primitivos:** `typography/Heading.tsx`, `Heading.test.tsx`, `typography/Text.tsx`, `Text.test.tsx`, `Typography.stories.tsx` (nuevos)
- **Utilidad:** `styling/merge-class-names.ts` (`extendTailwindMerge`)
- **Migrados:** `src/app/[locale]/pilares/components/PillarArticle.tsx`, `PillarReferences.tsx`
- **Primitivo tocado:** `surfaces/Surface.tsx` (`radius="none"`)

**Resultados de Validación:**
- `pnpm run test:run`: **838/838 en verde**, 89 archivos (+21 pruebas).
- `pnpm run typecheck`: exit 0. `pnpm run lint`: limpio. `pnpm run check:i18n`: limpio.
- `pnpm run build`: **Compiled successfully in 13.6s**.

**Alcance deliberado:** solo se migraron las páginas de pilares. Los otros ~250 `text-*` a mano se
dejan para un barrido posterior: convertirlos todos no cabe en un slice y no enseña nada nuevo.

### Recap
El sitio puede por fin hablar de "una etiqueta" o "una entradilla" en vez de "text-sm" y "text-lg", y
la escala se ajusta en un archivo. `Heading` separa la jerarquía del documento de su apariencia, que
es lo que impide que la prisa degrade la accesibilidad. En el camino apareció un fallo de
`tailwind-merge` que dejaba componentes sin clase de tamaño, y ahora `cn()` conoce el vocabulario
del design system.

### Próximos pasos (opciones)
1. **Slice 7 — Estado y foco:** `Skeleton`, `Alert` y un anillo de foco consistente.
2. **Barrido de tipografía:** llevar `Heading`/`Text` al resto del árbol (~250 usos).
3. **Barrido de `rounded-*`:** cabecera, paginación y mapa siguen decidiendo su radio.

---

## Slice 7: Estado, retroalimentación y foco

**Objetivo:**
Cerrar el roadmap con lo que falta para que la interfaz sea usable sin ratón y sin vista perfecta:
un anillo de foco igual en todas partes, y primitivos para «cargando» y «algo pasó».

**Decisiones y Racional:**

- **El anillo de foco usa `outline`, no `ring`, y ese detalle es el que lo hace funcionar.** `ring`
  de Tailwind es una `box-shadow`, así que **lo recorta cualquier ancestro con `overflow: hidden`**
  — justo lo que tienen las tarjetas del catálogo, que ahora lo declaran en `Surface`. El anillo
  desaparecía exactamente donde más falta hace. `outline` se pinta por encima del recorte.
  `border-radius: inherit` hace además que siga la forma del elemento en vez de dibujar un
  rectángulo alrededor de un chip redondo.

- **Había nueve tratamientos de foco distintos** (`ring-pw-green`, `ring-slate-400`,
  `ring-slate-500`, `ring-pw-lightgreen`, `ring-1`, `ring-2`, `outline-hidden`…). Quien navega con
  teclado necesita lo contrario: la misma señal en todas las pantallas.

- **`Button` no tenía foco en absoluto.** El componente más pulsado del sitio: al tabular no había
  forma de saber dónde estabas. Se corrigió en la clase base del primitivo, así que lo hereda todo
  el sitio de una vez.

- **El anillo cambia de verde con el tema.** El verde de marca (`#538f39`) se apaga sobre fondo casi
  negro, así que en oscuro el token pasa al verde vivo.

- **En `Alert` el `role` lo decide el tono, no quien llama.** Un error tiene que interrumpir a un
  lector de pantalla (`role="alert"`, es decir `aria-live="assertive"`); una confirmación no debe
  cortar la lectura (`role="status"`, `polite`). Dejarlo como prop garantiza que tarde o temprano un
  error se anuncie en `polite` y pase desapercibido.

- **`Alert` exige una etiqueta de texto.** Quien no distingue rojo de verde no puede leer un aviso
  cuyo único dato es el color del borde. La etiqueta llega ya traducida: el design system no lee el
  catálogo de mensajes (misma regla que `loadingLabel` en `Button`).

- **`Skeleton` es `aria-hidden` y anima solo bajo `motion-safe`.** No hay nada que anunciar mientras
  carga —el contenido aún no existe— y oír «imagen, imagen, imagen» es peor que el silencio; quien
  avisa es el contenedor con `aria-busy`, que `PostDetailSkeleton` **no tenía**, así que la carga era
  muda. Y el brillo que recorre el bloque es justo el tipo de animación que provoca mareo: ahora
  desaparece para quien pidió menos movimiento en su sistema.

**Archivos Tocados:**
- **Tokens:** `tokens/focus.css` (nuevo), `tokens/tokens.css`
- **Primitivos:** `feedback/Skeleton.tsx` + test, `feedback/Alert.tsx` + test (nuevos)
- **Foco unificado:** `buttons/Button.tsx`, `Header/UserMenu.tsx`, `pilares/components/PilaresOverviewPage.tsx`, `auth/signin/page.tsx`
- **Migrado:** `src/app/[locale]/[slug]/ui/PostDetailSkeleton.tsx`

**Resultados de Validación:**
- `pnpm run test:run`: **854/854 en verde**, 91 archivos (+16 pruebas).
- `pnpm run typecheck`: exit 0. `pnpm run lint`: limpio. `pnpm run build`: **Compiled successfully**.
- Verificado en el CSS emitido que `.focus-ring:focus-visible` existe con su `outline`, y que
  `--focus-ring` cambia de valor bajo `prefers-color-scheme` y bajo `[data-theme=dark]`.

**Fuera de alcance, a propósito:** los campos de formulario (`TextField`, `TextArea`) conservan su
anillo de color según el estado de validación, porque ahí el color comunica el error y no solo el
foco. Unificarlos pide una revisión del sistema de estados de formulario, que no es este slice.

### Recap
El design system queda cerrado con los siete slices del roadmap. El sitio tiene un anillo de foco
único que sobrevive al recorte de las tarjetas, un botón que por fin se ve al tabular, avisos que
anuncian con la urgencia correcta y no dependen del color, y esqueletos que ni interrumpen a un
lector de pantalla ni marean a quien pidió menos movimiento.

### Próximos pasos (opciones)
1. **Barrido de tipografía:** llevar `Heading`/`Text` al resto del árbol (~250 usos a mano).
2. **Barrido de `rounded-*`:** cabecera, paginación y mapa siguen decidiendo su radio.
3. **Estados de formulario:** revisar `TextField`/`TextArea` para que el foco y el error dejen de
   competir por el mismo anillo.
4. **Usar `Alert`:** el primitivo existe pero todavía no lo consume ninguna pantalla; los mensajes
   de error de `/publicar` son el primer candidato.
---

## Slice 8: Cerrar los cabos del roadmap

**Objetivo:** consumir lo que el design system ya ofrecía y que ninguna pantalla usaba, y resolver
los dos puntos que el slice 7 dejó fuera a propósito.

**Decisiones y Racional:**

- **`Alert` ya se usa.** El error de `/publicar` era un `<h2>` en rojo: sin `role`, un lector de
  pantalla **no anunciaba nada**, y quien no distingue el rojo no tenía forma de saber que aquello
  era un error. Ahora lleva el `role="alert"` que interrumpe y la etiqueta de texto que sobrevive
  sin percibir el color (`common.alertError`, nueva en los dos catálogos).

- **El foco de los formularios se separó del estado de validación.** Era el punto que el slice 7
  dejó pendiente, y el problema estaba bien identificado: el mismo anillo comunicaba dos cosas, así
  que en un campo con error el foco se pintaba rojo y la señal de "estás aquí" se confundía con la
  de "esto está mal". Ahora **el borde dice el estado y el anillo dice el foco**. Hizo falta una
  utilidad nueva, `focus-ring-within`: un campo de texto vive dentro de una caja que dibuja el borde
  y los iconos, así que el anillo lo tiene que pintar la caja y no el `input`.

- **Había un literal en español clavado en el design system.** `TextArea` tenía
  `"Este campo es requerido o inválido"` como texto de reserva. `check:i18n` no lo ve porque solo
  mira `src/app` y `src/infra/UI`. Pasó a ser un prop (`genericErrorLabel`), por la misma razón que
  `loadingLabel` en `Button`: el design system tiene que poder renderizarse fuera del proveedor de
  i18n. Sin el prop no se pinta frase — mejor el icono solo que una en el idioma equivocado.

- **La paginación estrena tokens, foco y `aria-current`.** Usaba `bg-white dark:text-black`, otra
  pareja de clases que había que recordar; ahora `surface-elevation-1` y `text-base` cambian solos.
  No tenía anillo de foco: al tabular por la paginación no había ninguna señal de dónde estabas. Y
  la página actual solo se distinguía por el color de fondo, sin `aria-current="page"`.

- **`layout.css` no se expone a Tailwind, y ahora está escrito por qué.** Se comprobó valor por
  valor: `--radius-sm/md/lg` son **idénticos** a la escala por defecto de Tailwind v4, y
  `--radius-pill` es lo mismo que `rounded-full`. O sea que "nadie los consume" no era una tarea
  pendiente: no hay nada que consumir, porque escribir `rounded-lg` ya usa ese valor. Exponerlos
  cambiaría cada `rounded-sm` del sitio sin añadir nada. Queda documentado en el propio archivo para
  que nadie lo "arregle" exponiéndolos.

**Archivos Tocados:**
- `src/app/[locale]/publicar/PublishForm.tsx`, `src/i18n/messages/{es,en}.json`
- `src/presentation/design_system/tokens/focus.css` (`focus-ring-within`), `tokens/layout.css` (nota)
- `src/presentation/design_system/forms/InputShell.tsx`, `forms/TextArea.tsx`
- `src/infra/UI/components/Pagination.tsx`

**Resultados de Validación:**
- `pnpm run test:run`: **896/896**. `pnpm run typecheck`: exit 0. `pnpm run lint` y `check:i18n`:
  limpios. `pnpm run build`: compila.

### Recap
El design system dejó de tener piezas que nadie usaba: `Alert` ya protege el error de `/publicar`,
el anillo de foco llegó a los formularios y a la paginación separando el foco del estado, y se quitó
el último literal en español que vivía dentro del sistema. De paso quedó por escrito por qué los
tokens de `layout.css` no se exponen, que era una tarea fantasma.

### Próximos pasos (opciones)
1. **Barrido de tipografía:** `Heading`/`Text` solo los consumen las páginas de pilares; quedan ~250
   `text-*` a mano. Es mecánico y grande; conviene hacerlo por zonas, no de una vez.
2. **Mudanza de `src/infra/UI/components/` a `src/presentation/`**, que `AGENTS.md` pide desde antes
   de este trabajo.
3. **Typechequear los tests:** medido en 32 errores (ver `docs/features/planning/001-2026-08-07-pendientes.md`).

---

## Slice 9: La mudanza de componentes y el barrido de tipografía

**Objetivo:** cerrar los dos pendientes mecánicos que arrastraba el roadmap.

### La mudanza

`AGENTS.md` pedía sacar los componentes compartidos de `src/infra/UI/components/` desde antes de que
empezara este trabajo: son presentación viviendo en la capa de infraestructura.

**No se mudaron a un `presentation/components/` plano**, que solo habría cambiado la ruta del
problema. Van agrupados por concern, que es lo que `AGENTS.md` pide de la estructura de carpetas:

| Concern | Qué contiene |
| --- | --- |
| `chrome/` | Header, Footer, LanguageSwitcher |
| `navigation/` | Pagination, LinkButton (+ Breadcrumbs, que ya estaba) |
| `post/` | Card, CardForList, CategoryTag, ProvenanceBadge, SoldOutBadge, WhatsappButton |
| `media/` | MediaContent, ImageVideoPicker, ImageVideoUploader |
| `search/`, `user/`, `auth/`, `money/` | SearchBar, Avatar, auth-buttons, CurrencyAmount |
| `directory/` | BranchList (+ StoreSummaryCard, que ya estaba) |

En `src/infra/UI/` quedan `hooks/`, `labels/`, `mappers/`, `metadata/` y `stories/`: son adaptadores
y datos, no interfaz. La carpeta `components/` se borró.

**Lo que casi se rompe en silencio:** `checkI18n.ts` escanea `["src/app", "src/infra/UI"]`. Sin
actualizar esa lista, el escáner habría seguido pasando en verde **mientras dejaba de mirar veinte
componentes**. Al añadir `src/presentation` salieron dos literales en español en `contrast.ts`; son
mensajes de `throw` que lee quien programa, no interfaz, así que se pasaron a inglés —como los de
`GeminiEmbeddingService` y `TranslationProviderError`— en vez de silenciarlos con `// i18n-ignore`.

### El barrido

Había 292 `text-*` escritos a mano. El barrido **no fue rociar `<Text>` por encima**: los tres
archivos que concentraban 84 resultaron ser copias unas de otras, así que lo que tocaba era extraer
lo repetido.

- **21 encabezados numerados** en las dos páginas legales, cada uno con esta cadena copiada entera:
  `bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full w-7 sm:w-8 h-7
  sm:h-8 flex items-center justify-center text-sm font-semibold shrink-0`. Ahora son
  `LegalSectionHeading`.
- **Y ya habían derivado**, que es la prueba de que el problema era la copia y no el tamaño: en
  `/condiciones-de-servicio` diez usaban `gap-3 mb-4 sm:mb-5` y uno `gap-2 mb-4`; en
  `/politica-de-privacidad` era al revés, uno y nueve. Nadie lo había visto porque cada copia se
  editaba sola.
- **El azul se fue.** Las páginas legales usaban `blue-*`, un color que el sitio no usa en ningún
  otro sitio. Ahora usan el verde de la marca.
- **La cabecera de página legal** estaba escrita dos veces carácter por carácter → `LegalPageHeader`.
- **El encabezado de columna del pie**, tres veces → un componente local en `Footer.tsx`. Se queda
  local a propósito: es el estilo de *ese* pie, y promoverlo sin un segundo uso real sería inventar
  una abstracción.
- `Footer`, `Card` y `StoreSummaryCard` cambiaron sus parejas `text-gray-600 dark:text-gray-400` por
  tokens semánticos (`text-text-support`, `text-label`, `border-separator`): una clase en vez de dos,
  y el tema lo resuelve la variable.

**Quedan 221 `text-*`.** No es un barrido a medias: los que quedan están en `Button`, `Alert` y las
stories —donde el tamaño **es** la variante que el primitivo define, no un valor a mano— y repartidos
de uno en uno por rutas que no comparten patrón. Convertirlos sin una repetición detrás sería cambiar
`text-sm` por `text-label` sin ganar nada.

**Archivos tocados:** mudanza de 20 componentes (`git mv`, con historia conservada); imports
reescritos en 22 archivos; `src/presentation/legal/` (nuevo);
`condiciones-de-servicio/page.tsx`, `politica-de-privacidad/page.tsx`, `Footer.tsx`, `Card.tsx`,
`StoreSummaryCard.tsx`; `checkI18n.ts`; `AGENTS.md` y `.agents/skills/nextjs-bdd-feature/SKILL.md`
(la nota de "known deviation" ya no aplica).

**Validación:** `pnpm run test:run` **930/930**; `typecheck` exit 0; `lint` limpio; `check:i18n`
limpio; `build` compila.

### Recap
Los componentes compartidos ya no viven en infraestructura, y no aterrizaron en un cajón plano sino
agrupados por lo que hacen. El barrido de tipografía encontró lo que suele esconder un número
grande: 292 `text-*` no eran 292 decisiones, eran unas pocas copiadas muchas veces — y ya divergiendo
entre copias. Se extrajeron; el resto se dejó donde el tamaño es una decisión legítima.

### Próximos pasos (opciones)
1. **Typechequear los tests**, medido en 32 errores (`docs/features/planning/001-2026-08-07-pendientes.md`).
2. **La deuda que necesita Alembic**: `UNIQUE(post_id, locale)`, índices GIN/HNSW, tabla de
   búsquedas.
3. **Slice 5 de i18n**: `sellers` y `branches` siguen en un solo idioma.

## Slice 10: El anillo de foco cuadraba lo redondo (2026-08-07)

Se reportó desde la barra de búsqueda: en reposo es una píldora y al hacer clic se volvía un
rectángulo, con el anillo verde también rectangular.

### El defecto

`tokens/focus.css` cerraba las dos utilidades con `border-radius: inherit`, puesto —según su propio
comentario— para "que el anillo siga la forma del elemento". Hace lo contrario de lo que dice: no
toca el anillo, le **cambia la forma al elemento**, y `inherit` toma el radio del padre. El
`InputShell` de la barra es `rounded-full` dentro del `div.flex.flex-col` de `TextField`, que no
tiene radio: al enfocar, radio 0.

No hacía falta nada. El navegador ya curva el `outline` según el `border-radius` de quien lo recibe.

Alcanzaba a **todo** lo que tiene forma propia y un padre sin ella: el avatar del menú y la
paginación (`rounded-full`), los botones (`rounded-lg`), las tarjetas de pilares (`rounded-2xl`).
Se veía solo al enfocar, así que con el ratón casi nunca.

### Y de paso: los campos se quedan sin anillo

Arreglada la forma, quedaban dos verdes concéntricos separados por 2 px alrededor de cada campo —el
borde, que ya se pone verde al enfocarse, y el anillo—. En una pantalla con varios campos es ruido.
Los campos se quedan solo con el borde, como estaba en producción antes del slice 7; el anillo sigue
donde no hay otra señal: botones, avatar, paginación, tarjetas.

**El costo, dicho:** en un campo la señal de foco pasa a ser un cambio de color de 1 px. El cursor
de texto acompaña —es el único elemento del sitio que lo tiene—, pero es menos señal que un anillo.
Se decidió a la vista de las dos versiones.

`focus-ring-within` se borró al quedarse sin usuarios: existía justo para los campos.

### El borde de 1 px se veía delgado

Se reportó en cuanto se vio en pantalla, y era cierto: sin anillo, la única señal de foco es un
borde de 1 px, y contra el gris de reposo se nota poco. Ahora el foco añade una sombra **hacia
dentro** del mismo verde, que se suma al borde y lo deja en 2 px visuales.

Con sombra y no subiendo el `border` a 2 px porque cambiar el ancho mueve el contenido un píxel al
enfocar, y con varios campos seguidos eso se lee como un salto. La sombra ocupa el hueco sin
empujar nada. Va por dentro también para que no la recorte ningún `overflow: hidden`.

### El desplegable ni siquiera estaba en el design system

Al mirar el mismo formulario se vio que el `select` no se ponía verde al enfocarse y que su flecha
se pegaba al borde derecho. No era un descuido de una pantalla: era una cadena de clases suelta,
`selectClassName`, **copiada en tres formularios** —publicar, editar y el alta de categorías del
admin—, que se había quedado atrás. `border-gray-300` en vez del token, `rounded-sm` donde los demás
campos son `rounded-md`, ~40 px de alto contra los 48 px del resto, y sin foco ninguno. En un
formulario donde el título de arriba se pone verde y el desplegable de abajo no cambia, lo que
parece es que el desplegable no responde.

`Select` se apoya en el mismo `InputShell` que `TextField`: borde, altura, foco, el `*` de requerido
y el hueco de error salen por herencia y no hay nada que recordar.

**La flecha es nuestra.** La nativa se pega al borde —el `padding` del elemento no la separa— y cada
navegador la dibuja distinta. `appearance-none` la quita; esta se coloca a 12 px del borde y lleva
`pointer-events-none` para que al pincharla el clic caiga en el `select` de debajo, que es lo que
hace la nativa.

**La lista desplegada la pinta el navegador y no hereda la caja**: sin decirle nada, en tema oscuro
se abre en blanco. El primer intento fue darle colores a los `option` por token —mejor que el
`dark:bg-gray-800` que había, que solo cubría `prefers-color-scheme` y se saltaba a quien elige el
tema a mano—, pero es un apaño que Safari ignora. Lo que un navegador acepta para eso es
`color-scheme`, y de ahí salió lo siguiente.

### Lo que faltaba de verdad: `color-scheme`

No estaba declarado en ninguna parte del proyecto. O sea que **todo** lo que el navegador dibuja por
su cuenta —la lista de un `select`, las barras de desplazamiento, el cursor de texto, los selectores
de fecha— salía en claro aunque el sitio estuviera en oscuro. Se notaba sobre todo al desplegar:
una lista blanca encima de una página oscura.

Va **una sola vez**, con el tema montado en una variable (`--scheme`). La alternativa era repetir
`color-scheme: dark` en los dos bloques oscuros, y ahí `darkThemeParity.test.ts` no habría podido
cuidarlo: solo compara variables. Como variable entra en la invariante sola, y se comprobó que el
parseo de la prueba la ve en las dos copias.

Con eso, `Select` deja de pintarle los colores a sus `option` a mano.

### La flecha

La de `react-icons` viene rellena: a 20 px un triángulo sólido pesa más que el texto que tiene al
lado y se lleva la vista al borde derecho del campo, que es justo donde no hay nada que leer. La
nuestra es un trazo, hereda tamaño y color de quien la pinta, y estrena
`design_system/icons/`. Queda un segundo consumidor a la vista: el `▼` del selector de idioma es
hoy un carácter de texto y cambia de grosor según la fuente que resuelva el sistema.

### Archivos tocados

`tokens/focus.css`, `tokens/colors.css`, `forms/InputShell.tsx`, `forms/TextArea.tsx`,
`forms/Select.tsx` (nuevo), `icons/ChevronDown.tsx` (nuevo), `publicar/PublishForm.tsx`,
`editar/[slug]/ui/EditPostForm.tsx`, `admin/catalogo/ui/NewCategoryForm.tsx`.

### Validación

`pnpm typecheck` 0; `pnpm typecheck:tests` 0; `pnpm lint` limpio; `pnpm test:run` 948/948.
La forma, el anillo y el grosor son CSS: se comprueban mirando, no hay prueba que los afirme. Lo que
sí protegió el cambio de `select` fueron los page objects, que localizan por
`getByRole("combobox", { name })` y por `#origin`: el `id` y la etiqueta no se tocaron.

### Recap

El anillo de foco dejó de cuadrar lo redondo, en toda la aplicación y no solo en la barra de
búsqueda; los campos volvieron a la señal que tenían en producción, ahora con grosor suficiente para
verla; el desplegable entró al design system, del que llevaba fuera desde siempre en tres copias; y
lo que el navegador pinta por su cuenta dejó de ignorar el tema, que era un agujero de todo el
sitio y no de este formulario.

### Se evaluó y no se hace (todavía): un `SelectSheet`

La pregunta era si el desplegable debería ser una hoja propia, pensada para móvil. **En móvil ya lo
es**: un `<select>` nativo no despliega una lista, iOS abre una rueda anclada abajo y Android un
diálogo casi a pantalla completa. Eso ya es la hoja, gratis, y trae lo que una propia habría que
reconstruir: semántica de combobox, foco atrapado, scroll bloqueado, typeahead al escribir una
letra, autocompletado, y que el formulario siga enviando por `FormData` —los tres son Server
Actions, así que una hoja propia necesitaría además un control oculto que sostenga el valor.

Mobile-first aquí **es** el control nativo: pensar primero en la pantalla chica no obliga a
construir, obliga a elegir lo que mejor funciona en ella.

**Cuándo cambiaría:** cuando haga falta algo que el nativo no da —buscar dentro de las opciones,
opciones con imagen (elegir tienda con su logo), grupos con encabezado, selección múltiple—. El
disparador más probable es la categoría, que sale de la tabla `categories` y crece sin desplegar.
Ese día no se escribe desde cero: `@radix-ui/react-select` trae la accesibilidad y el teclado
resueltos, y el proyecto ya usa Radix en tres sitios.

### Próximos pasos (opciones)

1. **Una prueba que note esto.** Hoy nada afirma la forma, el anillo ni el grosor; los tres defectos
   se reportaron a ojo. Un caso de Playwright con `toHaveScreenshot` sobre un campo enfocado los
   habría cazado.
2. **Medir el contraste del borde verde** contra `surface-elevation-1` en los dos temas: es la única
   señal de foco de los campos y WCAG 1.4.11 pide 3:1.
3. **El `▼` del selector de idioma**, que es un carácter de texto y ya tiene componente al que
   mudarse (`icons/ChevronDown`).
4. **Los demás controles que siguen sueltos**: `input[type=file]` de `ImageVideoUploader`, las
   casillas y los radios. La búsqueda que encontró `selectClassName` no se hizo para ellos.
5. Sigue abierto lo del slice 9: typechequear los tests ya se hizo, quedan Alembic e i18n de
   `sellers`/`branches`.

## Slice 11: El primer pintado del feed ya trae el ancho correcto (2026-08-09)

> En el `.feature` y en el roadmap esta slice es `@slice-9`. La numeración de esta bitácora y la de
> `design-system.md` llevan divergiendo desde el slice 8; se deja anotado en vez de renumerar.

### Objetivo

Lo reportó el usuario abriendo el home en el teléfono: el feed aparecía en varias columnas apretadas
y de golpe se convertía en una sola. No era un parpadeo de estilos, era el reparto cambiando.

### Decisiones y por qué

**El diagnóstico primero, porque el comentario del código decía lo contrario.** `MasonryColumns`
arrancaba en `SERVER_COLUMNS = 3` y corregía en `useLayoutEffect`, con un comentario que afirmaba
que así el reparto equivocado «no llega a verse». Es cierto solo para los renders posteriores a la
hidratación: **el primer pintado es el HTML del servidor**, que el teléfono dibuja en cuanto llega y
mucho antes de que baje el JavaScript. Se comprobó pidiendo la página, no leyendo el código:

```bash
curl -s http://localhost:3000/ | grep -o 'masonry-column' | wc -l   # antes: 3   ahora: 0
```

**El arreglo salió de los otros listados.** Productos, categoría, buscar, tienda y perfil nunca
tuvieron el problema porque usan `CARD_MASONRY`, multi-columna de CSS pura, que el navegador
resuelve en el primer pintado sin scripts. Así que `MasonryColumns` deja de inventar un número de
columnas: mientras no ha medido nada maqueta con `CARD_MASONRY`, y solo al tener ancho y alturas
reales cambia al reparto voraz en columnas de flex. El reparto del slice 8 —y su estabilidad al
cargar más— no se tocó.

**Lo que hace que el cambio sea invisible: `columns-[300px] gap-4` y `columnsFor()` son la misma
fórmula sobre los mismos números.** El número de columnas no cambia al hidratar, y las columnas caen
en las mismas coordenadas —tres columnas de multi-columna en 1216px están en las mismas x que tres
hijos `flex-1` con `gap-4`—. Lo único que se acomoda al medir es en qué columna cae cada tarjeta.
Como son dos sitios que Tailwind no puede mantener sincronizados por su cuenta (sus clases se
extraen del código fuente, no leen constantes), hay un test que falla si alguien mueve un lado.

**Con una sola columna no se hace nada.** CSS ya pone las tarjetas en orden, una debajo de otra, que
es exactamente el resultado del reparto voraz con `columnCount = 1`. Así que se sale antes: el
teléfono —donde se reportó el fallo— ya no entra nunca al camino de JavaScript y su DOM no se toca.
Ahorra además el remontaje de las tarjetas que implica cambiar de maquetación.

**Los tests afirman posiciones, no clases.** Un caso que comprobara `columns-[300px]` pasaría igual
aunque el CSS no llegara a aplicarse; lo que se reportó es dónde acaban las tarjetas. El e2e mide la
caja de cada una y cuenta cuántas coordenadas horizontales distintas hay.

**El e2e bloquea los paquetes de Next en vez de usar `javaScriptEnabled: false`.** Así el contexto
conserva JavaScript para Playwright, y sobre todo es literalmente el caso reportado: la página ya se
ve y sus scripts todavía no llegaron. Intentar pillar ese instante con los scripts cargando de
verdad sería una carrera, y un test intermitente no defiende nada.

### Archivos tocados

- **Componente:** `src/presentation/design_system/surfaces/MasonryColumns.tsx` (+91 −51). Exporta
  ahora `MIN_COLUMN_WIDTH` y `GAP` para que el test pueda atarlos a la clase de CSS.
- **Pruebas:** `src/presentation/design_system/surfaces/MasonryColumns.test.tsx` (tres casos de
  render nuevos y el que vigila la fórmula), `src/e2e/design-system/primerPintado.spec.ts` (nuevo).
- **Especificación:** `src/e2e/design-system/design-system.feature` (`@slice-9`, cuatro escenarios).
- **Documentación:** `docs/features/platform/001-2026-07-28-design-system.md` (slice 9, y el slice 8 que faltaba recoger).

### Comandos

```bash
pnpm run test:run        # 111 archivos, 1085 casos
pnpm run typecheck
pnpm run lint
pnpm exec playwright test src/e2e/design-system/primerPintado.spec.ts --reporter=list
```

### Validación

- `pnpm run test:run`: **1085/1085** en 111 archivos.
- `pnpm run typecheck`: limpio. `pnpm run lint`: limpio (hizo falta `biome format --write` sobre lo
  tocado antes de que pasara).
- El e2e nuevo: **4/4** en 49.4 s.
- **La comprobación en rojo, que es la que vale.** Con el `MasonryColumns` de `HEAD` restaurado, el
  mismo spec da **2 fallos y 2 pases**: caen los dos casos del teléfono y pasan los dos del
  escritorio, que es exactamente lo reportado —en escritorio el número de columnas ya era correcto—.
  El registro del fallo llegó a capturar el brinco: `2 × locator resolved to 3 elements` seguido de
  `11 × locator resolved to 1 element`.
- **Pendiente: la suite e2e completa.** El usuario pidió correrla él. No se ejecutó aquí, así que no
  se afirma nada sobre ella.

### Desviaciones

Ninguna respecto a lo aprobado. Se añadió por el camino la salida temprana con una sola columna, que
no estaba en el plan: apareció al notar que el teléfono pagaba un remontaje de todas las tarjetas
para llegar a una maquetación idéntica a la que ya tenía.

### Recap

El feed del home ya no decide cuántas columnas tiene antes de poder medirlas: el primer pintado lo
maqueta CSS con el ancho real del dispositivo, y el reparto voraz del slice 8 entra solo cuando hay
algo que medir y hay más de una columna que repartir. En un teléfono las dos maquetaciones dan el
mismo resultado, así que el brinco desapareció y el JavaScript ya ni siquiera toca el DOM; en
escritorio el número de columnas es correcto desde el primer píxel. La regla que mantiene las dos
maquetaciones de acuerdo —300 px de columna, 16 de separación— está atada por un test, porque vive
en dos lenguajes que no pueden leerse entre sí.

### Próximos pasos (opciones)

1. **Correr la suite e2e completa** (`--shard=1/2` y `--shard=2/2`, matando los `node` huérfanos
   antes) y commitear. Es lo único pendiente de esta slice.
2. **El remontaje en escritorio.** Al pasar de CSS a columnas de flex, React desmonta y vuelve a
   montar cada tarjeta, porque cambian de padre. Ocurre dentro del `useLayoutEffect`, antes de
   pintar, así que no debería verse —las imágenes vienen de la caché—, pero no se midió. Si
   apareciera un parpadeo de imágenes en escritorio, la salida es posicionar en absoluto sobre un
   contenedor plano, que deja el DOM quieto en las dos maquetaciones.
3. **Los demás listados**, que siguen en multi-columna de CSS pura: no brincan, pero sí recolocan
   todo al añadir. Hoy no crecen —son páginas paginadas—, así que no duele; el día que uno estrene
   «cargar más», hereda el fallo del slice 8 y le toca `MasonryColumns`.
4. **El anti-patrón general.** Este fallo es una instancia de uno más amplio: cualquier componente
   que dependa de medir para maquetar miente en el primer pintado. Vale la pena buscar otros
   (`ResizeObserver`, `clientWidth`, `window.matchMedia` en render) antes de que los reporte alguien.

---

## Slice 10 — La piel de v2: neutrales cálidos y un verde que aguanta blanco

**Fecha:** 2026-08-19 · **Rama:** `feat/design-system-v2`

### Objetivo

Adoptar la capa de tokens de «Hazlo Sano — Sistema de diseño v2» sin tocar un solo componente. Como
todo el árbol ya consume los tokens semánticos desde los slices 1–7, mover la capa de abajo cambia
la piel del sitio entero de golpe: es el slice con más superficie visible y el de menor riesgo, y
por eso va primero.

### Decisiones y por qué

**1. La semilla del logo deja de rellenar, pero no se va.** El hallazgo que ordenó el slice: el
slice 3 midió la rampa de los pilares y la dejó blindada, pero nunca midió la de la marca.
`--brand-green` (`#538f39`, el corazón del logo) rellenaba 28 botones con texto blanco encima a
**3.92** y hacía de tinta en otros 57 sitios a **3.67** — los 85 por debajo del mínimo AA de 4.5.

La rampa separa los dos trabajos, igual que se hizo con los pilares: `600` identifica (es el logo,
se conserva con nombre propio), `700` rellena y entinta, `800` es el hover, `900` la tinta sobre el
chip tenue. `--brand-green` conserva su nombre y pasa a apuntar al `700`. **Ese alias es lo que
arregla los 85 usos sin editar un componente** — y es también el motivo de que el slice pudiera ser
solo de tokens.

**2. El radio entra con nombres propios; la sombra pisa a Tailwind a propósito.** Las dos mitades de
`layout.css` se comportan al revés, y el porqué quedó escrito en su cabecera. Tailwind v4 publica su
escala como custom properties y sus utilidades son referencias a ellas, así que este archivo —que se
importa después— gana la cascada sobre cualquier nombre que repita.

- **Radio:** subir `--radius-lg` a los 18px de v2 habría cambiado los 44 `rounded-lg` del sitio sin
  que nadie tocara esos archivos. Por eso v2 entra como `chip`/`control`/`card`/`panel`, que no
  existen en Tailwind: nada cambia hasta que un componente lo pida. Es la salida al problema que el
  slice 5 dejó escrito y no podía resolver.
- **Sombra:** aquí pisar es el objetivo. «Las sombras dejan de ser negras» tiene que alcanzar a los
  29 `shadow-*` que ya existen sin editar 29 archivos.

**3. Cinco sombras, no tres.** Salió al revisar el CSS ya compilado, no al escribirlo: con solo
`sm|md|lg` declaradas, `shadow-xs` (6 usos) y `shadow-xl` (6 usos) conservaban la de Tailwind, que
es negra. Una sombra negra al lado de una verde se ve, y era exactamente el defecto que v2 viene a
quitar. Se declararon las cinco y el test las cubre.

**4. Dos tokens del documento de diseño entraron corregidos.** La fuente manda en la intención; la
medición manda en el valor.

| Token | Propuesto | Medida | Da | Mínimo | Entró como | Cumple |
| --- | --- | --- | --- | --- | --- | --- |
| `--text-muted` | `#8a9480` | texto 11px sobre `#faf7f1` | 2.96 | 4.5 | `#656e5c` | 4.53 |
| `--border-field` | `#c9c0ac` | borde de campo sobre `#ffffff` | 1.81 | 3.0 | `#8b8874` | 3.04 |

Ambos se derivaron bajando luminosidad sobre la propuesta, conservando matiz y saturación —el mismo
método del slice 3—, y se eligió el valor que cumple contra la **superficie más exigente** de las
tres, no contra la más cómoda. El borde de un campo cae bajo WCAG 1.4.11 porque es lo único que
delimita el control; `--border` y `--separator` son decorativos y se quedan donde estaban.

Tres cifras de las anotaciones del documento tampoco resistieron la medición (5.89→**5.97**,
8.4→**6.32**, 6.1→**5.50**). Ninguna cambia una decisión: las tres siguen cumpliendo AA. El repo se
queda con la medida.

**5. `--highlight` tenía el mismo fallo, en otro verde.** Era `#2abf40`: 2.51 sobre el papel. En
claro pasa a apuntar al relleno de marca; en oscuro sí puede permitirse el verde vivo.

**6. Los pares de botón se declaran como pares.** `--button-*-bg` junto a su `-text` y su `-hover`,
apuntando a `--brand-*`. Así el tema oscuro mueve **una** variable y arrastra al par, y la prueba
puede medir la pareja en vez de hexes sueltos: quien cambie un relleno sin tocar su texto rompe algo
que falla en CI.

### Archivos tocados

**Tokens** — `colors.css` (rampa de marca, neutrales cálidos en los tres bloques, pares de botón,
tonos de aviso, `--text-muted`, `--border-field`), `layout.css` (escala nombrada en `@theme`, cinco
sombras verdes, `--duration-base` 300→260ms, `--ease-natural`), `typography.css` (`--font-display`,
`--font-ui`).

**Pruebas nuevas** — `brandPalette.contrast.test.ts` (59 casos: pares semánticos, cada tinta contra
cada superficie, en los dos temas), `radiusScale.test.ts` (18 casos).

**Aplicación** — `src/app/[locale]/layout.tsx` (Newsreader + Plus Jakarta Sans por `next/font`,
Inter se retira), `src/app/styles/globals.css` (`font-family: var(--font-ui)` en `body`,
`::selection` al par del botón).

**Documentación** — roadmap v2 y escenarios `@slice-10` … `@slice-13`.

### Comandos

```bash
pnpm vitest run src/presentation/design_system/tokens/   # 105/105
pnpm run test:run                                        # 2106/2106 en 200 archivos
pnpm run typecheck                                       # limpio
pnpm run lint                                            # limpio
pnpm run check:i18n                                      # limpio
pnpm run check:directives                                # limpio
pnpm run build                                           # OK en 19.8s, 41/41 estáticas
```

### Validación

- **En rojo primero:** con los tokens viejos, las dos pruebas nuevas daban **40 fallos**. Al adoptar
  la paleta pasaron a 105/105.
- **`darkThemeParity` y `pillarPalette` siguen verdes sin editarse**, que era el criterio de
  aceptación del slice: las dos copias del bloque oscuro siguen idénticas, y la rampa de los pilares
  no se tocó.
- **Verificado en el CSS ya compilado**, no solo en el fuente: las cinco sombras salen en
  `#1f2818…` y son la última declaración (ganan la cascada); `--radius-sm|md|lg` siguen en
  `.25/.375/.5rem` (la escala de Tailwind, intacta); las cuatro nuevas y las dos familias están
  presentes.
- `typecheck:tests` falla con 2 errores en `EditPostForm.test.tsx` y `managePost.test.ts`. **Es
  preexistente en `dev`**: se comprobó con `git stash` y los mismos errores salen sin ninguno de
  estos cambios. No se tocó nada de eso aquí.
- **Pendiente: la suite e2e completa.** No se ejecutó — el usuario la corre él, y lo reiteró
  explícitamente durante este slice. No se afirma nada sobre ella.

### Desviaciones del roadmap

Dos, ambas hacia arriba y ninguna de alcance:

1. **Cinco sombras en vez de tres** (ver decisión 3). El roadmap decía «sombras con verde» sin
   contar cuántas; al compilar se vio que tres dejaban las dos puntas en negro.
2. **`--highlight` entró en el slice** (ver decisión 5). No estaba nombrado en el roadmap; es el
   mismo fallo de contraste que motivó el slice, y dejarlo fuera habría sido raro.

### Recap

La capa de tokens ya es la de v2 y el sitio entero cambió de piel sin que se editara un solo
componente: neutrales con la temperatura del papel en claro y en oscuro, sombras que llevan el verde
de la marca en vez de negro, dos voces tipográficas servidas desde nuestro dominio, y una escala de
radio con nombres propios esperando a que los componentes la pidan. El agujero que arrastraba desde
el slice 3 —la rampa de la marca nunca se midió— está tapado y con prueba: 85 usos que estaban por
debajo de AA lo cumplen ahora, y un `brandPalette.contrast.test.ts` de 59 casos impide que vuelvan a
caer. Los 71 `rounded-*` sueltos siguen exactamente donde estaban, que es lo correcto: moverlos es
el trabajo del slice 11, componente por componente.

### Próximos pasos (opciones)

1. **Correr la e2e completa** y revisar el sitio a ojo en claro y oscuro. Es lo único pendiente de
   este slice, y está en tus manos: `pnpm run test:e2e:run` por lotes de 25–40 specs, matando al
   dueño del puerto 3000 entre uno y otro.
2. **Slice 11 — los primitivos.** `Button` repunta su relleno al token y sube `md`/`lg` a 44px de
   objetivo táctil; `Badge` mete el número del pilar dentro de la insignia; `Surface` estrena
   `radius: card | panel`; `InputShell`, `Alert` y `Skeleton` adoptan los tonos cálidos. Es donde la
   escala de radio nueva empieza a tener consumidores.
3. **Storybook en los dos temas.** Los tokens cambiaron de valor y el catálogo visual no se ha
   mirado desde entonces: `pnpm run storybook` con `data-theme="dark"` forzado es la forma más
   rápida de cazar un par que la prueba no cubra por no ser un par declarado.
4. **La deuda que este slice dejó a la vista y no tocó.** `--brand-black` no se redefine en oscuro
   (hoy tampoco lo hacía), así que los 3 `text-pw-black` quedan invisibles sobre fondo oscuro. Es
   preexistente y de componente, no de token: le toca al slice 11.

---

## Slice 11 — Los primitivos hablan v2

**Fecha:** 2026-08-19 · **Rama:** `feat/design-system-v2`

### Objetivo

Que los primitivos consuman los tokens del slice 10. El slice anterior arregló la capa de abajo,
pero un token no llega a la pantalla hasta que un componente lo pide: mientras `Button` pusiera
`bg-pw-green text-white` a mano, seguía eligiendo su propio color por debajo del sistema.

### Decisiones y por qué

**1. El color se pide como par, no como relleno.** El roadmap decía «repuntar el relleno al token», y
resultó insuficiente. En oscuro el relleno primario se aclara a `#6ba34a` y lo que va encima es tinta
oscura (`#0d1109`), no blanco: un `bg-button-primary-bg text-white` habría estado mal en la mitad de
los casos, y precisamente en el tema donde nadie mira. Los botones piden ahora **la pareja** —relleno
y su texto—, que es la unidad que `brandPalette.contrast.test.ts` mide en los dos temas. El tema
mueve las dos variables a la vez y el componente no se entera.

**2. El número del pilar necesitaba un consumidor de verdad.** Un `counter` en `Badge` que nadie
usara habría repetido exactamente el error que este repo ya tiene documentado en `typography.css`:
tokens definidos en el slice 2 que ningún componente consumía, y que por tanto no arreglaban nada.

El consumidor natural es el filtro de pilares, y ahí apareció un desajuste: **es un enlace, no un
chip**. Tiene estados activo/inactivo, borde propio y navega. Envolverlo en un `Badge` habría sido
meter una insignia dentro de un enlace solo para robarle el círculo. Así que el círculo se extrajo
como `BadgeCounter`, que ambos comparten: la forma se decide una vez, que es justo lo que este
primitivo vino a garantizar cuando en el slice 3 había tres insignias copiadas a mano.

**3. El número va `aria-hidden`, y esa es la decisión de fondo del slice.** Es una redundancia
**visual** para una limitación **visual**: existe porque Movimiento (`#3c7b0f`) y Mente (`#0369a1`)
contrastan 1.14 entre sí como tinta, y quien no distingue el tono no los separa *mirando*. Quien usa
un lector de pantalla no tiene ese problema — ya recibe «Movimiento», que es inequívoco—, así que
anunciar «3 Movimiento» alarga el nombre accesible de cada filtro sin añadir información.

La confirmación de que la decisión era correcta llegó sola: **los tres tests del filtro pasaron sin
tocarse**. Con el número anunciado, `getByRole("link", { name: "Movimiento" })` habría dejado de
encontrarlo — en Testing Library el nombre es exacto—, y habría habido que editar esas pruebas y
mirar de reojo el e2e. Que un cambio correcto no rompa ningún contrato existente es señal; que
obligue a reescribir aserciones de accesibilidad suele ser lo contrario.

**4. El número deja de estar implícito en el orden de un array.** `PUBLICATION_PILLARS` codificaba
1-2-3-4 en su orden, que es la peor forma de guardar un dato: cualquiera que reordene la lista por
gusto renumera los cuatro pilares sin enterarse. Ahora es un campo del dominio, como ya estaba
rotulado en `colors.css` desde el slice 3.

**5. Los tres tonos base del `Badge` eran anteriores a los tokens.** Salió al leerlo para añadir el
contador. `neutral` pintaba con `gray-200`/`gray-700` crudos de Tailwind —un gris azulado que sobre
el papel cálido del slice 10 se ve como una mancha fría en mitad de la tarjeta— y `brand`/`accent`
usaban una opacidad sobre el color de marca (`/15`, `/10`). Una opacidad es una forma de no decidir:
el fondo real depende de lo que haya debajo y la tinta no está elegida para él, así que su contraste
no se puede medir, solo suponer. Pasan al par `soft`/`ink` como los cuatro pilares, y **pierden sus
variantes `dark:`** — la variable ya cambia con el tema, que es la regla que sigue `Surface`.

Lo mismo le pasaba a `Alert`, con el mismo arreglo.

### Archivos tocados

**Primitivos** — `buttons/Button.tsx` (pares semánticos, `min-h-*` declarado, `rounded-control`,
`font-semibold`), `badges/Badge.tsx` (tonos base al par, `emphasis: solid`, `counter`, y
`BadgeCounter` extraído), `surfaces/Surface.tsx` y `feedback/Skeleton.tsx` (`radius: card | panel`),
`forms/InputShell.tsx` (`rounded-control`, `border-border-field`), `feedback/Alert.tsx` (pares
`soft`/`ink`, `rounded-control`).

**Dominio** — `entities/post/publicationPillars.ts`: el número del pilar, explícito.

**Consumidor** — `presentation/post/PublicationPillarFilter.tsx`.

**Pruebas** — `forms/InputShell.test.tsx` (nuevo; el componente no tenía prueba propia y cargaba dos
decisiones suyas), y casos nuevos en `Button`, `Badge`, `Surface`, `Alert`,
`PublicationPillarFilter` y `brandPalette.contrast`.

### Comandos

```bash
pnpm vitest run src/presentation/design_system/   # 264/264
pnpm run test:run                                 # 2143/2143 en 201 archivos
pnpm run typecheck                                # limpio
pnpm run lint                                     # limpio
pnpm run check:i18n / check:directives            # limpios
pnpm run build                                    # OK en 21.0s
```

### Validación

- **Las 14 utilidades nuevas se comprobaron en el CSS ya compilado**, no solo en el fuente. Tailwind
  v4 solo emite lo que encuentra usado, así que una clase mal escrita no falla: simplemente no
  existe, y el componente se queda sin ese estilo en silencio. Están las 14.
- **Los tests del filtro de pilares pasan sin editarse** (ver decisión 3).
- **Un fallo de `EditPostForm.test.tsx` resultó ser inestabilidad, no regresión.** Falló una vez en
  la suite completa (2137/2138) por un aviso de envío de formulario de React, pasó aislado, y las
  dos corridas completas siguientes dieron 2138 y 2143 sin tocar nada. No comparte nada con este
  slice — no mira clases ni colores.
- **Pendiente: la suite e2e completa.** No se ejecutó; la corre el usuario.

### Desviaciones del roadmap

Las tres de la sección «Lo que el slice enseñó» del roadmap: el par en vez del relleno, la
extracción de `BadgeCounter` con el número en el dominio, y los tonos base del `Badge`. Ninguna
amplía el alcance a pantallas: todo sigue dentro de `design_system/`, salvo el único consumidor que
hacía falta para que el contador no naciera muerto.

### Recap

Los primitivos ya hablan v2 y ninguna API cambió de nombre. Los botones piden su color como pareja
—que es lo que hace que el tema oscuro funcione sin que ellos lo sepan—, el `Badge` perdió sus
últimos grises azulados y sus variantes `dark:` a mano, `InputShell` estrenó el borde que sí
delimita, y `Alert` dejó de pintar con opacidades para tomar pares medidos. El aviso que
`pillarPalette.contrast.test.ts` dejó escrito en el slice 3 —que dos pilares no se distinguen solo
por luminosidad— por fin está atendido en la interfaz, y de la forma que no cuesta nada a quien usa
un lector de pantalla. La escala de radio del slice 10 ya tiene consumidores: `rounded-control` en
botones y campos, `card`/`panel` disponibles para cuando las pantallas los pidan.

### Próximos pasos (opciones)

1. **Correr la e2e completa** y mirar el sitio a ojo en los dos temas. Sigue pendiente de los dos
   slices, y está en tus manos.
2. **Slice 12 — header y feed.** Es lo que todo el mundo ve, y donde `rounded-card` empieza a
   sustituir a los 39 `rounded-2xl` y 44 `rounded-lg` sueltos.
3. **Los `dark:` que quedan.** El `Badge` se limpió; el árbol todavía tiene variantes `dark:`
   escritas a mano en otros sitios. Cada una es un color que no pasó por un token y que nadie mide.
   Un `grep -rn "dark:" src --include=*.tsx` da el inventario.
4. **`--brand-black` en oscuro**, que el slice 10 dejó anotado y este no tocó: los 3 `text-pw-black`
   siguen invisibles sobre fondo oscuro. Es de componente, y ya toca.

---

## Slice 12 — Header, feed y el último verde que hacía de tinta

**Fecha:** 2026-08-20 · **Rama:** `feat/design-system-v2`

### Objetivo

Repintar lo que todo el mundo ve —header y feed— con los primitivos del slice 11. Salió bastante
más que un repintado.

### Decisiones y por qué

**1. La marca tiene dos semillas, y la segunda arrastraba el mismo error que la primera.** El slice
10 encontró que `--brand-green` (`#538f39`) hacía de relleno y de tinta sin cumplir AA en ninguno de
los dos papeles. Al abrir `Card.tsx` para cambiarle el radio apareció `group-hover:text-pw-lightgreen`,
y tirando de ahí, lo mismo en otros 25 sitios:

| Uso | Par | Medido |
| --- | --- | --- |
| 26 `text-pw-lightgreen` (enlaces, precios, hovers) | `#5dbf17` sobre el papel | **2.35** |
| «Cargar más» del home | blanco sobre `#5dbf17` | **2.35** |
| Página actual de la paginación | blanco sobre `#5dbf17` | **2.35** |

`CurrencyAmount` era el peor de todos: **todos los precios del sitio**, en negrita, a 2.35:1 — menos
de la mitad del mínimo. Y los otros dos son los controles más pulsados del home.

Lo llamativo es que el arreglo ya estaba escrito. `--highlight` existe desde el slice 10 con la
descripción exacta de este uso —«verde de acento para marcar: palomitas, cifras, hover de
enlaces»— y resuelve a `#3f6f2a` en claro y al vivo en oscuro. Nunca se expuso a `@theme`, así que
no había forma de pedirlo desde una clase y todo el mundo escribía `text-pw-lightgreen`. Un token
sin utilidad es un token que no existe: **la misma lección del slice 11, dos capas más abajo.**

**2. Cero grises crudos de Tailwind en producción.** Eran 69 archivos. `text-gray-600
dark:text-gray-400` tiene dos problemas a la vez: el gris de Tailwind es azulado y sobre el papel
cálido del slice 10 se ve frío, y una pareja `claro`/`dark:` hay que acordarse de mantenerla —se
desincroniza sola—. `text-text-support` resuelve las dos cosas, y por eso el chrome se quedó sin una
sola `dark:` escrita a mano.

El barrido destapó un fallo que llevaba tiempo ahí: `SearchBar` pintaba sus esqueletos con
`bg-gray-200 dark:bg-gray-200` — **el mismo valor en los dos temas**, así que en oscuro quedaban
gris claro sobre fondo casi negro. Es el tipo de error que una pareja escrita a mano comete y un
token no puede cometer.

**3. La tarjeta sugiere que se puede pulsar, en vez de anunciarlo.** Al pasar el cursor dibujaba un
anillo naranja de 2px y subía a `shadow-xl` desplazándose 4px. Con la sombra negra anterior ese
grito era la única forma de que se notara; con las sombras verdes y más abiertas del slice 10, `md`
ya se ve. Queda en 2px de desplazamiento, que respeta la regla del sistema —nada se mueve más de
4px— y deja de convertir la tarjeta en un marco de color.

**4. Las insignias de estado dejan de teñir por opacidad.** `OrderStatusBadge` pintaba los siete
estados con `bg-pw-green/15`, `bg-pw-orange/15`, `bg-pw-lightgreen/20`. Una opacidad no es un color:
el fondo real depende de lo que haya debajo y la tinta no se eligió para él, así que su contraste no
se puede medir, solo suponer. Pasan al par `soft`/`ink` (4.56 a 7.55). De paso se arregla algo que
no era de contraste: `PREPARING` y `CONFIRMED` eran el mismo verde y se distinguían **solo por la
opacidad** —15% contra 20%—, que es como no distinguirse. `PREPARING` toma la miel.

### Archivos tocados

**Tinta de acento** — `tokens/colors.css` (`--color-highlight` expuesto) y los 22 archivos que
pedían `text-pw-lightgreen`.

**Controles con relleno de semilla** — `navigation/Pagination.tsx`, `(home)/PostsWithLoadMore.tsx`.

**Chrome** — `chrome/Header/{Nav,ListItem,UserMenu,MobileNav,MobileAccountCard}.tsx`,
`chrome/Footer/Footer.tsx`, `search/SearchBar.tsx`.

**Feed** — `post/Card/Card.tsx`, `design_system/surfaces/Surface.tsx` (realce de v2).

**Insignias y neutrales** — `orders/OrderStatusBadge`, `legal/LegalSectionHeading`, `media/*`, y el
barrido de grises por `src/app/` y `src/presentation/`.

### Comandos

```bash
pnpm run test:run                       # 2143/2143 en 201 archivos
pnpm run typecheck                      # limpio
pnpm run lint                           # limpio
pnpm run check:i18n / check:directives  # limpios
pnpm run build                          # OK en 24.7s
```

### Validación

- **Cero grises crudos de Tailwind** en `.tsx` de producción, y cero `dark:` a mano en el chrome.
  Comprobado con `grep`, no de memoria.
- **Las 9 utilidades nuevas verificadas en el CSS compilado**, y `--highlight` resolviendo a
  `var(--brand-green-700)` en claro y a `var(--brand-lightgreen)` en los dos bloques oscuros.
- **Los tests del header y del menú pasan sin editarse**: el repintado no movió un enlace de sitio,
  que era el criterio del slice.
- Un único test hubo que actualizar, `Surface.test.tsx`, que fijaba `hover:-translate-y-1` — el
  valor viejo. Se reescribió para asertar la intención (sube de elevación, salto menor a 4px) en vez
  del número.
- **Pendiente: la suite e2e completa.** No se ejecutó; la corre el usuario.

### Desviaciones del roadmap

El slice se planeó como repintado de header y feed, y creció a un barrido de contraste y neutrales
por todo el árbol. La causa fue encadenada y vale la pena dejarla escrita: abrir `Card.tsx` para
cambiarle el radio enseñó `text-pw-lightgreen` en el hover del título; buscar ese uso dio 26; buscar
el mismo verde como relleno dio los dos controles más pulsados del home. No era razonable dejar los
precios del sitio a 2.35:1 para el slice siguiente.

Lo que **no** se tocó: las páginas de contenido (`nosotros`, legales, pilares) conservan sus
acentos de color propios —azules, ámbar, zinc— con sus `dark:`. Son paletas de contenido, no de
sistema, y les toca el slice 13.

### Recap

El sistema ya no tiene ninguna semilla de marca haciendo de tinta: las dos —`#538f39` y `#5dbf17`—
están donde deben, identificando y rellenando, y las tintas salen de tokens medidos. Los precios del
sitio pasaron de 2.35 a 5.58 sobre el papel, y los dos controles más pulsados del home de 2.35 a
5.97. El chrome se quedó sin grises azulados y sin variantes `dark:` escritas a mano, así que el
tema oscuro ya no depende de que alguien se acuerde de mantener la pareja. La tarjeta del feed dejó
de gritar al pasar el cursor. Queda en pie exactamente lo que se acordó dejar: las pantallas de
contenido con sus paletas propias.

### Próximos pasos (opciones)

1. **Correr la e2e completa** y mirar el sitio a ojo en los dos temas. Es lo único pendiente de los
   tres slices, y sigue en tus manos.
2. **Slice 13 — publicar, detalle y tienda**, más las páginas de contenido que este slice dejó
   fuera: `nosotros` (29 `dark:`), las dos legales (26 entre las dos) y los pilares.
3. **`--brand-black` en oscuro**, que arrastra desde el slice 10: los `text-pw-black` siguen
   invisibles sobre fondo oscuro.
4. **Storybook**, que no se ha mirado desde que los tokens cambiaron de valor.
