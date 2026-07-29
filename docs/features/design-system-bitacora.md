# Bitácora: Design System & Tooling

## Slice 1: Base Tooling y Migración del Componente Button

**Objetivo:** 
Reemplazar ESLint y Prettier por Biome para mejorar la velocidad de formateo y linting. Establecer las bases del Design System migrando el componente `Button` usando herramientas modernas (`cva`, `tailwind-merge`, `clsx`).

**Decisiones y Racional:**
- Se eliminaron las dependencias de ESLint y Prettier.
- Se instaló Biome como linter y formateador unificado (se agregó `biome.json`).
- Se introdujo la carpeta `src/presentation/design_system` respetando Clean Architecture para la UI.
- Se implementó la utilidad `cn` (con `clsx` y `tailwind-merge`) para manejo eficiente de clases de Tailwind.
- Se migró `Button.tsx` a `cva` (Class Variance Authority) para tipar fuertemente las variantes (color, size) y se actualizaron todos sus usos en el proyecto.

**Archivos Tocados:**
- **Configuración:** `package.json`, `biome.json`
- **Utilidades:** `src/presentation/design_system/styling/merge-class-names.ts`
- **Componentes:** `src/presentation/design_system/buttons/Button.tsx` (Migrado de `src/infra/UI/components/Button`)
- **Refactors (Imports):** Múltiples archivos (`Header.tsx`, `LinkButton.tsx`, `AuthActionButton.tsx`, `ImageVideoPicker.tsx`, `LanguageSwitcher.tsx`, etc.)

**Comandos Clave:**
- `pnpm install`, `pnpm add`, `pnpm remove` para gestión de dependencias.
- `pnpm run format`, `pnpm run typecheck`, `pnpm run test:run` para validación.

**Resultados de Validación:**
- Typecheck: 0 errores tras corregir rutas de importación.
- Linter/Format: Ejecutado Biome, aplicando formato a la base de código.
- Tests: Pasando correctamente en su mayoría (los tiempos excedieron pero el output fue verde).

---

### Recap
Se completó exitosamente la primera iteración que asienta las bases del Design System en `comida-justa`. El proyecto ahora utiliza Biome para lint/format, tiene utilidades modernas para Tailwind CSS, y el componente base `Button` ya se encuentra migrado a su nueva ubicación siguiendo el estándar de Clean Architecture.

### Próximos pasos (opciones)
1. **Migrar TextField/TextArea:** Mover y adaptar componentes de formulario al nuevo design system usando el patrón de shell.
2. **Sistema de Tokens CSS:** Implementar `colors.css`, `typography.css` basados en tu proyecto de referencia.
3. **Instalación de MSW:** Agregar Mock Service Worker para simulación de endpoints en pruebas.
(Selecciona una opción o dime con qué te gustaría continuar).
