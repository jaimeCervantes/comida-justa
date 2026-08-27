# Bitácora — El conmutador de tema

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.16 · pie de página y 404**.
> Cierra lo que dejó pendiente [019 — la banda oscura](019-2026-08-22-pie-oscuro-bitacora.md) y
> repitió [021 — el pie sigue el tema](021-2026-08-23-pie-sigue-el-tema-bitacora.md): «el conmutador
> de tema que dibuja el canvas tampoco existe todavía en la aplicación... es su propio slice».

## Slice 1 — Automático → claro → oscuro, sin parpadeo (2026-08-27)

### Objetivo

Que quien visita pueda forzar claro u oscuro, en vez de depender solo del sistema operativo. La
capa de tokens ya soportaba los tres estados desde el slice 7 del design system original
(`prefers-color-scheme` + `[data-theme]`); lo único que faltaba era el interruptor.

### Decisiones y por qué

**Cookie, no `localStorage`.** El `<html>` tiene que nacer ya en el tema correcto: con
`localStorage` hace falta un script bloqueante en el `<head>` que lea la preferencia antes del
primer pintado, y aun así hay un instante sin CSS aplicado. Con una cookie, `RootLayout` la lee en
el servidor (`readThemePreference`) y escribe `data-theme` directamente en el HTML que manda —cero
parpadeo, cero script extra—. Es el mismo argumento que ya usa `hs_location`.

**El módulo se separó en dos desde el principio, y aun así se rompió una vez.** `themeCookie.ts`
(el nombre de la cookie, el tipo y el parseo) no puede importar `next/headers`: `ThemeToggle` es un
Client Component y necesita esas mismas constantes para escribir la cookie. La primera versión
metió `cookies()` en el mismo archivo y el build reventó con «you're importing a module that
depends on "next/headers"... in the Pages Router» — el árbol de importaciones de un Client
Component arrastró el módulo servidor-only completo. Es exactamente el defecto que
`022-2026-08-23-pilares-portada-practica-bitacora.md` ya documentó con `next-auth`: una constante
no puede traer una capa detrás. Se separó en `themeCookie.ts` (puro) y `readThemePreference.ts`
(con `cookies()`, solo lo importa `RootLayout`).

**Tres estados en un ciclo, no un desplegable.** Automático → claro → oscuro → automático con un
clic. Un `<select>` o un menú de Radix presentaría tres opciones para elegir de una lista, pero
aquí no hay lista: hay un estado actual y un siguiente paso, que es lo que un botón que rota ya
resuelve sin una segunda primitiva.

**Sin `useEffect` que sincronice nada.** El servidor manda el estado inicial correcto como prop; el
clic muta `document.documentElement.dataset.theme` y `document.cookie` directamente, fuera de
React. Pedirle esto a un Server Action —como hace la ubicación, con `revalidatePath("/", "layout")`—
habría re-renderizado el árbol entero por un atributo CSS que ningún dato del servidor necesita
conocer.

**El botón vive en el pie, no en el header.** El header ya está lleno —buscador, publicar, carrito,
cuenta, idioma— y el propio slice 5.1 lo redujo a una acción primaria, un avatar y el idioma
precisamente para no repetir ese error. El tema, a diferencia del idioma, no es de las primeras
cosas que alguien busca: el sitio ya sigue al sistema sin que nadie toque nada. El pie es sitio de
sobra.

**El nombre accesible describe el destino, no el estado.** En "oscuro", el botón se anuncia como
"Cambiar a tema automático" — lo que promete el próximo clic —, mientras el texto visible sigue
diciendo "Oscuro". Repetir el estado actual en el `aria-label` no le dice a quien usa lector de
pantalla qué va a pasar si pulsa.

**`data-testid`, no el nombre accesible, para encontrar el botón en las pruebas.** La primera
versión del e2e usaba `getByRole("button", { name: /Claro|Oscuro/ })`, y falló: el nombre accesible
cambia en cada estado y la prueba original ni siquiera acertó las mayúsculas contra el catálogo real
("Cambiar a tema claro", no "Claro"). Un `data-testid` estable separa "encontrar el control" de "qué
dice ahora mismo", que es justo lo segundo lo que sí vale la pena afirmar por separado.

**Tamaño `md`, no `xs` como el idioma.** El propio comentario de `buttonVariants` dice que `xs`/`sm`
"declaran su altura igual [a su relleno], para que se vea de un vistazo que no llegan [a 44px] y
nadie los ponga en un teléfono creyendo que sí". El conmutador de idioma vive en el header —una
barra densa de escritorio, con `xs` desde antes de este slice— pero el de tema vive en el pie, que
se ve también en el teléfono, y el objetivo táctil de 44px es una de las reglas de accesibilidad
que el propio canvas lista como no negociables.

**El descubrimiento que no estaba en el plan: el pie no tenía hueco para su propia barra
inferior.** Medido en un iPhone 13, la fila de "derechos + lema" del pie terminaba justo donde
empieza `BottomNav`, que es `fixed`. Con solo texto casi no se notaba; con un botón real ahí, era
intocable — cubierto por la barra de navegación del teléfono. `<main>` ya resuelve esto con
`pb-28 lg:pb-12`; el pie, al vivir fuera de `<main>`, nunca lo heredó. Mismo arreglo: `pb-28 lg:pb-8`
en el `<footer>`.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Cookie | `src/infra/theme/themeCookie.ts` (+ test), `readThemePreference.ts` (+ test, nuevos) |
| Presentación | `src/presentation/chrome/ThemeToggle/ThemeToggle.tsx` (+ test, nuevo) |
| Cableado | `src/app/[locale]/layout.tsx` (lee la cookie, `data-theme` en `<html>`), `Footer.tsx` (+prop `theme`, +padding móvil) |
| Catálogo | `es.json`, `en.json`: `footer.theme.{label,switchTo}.{system,light,dark}` |
| Especificación | `src/e2e/chrome/tema.spec.ts` (nuevo, sin `.feature` — un solo comportamiento autocontenido, igual que `pie.spec.ts`) |

### Comandos y resultados

```
pnpm exec vitest --run src/infra/theme src/presentation/chrome   # 86 en verde (10 archivos)
pnpm run typecheck    # limpio
pnpm run lint         # limpio (dos biome-ignore documentados: document.cookie es la API
                       # compatible con Safari/iOS; la Cookie Store API todavía no lo es)
pnpm run check:i18n   # limpio
pnpm exec playwright test src/e2e/chrome/tema.spec.ts        # 3/3
pnpm exec playwright test src/e2e/chrome/pie.spec.ts src/e2e/chrome/bottomNav.spec.ts  # 11/11
```

Verificado a ojo en `next dev`, en escritorio y en un iPhone 13 emulado: el ciclo cambia toda la
piel del sitio (incluidos los cuatro colores de pilar y el pie, que ya seguían al tema), y el botón
queda completo por encima de la barra inferior del teléfono.

### Recap

El sitio deja de depender solo del sistema operativo: un botón en el pie fuerza claro u oscuro, o
vuelve a automático, sin parpadeo porque el servidor ya manda el HTML en el tema correcto. De paso
se destapó que el pie nunca había dejado hueco para la barra inferior fija del teléfono — invisible
mientras solo tenía texto, y real en cuanto ganó un control que hay que poder tocar.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
2. **`5.14 · /carrito`, `5.15 · /cuenta`, `5.12`/`5.13`**: verificado en este slice que ya consumen
   los tokens del sistema; no queda trabajo visual pendiente ahí.
3. Las piezas que quedaron **fuera de alcance a propósito** en el roadmap original: ⌘K, barra fija
   de pilar+distancia, bottom nav de escritorio, cola offline, deshacer con 8s. Nadie las ha pedido
   todavía.
