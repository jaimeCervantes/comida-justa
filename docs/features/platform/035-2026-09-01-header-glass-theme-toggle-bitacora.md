# Bitácora — Header glass sigue el conmutador de tema

## Slice 1 — `.glass` consume tokens de tema (2026-09-01)

### Objetivo

Corregir la superficie del `Header` cuando el tema se fuerza desde `ThemeToggle`: el sitio ya
seguía bien `prefers-color-scheme`, pero `.glass` dependía de `dark:` y por eso no reaccionaba igual
al atributo `html[data-theme]`.

### Decisiones y rationale

**El arreglo vive en tokens y utilidad CSS, no en React.** `ThemeToggle` ya escribe
`data-theme="light" | "dark"` en `<html>` y el layout ya hidrata el estado inicial desde cookie. El
desfase estaba en `.glass`: usaba `dark:bg-black/70` y `dark:border-gray-800`, que Tailwind resuelve
contra la preferencia del sistema. Cambiar el componente habría duplicado lógica de tema donde no
corresponde.

**`--glass-background` y `--glass-border` quedan junto a los tokens de color.** Es la misma estrategia
que las superficies y separadores: claro vive en `:root`, oscuro se repite en la media query y en
`:root[data-theme="dark"]`. La prueba `darkThemeParity.test.ts` protege que ambos oscuros sigan
idénticos.

**El e2e mide luminancia, no hex exactos.** La promesa es "superficie clara u oscura según la
elección manual", no un valor concreto de paleta. Por eso el Playwright mide el `backgroundColor`
computado del landmark `banner` y afirma umbrales de luminancia.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Documentación | `docs/features/platform/035-2026-09-01-header-glass-theme-toggle.md`, `docs/features/platform/035-2026-09-01-header-glass-theme-toggle-bitacora.md` |
| Especificación | `src/e2e/chrome/header-glass-theme-toggle.feature`, `src/e2e/chrome/header-glass-theme-toggle.spec.ts` |
| Estilos | `src/presentation/design_system/tokens/colors.css`, `src/app/styles/globals.css` |

### Comandos clave

```bash
pnpm exec vitest --run src/presentation/design_system/tokens/darkThemeParity.test.ts src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm exec playwright test src/e2e/chrome/header-glass-theme-toggle.spec.ts
```

### Validación

- `pnpm exec vitest --run src/presentation/design_system/tokens/darkThemeParity.test.ts src/presentation/chrome/ThemeToggle/ThemeToggle.test.tsx`: 2 archivos, 7 pruebas en verde.
- `pnpm run test:run`: 233 archivos, 2534 pruebas en verde.
- `pnpm run typecheck`: limpio.
- `pnpm run lint`: limpio; 1060 archivos revisados.
- `pnpm exec playwright test src/e2e/chrome/header-glass-theme-toggle.spec.ts`: 2/2 escenarios en verde, ejecutado fuera del sandbox porque el primer intento no pudo acceder a PostgreSQL/local network (`EACCES`/`ETIMEDOUT`).

### Desviaciones del roadmap

El primer intento de Playwright no sirvió como rojo de producto porque el sandbox bloqueó consultas
de la home contra PostgreSQL. Ya fuera del sandbox, el primer selector del spec también fue demasiado
genérico: `header` encontraba el header global y uno de sección. Se corrigió a `getByRole("banner")`,
que apunta al landmark global del chrome.

### Follow-ups

No quedan cambios pendientes para este slice. Si aparecen más utilidades con `dark:` que deban seguir
el tema forzado, conviene migrarlas al mismo patrón de token semántico.

### Recap

El `Header` ya no depende de la variante `dark:` para su cristal: `.glass` pinta con
`--glass-background` y `--glass-border`, tokens que cambian tanto por preferencia del sistema como
por `data-theme`. El toggle del footer no necesitó cambios; al forzar claro u oscuro, el chrome
global sigue la elección manual.

### Próximos pasos (opciones)

1. Revisar otras utilidades globales que todavía usen `dark:` y deban responder al tema forzado.
2. Hacer una pasada visual manual en rutas largas con header sticky para confirmar el efecto con
   scroll y contenido debajo.
3. Cerrar este slice sin trabajo adicional: las pruebas unitarias, lint, typecheck y e2e scoped ya
   están verdes.
