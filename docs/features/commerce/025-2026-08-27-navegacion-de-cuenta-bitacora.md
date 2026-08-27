# Bitácora — La navegación interna de /cuenta

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.15 · /cuenta · abrir tienda
> y sucursales**. Continúa
> [024 — la dirección de la tienda, corta y compartible](024-2026-08-23-cuenta-direccion-compartible-bitacora.md),
> que revisó las tres anotaciones del formulario de "abrir tienda" y dejó fuera —sin decirlo— el
> menú lateral que el canvas dibuja al lado.

## Slice 1 — Cinco entradas, dos de ellas condicionadas (2026-08-27)

### Lo que el usuario notó y la bitácora anterior no vio

El 024 revisó tres anotaciones del 5.15 y las tres eran del formulario de abrir tienda. El canvas
también dibuja, al lado de ese formulario, un menú de cinco entradas —Mi cuenta, Mis
publicaciones, Pedidos, Agenda, Mis hábitos—, y ese menú **no entró en ninguna revisión**. El
usuario lo notó usando el sitio: "creo que falta la sección de /cuenta".

### Lo que ya existía, disperso

Las cinco entradas no eran nuevas — cuatro de ellas ya vivían en `UserMenu` (el menú del avatar):
Mi tienda, Agenda, Mi perfil, Mis pedidos, Mi cuenta. Lo que faltaba de verdad era más concreto:

- **"Mis hábitos" no tenía ningún camino desde la cuenta.** `/habitos` es una página pública, sin
  enlace desde `/cuenta` ni desde `UserMenu`.
- **`/cuenta` no tenía navegación propia.** Es un encabezado y dos columnas de tarjetas — para
  moverse a pedidos, agenda o hábitos había que volver al avatar del header.

### No reinventa destinos

**"Mis publicaciones" lleva al mismo lugar que "Mi perfil" en `UserMenu`.** No existe una pantalla
separada de "administrar mis publicaciones": `ProfilePublications` —la que pinta `/u/[username]`—
ya resuelve quién mira y le ofrece editar y marcar agotado sus propias publicaciones cuando es su
propio perfil. Construir una segunda pantalla con otro nombre habría sido duplicar lo que ya
existe. Dos puertas al mismo cuarto no es un defecto: es el mismo patrón que ya usa `UserMenu` con
"Mi tienda"/`storeHref`.

### El mismo filtro que ya resolvió `UserMenu`

Sin dirección personal reclamada no hay perfil que enseñar, y sin tienda abierta la agenda no
sirve para nada. `AccountNav` oculta esas dos entradas en vez de llevar a dar de alta lo que
falta — el comentario de `UserMenu` ya lo decía: "no se pinta una entrada que lleve a dar de alta
lo que falta: para eso ya está «Mi cuenta»".

### Sin prop `active`

Solo `/cuenta` monta este menú por ahora, así que "Mi cuenta" es siempre la entrada activa —
`aria-current="page"` fijo, no calculado. El día que `/pedidos` o `/cuenta/agenda` lo hereden es
cuando toca decidir cuál está activa desde fuera; añadir esa prop hoy, sin un segundo consumidor,
habría sido la misma abstención especulativa que este repo evita en otros sitios.

### El hallazgo del layout: `240px minmax(0, 1fr)`, tal cual el canvas

El canvas ya resuelve el reparto —`grid-template-columns: 240px minmax(0, 1fr)`— y se adoptó
literal, envolviendo el `<h1>` y las dos columnas existentes (`COLUMNS`) como segunda columna del
nuevo grid. En el teléfono se apila: verificado en un iPhone 13 emulado que las tres u cuatro
entradas visibles caben antes del título, sin empujar el formulario más de lo que ya lo hacía el
encabezado del sitio.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `src/app/[locale]/cuenta/ui/AccountNav.tsx` (+ test, nuevo) |
| Ruta | `src/app/[locale]/cuenta/page.tsx` (+`PAGE_LAYOUT`, monta `AccountNav` en las dos ramas) |
| Catálogo | `es.json`, `en.json`: `nav.myHabits`, `nav.myPublications` (nuevas); reusa `nav.myAccount`, `nav.myOrders`, `nav.schedule` |
| Especificación | `src/e2e/compartir/cuentaLayout.spec.ts` (+3 escenarios, mismo archivo que ya prueba la forma de `/cuenta`) |

### Comandos y resultados

```
pnpm exec vitest --run "src/app/[locale]/cuenta" src/presentation/chrome/Header   # 51 en verde
pnpm run typecheck    # limpio
pnpm run lint         # limpio
pnpm run check:i18n   # limpio
pnpm exec playwright test src/e2e/compartir/cuentaLayout.spec.ts   # 7/7 (3 nuevos)
```

Verificado a ojo contra `next dev` con una cuenta real (sesión insertada directo en `sessions`,
sin pasar por OAuth): escritorio y un iPhone 13 emulado, con y sin tienda abierta.

### Recap

`/cuenta` deja de ser una página sin salida propia: un menú a la izquierda —el mismo
`240px minmax(0, 1fr)` del canvas— ofrece Mi cuenta, Mis pedidos y Mis hábitos siempre, y Mis
publicaciones y Agenda solo cuando hay algo que enseñar en cada una. No se construyó ninguna
pantalla nueva: "Mis publicaciones" reutiliza el perfil público que ya editaba sus propias
publicaciones, y el filtro de qué mostrar es el mismo que `UserMenu` ya había resuelto.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
2. Las piezas que quedaron **fuera de alcance a propósito** en el roadmap original: barra fija de
   pilar+distancia, bottom nav de escritorio, cola offline, deshacer con 8s. Nadie las ha pedido
   todavía — y ⌘K ya estaba hecho desde antes de este slice, solo que enfoca el buscador en vez de
   abrir un panel de comandos.

## Slice 2 — La navegación viaja a /pedidos y /cuenta/agenda (2026-08-27)

### Objetivo

Que la sección de cuenta se sienta como una sola sección: hasta este slice, `AccountNav` solo
vivía en `/cuenta`, así que salir a "Mis pedidos" o "Mi agenda" perdía la navegación a mitad de
camino — quien llegaba desde el menú se quedaba sin ella justo en la página siguiente.

### `active` deja de ser una suposición

El slice 1 dejó escrito que "Mi cuenta" era la única entrada activa **porque solo `/cuenta` la
montaba**, y que el día que otra página la heredara era cuando ganaba sentido decirlo desde fuera.
Ese día es este: `active` pasa de no existir a ser una unión obligatoria
(`"account" | "orders" | "schedule"`), y cada una de las tres páginas dice de cuál es.
"Publicaciones" se queda fuera de la unión a propósito — lleva a `/u/[username]`, que no monta
este menú.

### El layout se movió, no se copió

`PAGE_LAYOUT` vivía como una constante privada en `cuenta/page.tsx`. Con tres consumidores, una
constante idéntica en tres archivos es la misma clase de deuda que ya resolvió `Badge` en el
slice 3 del design system: se movió a `AccountNav.tsx` como `ACCOUNT_PAGE_LAYOUT` — vive junto al
componente que define para qué sirve el hueco de 240px, y las tres páginas la importan en vez de
repetir la cadena de Tailwind.

### `/pedidos` y `/cuenta/agenda` ya leían al vendedor; les faltaba el perfil

Las dos páginas ya consultaban `findSellerOfUser`/`createSellerRepository().findByUserId` para su
propia lógica (si hay vista de "lo que me pidieron", si hay tienda a la que colgar un horario).
Lo único que faltaba era `findProfileOfUser`, en paralelo con la consulta que ya hacían — el mismo
`Promise.all` que usa `/cuenta` desde el slice 1.

### El caso sin tienda en `/cuenta/agenda` también lleva el menú

Esa página ya tenía una rama corta —"necesitas tu tienda abierta"— para quien no vende. Antes de
este slice era un `<main>` con un párrafo suelto; ahora también monta `AccountNav` con
`hasStore={false}`, que oculta su propia entrada de "Mi agenda". Es la misma decisión que ya
tomaba `/cuenta` sin tienda: la navegación no desaparece porque una sección no aplique, se ajusta.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `src/app/[locale]/cuenta/ui/AccountNav.tsx` (+test): `active` obligatoria, `ACCOUNT_PAGE_LAYOUT` exportada |
| Rutas | `src/app/[locale]/cuenta/page.tsx` (pasa `active="account"`, importa el layout movido), `pedidos/page.tsx`, `cuenta/agenda/page.tsx` (montan `AccountNav` por primera vez) |
| Especificación | `src/e2e/compartir/cuentaLayout.spec.ts` (+2 escenarios) |

### Comandos y resultados

```
pnpm exec vitest --run "src/app/[locale]/cuenta" "src/app/[locale]/pedidos"   # 24 en verde
pnpm run typecheck · typecheck:tests · lint · check:i18n   # limpios
pnpm exec playwright test src/e2e/compartir/cuentaLayout.spec.ts   # 9/9 (2 nuevos)
pnpm exec playwright test src/e2e/orders   # 32/32 — sin regresión por el nuevo layout
```

### Recap

Las tres páginas privadas de la cuenta —`/cuenta`, `/pedidos`, `/cuenta/agenda`— comparten ahora la
misma navegación lateral, cada una marcando su propia entrada como activa. El layout de 240px dejó
de estar copiado y pasó a vivir con el componente que lo necesita, y las dos páginas nuevas
reusaron datos que ya estaban pidiendo.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
2. Las piezas que quedaron **fuera de alcance a propósito** en el roadmap original: barra fija de
   pilar+distancia, bottom nav de escritorio, cola offline, deshacer con 8s. Nadie las ha pedido
   todavía.
