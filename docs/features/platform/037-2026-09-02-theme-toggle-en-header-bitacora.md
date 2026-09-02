# Bitacora - ThemeToggle en header

## 2026-09-02 - Slice 1: ThemeToggle visible en header y menu movil

### Objetivo

Hacer que la preferencia global de tema se pueda cambiar desde el chrome principal: header de
escritorio, panel del menu movil y footer existente.

### Decisiones y racional

- Se reutilizo `ThemeToggle` en lugar de crear un control nuevo, porque el ciclo, las etiquetas y la
  persistencia ya estaban resueltos en un componente compartido.
- `RootLayout` ahora entrega `themePreference` al `Header`, igual que al `Footer`, para que el estado
  inicial renderizado por servidor sea consistente entre entradas.
- Se agrego sincronizacion por evento de navegador entre instancias montadas. Sin esto, cambiar el
  tema desde header podia dejar el toggle del footer mostrando el estado anterior hasta el siguiente
  render.
- Las pruebas e2e ubican el control por region (`banner`, `footer`, `mobile-menu`) para evitar
  depender de un `data-testid` global unico cuando ahora hay varias instancias correctas.

### Archivos tocados

- Chrome:
  - `src/app/[locale]/layout.tsx`
  - `src/presentation/chrome/Header/Header.tsx`
  - `src/presentation/chrome/Footer/Footer.tsx`
  - `src/presentation/chrome/ThemeToggle/ThemeToggle.tsx`
- Pruebas:
  - `src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx`
  - `src/e2e/chrome/theme-toggle-header.feature`
  - `src/e2e/chrome/theme-toggle-header.spec.ts`
  - `src/e2e/chrome/tema.spec.ts`
  - `src/e2e/chrome/header-glass-theme-toggle.spec.ts`
- Documentacion:
  - `docs/features/platform/037-2026-09-02-theme-toggle-en-header.md`
  - `docs/features/platform/037-2026-09-02-theme-toggle-en-header-bitacora.md`

### Comandos clave

- `pnpm exec playwright test src/e2e/chrome/theme-toggle-header.spec.ts`
- `pnpm exec vitest --run src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm exec playwright test src/e2e/chrome/theme-toggle-header.spec.ts src/e2e/chrome/tema.spec.ts src/e2e/chrome/header-glass-theme-toggle.spec.ts`
- `pnpm run test:run`

### Validacion

- Playwright inicial rojo antes de implementar: 2 fallaron y 1 paso en
  `src/e2e/chrome/theme-toggle-header.spec.ts`; faltaba el toggle en `banner` y `mobile-menu`.
- Vitest focalizado de `ThemeToggle`: 5 tests pasados.
- `pnpm run lint`: paso sobre 1063 archivos despues de ajustar formato.
- `pnpm run typecheck`: paso. Durante dos corridas se detectaron tipos corruptos bajo
  `.next/dev/types`; se elimino solo ese directorio generado y Next lo reconstruyo correctamente.
- Playwright scoped de chrome/tema: 8 escenarios pasados en 7.5 minutos.
- `pnpm run test:run`: 234 archivos de prueba y 2537 tests pasados en 355.12 segundos.

### Desviaciones del roadmap

- Se agrego sincronizacion entre instancias del `ThemeToggle`, aunque no estaba explicitada en el
  roadmap. Fue necesario porque ahora el mismo control existe varias veces en la misma pagina.
- Se ajustaron specs e2e existentes para consultar el toggle por landmark o contenedor, ya que el
  `data-testid` global dejo de ser unico por diseno.

### Follow-ups

- Los logs de e2e mostraron errores 404 de `GET /api/posts` durante carga incremental en home, pero
  no bloquearon los escenarios de theme toggle.
- Vitest conserva warnings existentes de `jsdom`/React en pruebas de media; quedaron fuera de alcance
  porque no pertenecen al cambio de header.

### Recap

El `ThemeToggle` ahora esta disponible en el header de escritorio y dentro del menu movil, sin quitar
el acceso del footer. Las instancias se mantienen sincronizadas cuando una cambia la preferencia, y
la cobertura e2e valida header, menu movil y footer por region.

### Próximos pasos (opciones)

- Crear el commit semantico de esta slice cuando se quiera cerrar la rama.
- Revisar en UI real si la densidad del header queda comoda en anchos intermedios.
- Atender en otra slice los warnings existentes de tests de media si se desea limpiar la salida de
  Vitest.

## 2026-09-02 - Ajuste: ThemeToggle icon-only en header

### Objetivo

Permitir que `ThemeToggle` pueda renderizarse sin texto visible para que las instancias del header y
del menu movil usen solo iconos, conservando el texto completo en el footer.

### Decisiones y racional

- Se agrego `showLabel?: boolean` con default `true`. Asi el comportamiento existente se mantiene en
  footer y en cualquier uso futuro que no pida el modo compacto.
- En modo sin etiqueta, el icono se renderiza como contenido del boton y no como `startIcon`, porque
  `Button` agrega margen a `startIcon` pensado para icono + texto.
- El nombre accesible sigue viniendo de `aria-label`, por lo que quitar el texto visible no reduce la
  navegacion con lector de pantalla.
- Se respeto la instruccion de no correr e2e y se valido solo el componente, mas lint y typecheck.

### Archivos tocados

- Chrome:
  - `src/presentation/chrome/Header/Header.tsx`
  - `src/presentation/chrome/ThemeToggle/ThemeToggle.tsx`
- Pruebas:
  - `src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx`
- Documentacion:
  - `docs/features/platform/037-2026-09-02-theme-toggle-en-header-bitacora.md`

### Comandos clave

- `pnpm exec vitest --run src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx`
- `pnpm run lint`
- `pnpm run typecheck`

### Validacion

- Vitest focalizado de `ThemeToggle`: 6 tests pasados en la corrida final, 10.73 segundos.
- `pnpm run lint`: paso sobre 1063 archivos.
- `pnpm run typecheck`: paso.
- No se corrio Playwright/e2e por instruccion explicita del usuario.

### Desviaciones del roadmap

- El roadmap original no mencionaba modo icon-only. El ajuste reduce ancho ocupado por las nuevas
  instancias del header sin cambiar el ciclo ni la persistencia del tema.

### Follow-ups

- Confirmar visualmente en navegador si el boton cuadrado de 48px es el tamano deseado para desktop
  y movil.

### Recap

`ThemeToggle` ahora soporta modo compacto sin texto visible mediante `showLabel={false}`. El header y
el menu movil usan ese modo; el footer conserva la etiqueta visible completa.

### Próximos pasos (opciones)

- Crear el commit semantico de la slice completa.
- Ajustar el tamano visual del boton si al verlo en navegador se prefiere una medida menor para
  escritorio.
