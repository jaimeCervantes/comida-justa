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
- Se migró exitosamente la configuración a Tailwind CSS v4.

**Archivos Tocados:**
- **Configuración:** `package.json`, `biome.json`, `tailwind.config.ts` (eliminado), `postcss.config.mjs`.
- **Utilidades:** `src/presentation/design_system/styling/merge-class-names.ts`
- **Componentes:** `src/presentation/design_system/buttons/Button.tsx` (Migrado de `src/infra/UI/components/Button`)
- **Refactors (Imports):** Múltiples archivos para el componente Button y Tailwind v4.

---

## Slice 2: Sistema de Tokens CSS

**Objetivo:**
Crear un sistema unificado y escalable de tokens CSS para colores, tipografía y estructura visual, separándolos de la implementación específica de Tailwind, pero haciéndolos consumibles por él.

**Decisiones y Racional:**
- Se crearon los archivos `colors.css`, `typography.css`, `layout.css` y el entry point `tokens.css` dentro de `src/presentation/design_system/tokens/`.
- Se expusieron las variables de colores mapeadas como utilidades de Tailwind (`bg-pw-green`, etc.) a través de la directiva moderna `@theme` en `colors.css`.
- Se limpió el archivo `globals.css` centralizando las definiciones de tema en los tokens base, eliminando variables repetitivas y permitiendo fácil adaptación al dark mode.

**Archivos Tocados:**
- **Tokens:** `src/presentation/design_system/tokens/colors.css`, `src/presentation/design_system/tokens/typography.css`, `src/presentation/design_system/tokens/layout.css`, `src/presentation/design_system/tokens/tokens.css`
- **Estilos Globales:** `src/app/styles/globals.css`

**Resultados de Validación:**
- Build: Compilación exitosa de Next.js (Turbopack).
- Los tokens están en su lugar y listos para ser consumidos por los componentes.

### Recap
Se completó la segunda iteración estableciendo una base sólida de CSS puro para tokens visuales que interactúa de manera nativa con Tailwind CSS v4, logrando alta mantenibilidad para colores, espacios, sombras y tipografías.

### Próximos pasos (opciones)
1. **Migrar TextField:** Refactorizar el componente base para el input de texto usando los nuevos patrones.
2. **Migrar TextArea:** Hacer lo mismo con las cajas de texto enriquecido.
3. **Instalación de MSW:** Agregar Mock Service Worker para simulación de endpoints en pruebas e2e/unitarias.