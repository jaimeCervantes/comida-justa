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
3. **Typechequear los tests:** medido en 32 errores (ver `docs/features/pendientes.md`).

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
1. **Typechequear los tests**, medido en 32 errores (`docs/features/pendientes.md`).
2. **La deuda que necesita Alembic**: `UNIQUE(post_id, locale)`, índices GIN/HNSW, tabla de
   búsquedas.
3. **Slice 5 de i18n**: `sellers` y `branches` siguen en un solo idioma.
