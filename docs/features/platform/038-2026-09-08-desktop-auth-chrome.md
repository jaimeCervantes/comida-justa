# Desktop auth chrome

## Contexto

- Problem: en escritorio, la entrada a `/auth/signin?callbackUrl=%2F` muestra el chrome público y el
  panel de acceso desbordados: la barra superior queda cortada horizontalmente y el contenido del
  login se encima con la imagen.
- Savings: se reduce la frustración justo en la puerta de entrada a publicar, comentar o participar;
  también se evita diagnosticar como problema de autenticación lo que en realidad es un quiebre de
  layout.
- Why: iniciar sesión es el paso que convierte una visita en participación. Si esa pantalla se ve
  rota, la promesa de comunidad pierde confianza antes de que la persona elija proveedor.

## Slice 1 - Escritorio sin desbordes ni encimes

### Alcance

- Ajustar el header de escritorio para que sus acciones públicas quepan dentro del viewport sin
  crear scroll horizontal ni cortar el primer elemento visible.
- Convertir las acciones derechas del header de escritorio en botones de solo icono, manteniendo su
  nombre accesible.
- Ajustar la pantalla de inicio de sesión para que la imagen, el texto de contexto, los botones de
  proveedor y los términos se ordenen sin superponerse.
- Mantener los proveedores existentes: Google y Microsoft.
- Mantener el idioma, el callbackUrl y la ruta actual de acceso.

### Criterios de aceptación

- En un viewport desktop de 1536 x 900, `/auth/signin?callbackUrl=%2F` no produce overflow
  horizontal.
- El landmark `banner` completo cabe dentro del viewport y deja visibles las acciones públicas
  principales.
- Las acciones de "Publicar" e "Iniciar sesión" en la fila derecha del header no muestran texto
  visible en escritorio, pero conservan su nombre accesible.
- La tarjeta de acceso queda dentro del viewport y debajo del chrome.
- La imagen decorativa del acceso no cubre el texto ni los botones.
- Los botones "Iniciar sesión con Google" e "Iniciar sesión con Microsoft" quedan visibles y
  accionables.
- El texto legal queda después de los proveedores, no encima de ellos.
- `pnpm run test:run`, `pnpm run typecheck`, `pnpm run lint` y el Playwright scoped de
  `src/e2e/entrar/desktopSignInLayout.spec.ts` pasan cuando el stack local esté disponible.

### Fuera de alcance

- Cambiar proveedores de autenticación.
- Cambiar la lógica de `callbackUrl` o redirección post-login.
- Rediseñar la navegación móvil.
- Cambiar copy, marcas o catálogo de mensajes salvo que una etiqueta ya existente deba cablearse al
  test.
