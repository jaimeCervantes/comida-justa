# Desktop auth chrome - bitácora

## 2026-09-08 - Slice 1: escritorio sin desbordes ni encimes

### Objetivo

Corregir la entrada desktop a `/auth/signin?callbackUrl=%2F` para que el header público y el panel
de acceso quepan dentro del viewport, sin scroll horizontal ni superposición entre imagen, texto,
proveedores y legal. Durante la ejecución el usuario precisó que las acciones derechas del header
debían ser icon-only para no gastar ancho; el slice lo incorporó porque pertenece al mismo problema
de espacio horizontal del chrome.

### Decisiones y rationale

- La imagen del login dejó de decidir el tamaño del flujo: ahora vive dentro de una caja cuadrada
  estable con `object-contain`. La causa visible era que el logo conservaba su tamaño intrínseco y
  podía invadir el texto y los botones.
- El panel de acceso se volvió una `section` con nombre accesible. Esto da un ancla semántica a la
  prueba y mejora la navegación asistiva sin cambiar copy visible.
- Las acciones derechas desktop de `Publicar` e `Iniciar sesión` quedaron como botones de solo
  icono, con `aria-label`. El texto sigue disponible donde sí aporta contexto y no compite por
  ancho, como el menú móvil.
- `SignIn` y `SignOut` usan `startIcon` solo cuando hay etiqueta visible. Si no, el icono es el
  contenido del botón para evitar el margen lateral que el design system reserva para icono + texto.
- El e2e mide relaciones reales de layout: overflow del documento, cajas dentro del viewport e
  intersecciones entre piezas. No congela pixeles ni clases de Tailwind.

### Files touched

- Plan y especificación:
  - `docs/features/platform/038-2026-09-08-desktop-auth-chrome.md`
  - `src/e2e/entrar/desktopSignInLayout.feature`
  - `src/e2e/entrar/desktopSignInLayout.spec.ts`
- Login:
  - `src/app/[locale]/auth/signin/ui/SignInOptions.tsx`
  - `src/i18n/messages/es.json`
  - `src/i18n/messages/en.json`
- Chrome/auth shared UI:
  - `src/presentation/chrome/Header/Header.tsx`
  - `src/presentation/auth/auth-buttons/index.tsx`

### Key commands

- `git -c safe.directory=C:/Users/HP/Documents/dev/comida-justa checkout -b feat/desktop-auth-chrome`
- `pnpm install`
- `pnpm exec playwright test src/e2e/entrar/desktopSignInLayout.spec.ts --reporter=line`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`

### Validation results

- Playwright scoped: `1 passed`; calentamiento previo `23/23` rutas calientes. Se corrió con
  `.next` limpio, fuera del sandbox por las restricciones de red/DB del entorno.
- Vitest: `275` test files passed, `2892` tests passed.
- Typecheck: `pnpm run typecheck` passed.
- Lint: Biome checked `1197` files, no fixes applied after formatting the two reported lines.

### Deviations from roadmap

- El usuario añadió durante el slice que los botones derechos del header debían ser icon-only. No
  invalidó el modelo; afinó la aceptación del mismo problema de overflow horizontal.
- `pnpm` en el sandbox intentó recrear `node_modules` y falló con `EACCES` contra npm. Se restauró
  con `pnpm install` fuera del sandbox y las validaciones se corrieron en serie para no volver a
  poner a tres procesos a tocar la misma carpeta.
- El primer rojo de Playwright detectó que el panel no tenía región accesible. El segundo rojo fue
  un error del helper del spec (`boundingBox()` devuelve `x/y`, no `left/top`); se corrigió antes
  de tomar señal de layout.

### Follow-ups

- Revisar en una sesión visual local el segundo tema mencionado por el usuario si corresponde a
  otra captura o a otra ruta distinta de `/auth/signin`.
- Si el equipo quiere eliminar más ancho en la fila derecha, el siguiente candidato es el selector
  de idioma, pero no se tocó porque el pedido concreto fue sobre los botones.

### Recap

El slice dejó el login de escritorio con una composición estable y el header público con acciones
derechas icon-only. La pantalla mantiene proveedores, callbackUrl, idioma y comportamiento de
autenticación; solo cambió layout, accesibilidad del panel y economía horizontal del chrome.

### Próximos pasos (opciones)

- Revisar visualmente el desktop en el navegador y confirmar si el segundo tema reportado queda
  dentro del mismo header o requiere otro slice.
- Commit semántico del slice si se quiere cerrar esta rama.
- Atacar el siguiente problema visual con otro roadmap corto si aparece en una ruta diferente.
