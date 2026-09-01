# Header glass sigue el conmutador de tema

## Contexto

- Problem: al cambiar el tema manualmente desde el `ThemeToggle` del footer, el fondo del `Header`
  no toma la piel correcta; con `prefers-color-scheme` si cambia.
- Savings: se elimina una inconsistencia visual visible en todas las paginas y se reduce el riesgo
  de mantener dos caminos de tema que no pintan igual.
- Why: el sitio ya permite forzar claro, oscuro o automatico; esa eleccion tiene que mover todo el
  chrome, no solo las superficies basadas en tokens.

## Slice 1 - `.glass` consume tokens de tema

### Alcance

- Cambiar la utilidad `.glass` para que su fondo y borde dependan de tokens CSS que responden tanto
  a `prefers-color-scheme` como a `html[data-theme="dark"]`.
- Cubrir el comportamiento con el spec de tema existente o con un Playwright enfocado en el header.
- Mantener `ThemeToggle` y `Header` sin nueva logica de cliente: el arreglo pertenece a la capa de
  estilos.

### Criterios de aceptacion

- En modo automatico con sistema oscuro, el header no usa el papel claro.
- Tras forzar `data-theme="dark"` con el `ThemeToggle`, el header cambia al mismo tipo de superficie
  oscura aunque el navegador no este en `colorScheme: "dark"`.
- Tras forzar `data-theme="light"`, el header vuelve a una superficie clara aunque el sistema este
  oscuro.
- El cambio pasa `pnpm run test:run`, `pnpm run typecheck`, `pnpm run lint` y el Playwright scoped de
  chrome/tema cuando el stack local este disponible.
