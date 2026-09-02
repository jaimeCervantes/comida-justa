# ThemeToggle en header

## Contexto

- Problem: el conmutador de tema vive solo en el footer; cambiar claro, oscuro o automatico queda
  escondido al final de la pagina aunque el header y el menu movil tienen espacio para ofrecerlo.
- Savings: se reduce la friccion de cambiar tema desde cualquier punto de navegacion, sin obligar a
  bajar al footer.
- Why: el tema es una preferencia global del sitio y debe estar disponible en el chrome principal,
  igual que otras preferencias globales como idioma.

## Slice 1 - Reutilizar ThemeToggle en header y menu movil

### Alcance

- Pasar `themePreference` desde `RootLayout` a `Header`, igual que hoy se pasa a `Footer`.
- Reutilizar `ThemeToggle` en la zona de acciones del header de escritorio.
- Reutilizar el mismo `ThemeToggle` dentro del panel del menu movil.
- Mantener el `ThemeToggle` del footer por compatibilidad visual y para no quitar una entrada ya
  existente.
- Ajustar las pruebas para distinguir los toggles por region, no por un `data-testid` unico global.

### Criterios de aceptacion

- En escritorio, el landmark `banner` muestra un conmutador de tema.
- En movil, al abrir el menu, el panel muestra un conmutador de tema.
- Un click en el conmutador del header cambia `html[data-theme]` y mantiene el mismo ciclo existente:
  automatico -> claro -> oscuro -> automatico.
- El footer conserva su conmutador.
- `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:run` y el Playwright scoped de tema/chrome
  pasan cuando el stack local este disponible.

### Fuera de alcance

- Quitar el conmutador del footer.
- Redisenar el ciclo de tres estados.
- Cambiar labels, iconos o persistencia de cookie del `ThemeToggle`.
