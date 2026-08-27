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
2. **Llevar `AccountNav` a `/pedidos` y `/cuenta/agenda`**, para que la navegación persista dentro
   de toda la sección de cuenta y no solo en `/cuenta`. Es cuando gana sentido una prop `active`.
3. Las piezas que quedaron **fuera de alcance a propósito** en el roadmap original: barra fija de
   pilar+distancia, bottom nav de escritorio, cola offline, deshacer con 8s. Nadie las ha pedido
   todavía — y ⌘K ya estaba hecho desde antes de este slice, solo que enfoca el buscador en vez de
   abrir un panel de comandos.
