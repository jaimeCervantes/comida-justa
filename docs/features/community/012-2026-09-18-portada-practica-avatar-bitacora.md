# Bitácora — La portada de práctica se parte con el avatar de quien practica

## Slice único — Portada partida en tarjeta y ficha (2026-09-18)

**Objetivo.** Que una práctica publicada sin evidencia deje de mostrar solo el color y el número del
pilar: la mitad de arriba de `PracticeCover` pasa a ser el avatar de quien la publicó, y la de abajo
sigue siendo el sello del pilar.

**Decisiones + razón.**

- Se usa la condición ya existente (`kind === PRACTICE_POST_KIND && !media[0]`) para decidir cuándo se
  pinta esta portada: el usuario confirmó explícitamente que el avatar solo debía aparecer cuando no
  hay evidencia propia, que es justo lo que ya regía. No se tocó esa condición.
- Las mitades se apilan **verticalmente** (arriba avatar, abajo pilar), no lado a lado. Primer intento
  fue horizontal; el usuario lo corrigió antes de seguir adelante y se ajustó `flex-col` con `h-1/2`
  en cada mitad en vez de `flex-row` con `w-1/2`.
- El avatar reutiliza el componente `Avatar` ya existente (`src/presentation/user/Avatar`) en tamaño
  `md`, el mismo que usa el resto del sitio — no nace ningún tamaño ni componente de avatar nuevo.
- El sello del pilar sigue dibujado, no descargado — sin cambios ahí, ver el docstring de
  `PracticeCover`.
- Sin `.feature`/Playwright nuevo: es un cambio de solo render sobre un componente que ya solo tenía
  cobertura de componente (Vitest), sin navegación ni ida y vuelta a una API.

**Aviso de proceso.** El primer intento saltó a implementar (mitades lado a lado) después de que el
usuario aclarara la condición de "sin evidencia" sin haber cerrado explícitamente el alignment gate
con un "sí, adelante". El usuario lo señaló ("que pasó con el alignment gate") y se pausó antes de
seguir tocando archivos; se retomó solo tras la confirmación explícita del layout (arriba avatar, abajo
pilar).

**Archivos tocados.**

- `src/presentation/post/PracticeCover/PracticeCover.tsx` — recibe `user`, divide el área en dos
  mitades apiladas.
- `src/presentation/post/PracticeCover/PracticeCover.test.tsx` — dos pruebas nuevas: la mitad del
  avatar existe con usuario, y no revienta sin usuario.
- `src/presentation/post/CardForList/CardForList.tsx` — pasa `user` a `PracticeCover`; import de
  `PostUser`.
- `src/presentation/post/CardForList/CardForList.test.tsx` — la prueba de portada sin evidencia ahora
  también afirma que existe la mitad del avatar.
- `src/app/[locale]/[slug]/ui/PostDetail.tsx` — pasa `postDetails.user` a `PracticeCover`.
- `src/app/[locale]/[slug]/ui/PostDetail.test.tsx` — misma afirmación añadida.
- `docs/features/community/012-2026-09-18-portada-practica-avatar.md` — roadmap de este slice.

**Comandos clave.**

- `pnpm run typecheck` — limpio.
- `pnpm run test:run` — 278 archivos, 2931 pruebas, todas en verde (corrió la suite completa, no solo
  el filtro pedido; se reporta igual porque cubre de sobra el cambio).
- `pnpm run lint` — 1211 archivos revisados, sin hallazgos.

**Validación pendiente.** Ningún Playwright e2e nuevo ni existente cubre `practice-cover`; si se quiere
una verificación visual en navegador real, queda pendiente para quien lo pida.

### Ajuste — el avatar pasa de burbuja pequeña a llenar su mitad

El usuario probó el resultado y el avatar en tamaño `md` (45px) se veía diminuto contra la mitad de
128–144px de alto que le tocaba. Se agregó una variante `cover` a `Avatar`
(`src/presentation/user/Avatar/Avatar.tsx`): en vez de la burbuja circular de tamaño fijo, ocupa el
100% del alto y ancho de su contenedor y no redondea esquinas — el tamaño lo decide quien la usa
dándole dimensiones al contenedor, no el componente. `PracticeCover` ahora pasa `size="cover"` en la
mitad de arriba, sin el `flex items-center justify-center` que ya no hace falta.

Se reutilizó el componente existente en vez de escribir un segundo `Avatar` a mano: mismo respaldo de
iniciales, mismo `alt`, mismo manejo de Radix — solo cambia cómo llena su caja.

Validado de nuevo: `pnpm run typecheck` limpio; `pnpm exec vitest run` sobre los tres archivos
tocados (`PracticeCover`, `CardForList`, `PostDetail`) — 3 archivos, 64 pruebas, todas en verde;
`pnpm run lint` — sin hallazgos.

### Ajuste — espaciado de la mitad del pilar

El usuario pidió menos separación entre el sello (círculo + número) y el nombre del pilar, y más
aire entre ese contenido y el borde de su mitad. `gap-3` bajó a `gap-1` y se agregó `p-4` al
contenedor de esa mitad en `PracticeCover.tsx`. Solo Tailwind, sin lógica nueva.

### Ajuste — el avatar de Google se veía borroso/distorsionado en escritorio

**Causa.** El `image` de la sesión es la URL que entrega el proveedor tal cual; Google la recorta a
96px por omisión (sufijo `=s96-c` en la URL, ver `src/e2e/dummies/session.ts`). La variante `cover`
puede medir varios cientos de píxeles de lado en escritorio, y el navegador estira esos 96px para
llenar el hueco — se percibe como distorsión, aunque `object-cover` conserva la proporción.

**Arreglo.** Nueva función pura `largeGoogleAvatarUrl(url, size)` en
`src/domain/entities/user/avatarUrl.ts`: si la URL trae el sufijo `=sNN-c` de Google, cambia `NN` por
un tamaño mayor; cualquier otra URL (otro proveedor, una foto subida a mano) se devuelve intacta —no
hay sufijo seguro que reescribir ahí. `Avatar.tsx` la usa solo para `size="cover"`, pidiendo 480px
(`COVER_SOURCE_SIZE`); `sm`/`md` no cambian, les alcanza con lo que ya llega. No sube ni guarda nada
nuevo: es una URL distinta al mismo servicio que ya sirve la foto.

**Archivos.** `src/domain/entities/user/avatarUrl.ts` (nuevo) y su test
`avatarUrl.test.ts` (5 pruebas: recorte de Google reescrito, y las URLs sin ese sufijo intactas);
`src/presentation/user/Avatar/Avatar.tsx` (usa la función solo en `cover`).

Validado: `pnpm run typecheck` limpio; `pnpm run lint` — 1213 archivos, sin hallazgos; `pnpm exec
vitest run` sobre `avatarUrl.test.ts` + los tres archivos de las mitades — 4 archivos, 69 pruebas,
todas en verde.

**Fuera de alcance.** Microsoft Entra ID no siempre trae foto en el token (requiere una llamada
aparte a Microsoft Graph); ese caso ya cae en el respaldo de iniciales del propio `Avatar`, sin
cambios aquí.

## Recap

`PracticeCover` ahora muestra, para una práctica sin evidencia, el avatar de quien la practicó en la
mitad de arriba y el sello del pilar en la de abajo, tanto en la tarjeta del feed (`CardForList`) como
en la ficha (`PostDetail`). Sin foto de perfil, cae en el mismo respaldo de iniciales que usa el resto
del sitio. El cambio es solo de render, sin tocar la condición que decide cuándo se pinta esta
portada ni el modelo de datos.

## Próximos pasos (opciones)

- Nada pendiente de aprobación: el slice quedó cerrado con typecheck, lint y suite completa en verde.
- Si se quiere, se puede pedir una corrida manual de `pnpm run dev` para mirar la portada en el
  navegador antes de dar por buena la proporción 50/50 entre las dos mitades.
- Queda abierto si se quiere commitear ahora esta rama (`feat/portada-practica-avatar`) o seguir
  iterando el diseño antes de empujar.
