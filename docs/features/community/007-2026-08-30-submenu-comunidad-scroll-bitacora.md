# Bitácora - Scroll interno del submenú de Comunidad

Append-only. Roadmap en `docs/features/community/007-2026-08-30-submenu-comunidad-scroll.md`.

## 2026-08-30 - Slice 1: Submenú completo con scroll interno

### Objetivo

Hacer que el desplegable de Comunidad en escritorio no rebase el viewport y que el enlace final
`Nosotros` siga siendo alcanzable aunque el contenido crezca con más categorías.

### Decisiones y rationale

- El scroll se puso en el `NavigationMenu.Viewport`, no en una sección interna. La persona desplaza
  el panel completo y no tiene que descubrir qué bloque específico quedó recortado.
- El límite usa `max-height: calc(100vh - 5.5rem)`: depende del viewport y deja espacio para la
  cabecera y la separación ya medida entre control y panel.
- El scrollbar vive en una utility CSS (`submenu-scroll-y`) para no convertir el `className` del
  componente en una mezcla ilegible de selectores WebKit y propiedades de Firefox.
- Al correr la suite scoped aparecieron dos specs viejos que buscaban `Nosotros` como enlace raíz o
  píldora de primer nivel. Se alinearon con el chrome vigente: el enlace top-level visible para
  probar el clic fuera es `Catálogo`, y `Nosotros` se alcanza dentro de Comunidad en móvil.

### Files touched

- **Producto:** `src/presentation/chrome/Header/Nav.tsx`,
  `src/app/styles/utility-patterns.css`.
- **E2E:** `src/e2e/menu/communitySubmenuScroll.feature`,
  `src/e2e/menu/communitySubmenuScroll.spec.ts`,
  `src/e2e/menu/headerMenus.feature`, `src/e2e/menu/headerMenus.spec.ts`,
  `src/e2e/menu/menu.feature`, `src/e2e/menu/mobileMenu.spec.ts`.
- **Documentación:** `docs/features/community/007-2026-08-30-submenu-comunidad-scroll.md`,
  `docs/features/community/007-2026-08-30-submenu-comunidad-scroll-bitacora.md`.

### Key commands

- `pnpm exec playwright test src/e2e/menu/communitySubmenuScroll.spec.ts`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/menu`

### Validation results

- Rojo inicial confirmado: el nuevo caso E2E midió el submenú con bottom `816.56px` en un viewport
  de `560px`.
- `pnpm exec playwright test src/e2e/menu/communitySubmenuScroll.spec.ts`: **1/1 passed**.
- `pnpm run test:run`: **229/229 archivos**, **2505/2505 tests passed**.
- `pnpm run typecheck`: **passed**.
- `pnpm run lint`: **1043 files checked**, **passed**.
- `pnpm exec playwright test src/e2e/menu`: **21/21 passed**.

### Deviations from roadmap

- Además del slice de escritorio, se actualizaron dos specs existentes que habían quedado detrás de
  la estructura actual del menú. No cambian comportamiento de producto; corrigen la prueba para que
  vuelva a afirmar la promesa vigente.
- La corrida E2E scoped escribió datos reversibles de sesión por el escenario existente del menú de
  avatar; su `afterEach` elimina la sesión creada con `deleteSession`.

### Follow-ups

- Cuando entren más categorías, este mismo caso debe seguir pasando sin tocar la cabecera.
- Si el equipo quiere una pista visual de que hay más contenido abajo además del scrollbar, se puede
  añadir un fade vertical después de validar que no estorbe al área clicable.

### Recap

El submenú desktop de Comunidad queda limitado al alto de la pantalla y se desplaza por dentro, con
un scrollbar discreto que usa tokens del sistema. El enlace `Nosotros` vuelve a ser alcanzable en
pantallas bajas y la suite scoped del menú conserva los comportamientos existentes.

### Próximos pasos (opciones)

1. Revisar visualmente el menú en desktop real con Comunidad abierto y confirmar que el scrollbar se
   siente suficientemente visible.
2. Agregar una pista de fade vertical si el scrollbar solo no comunica bien que hay más contenido.
3. Continuar con nuevas categorías; el panel ya está preparado para crecer sin ocultar enlaces.

## 2026-08-30 - Slice 2: Nosotros junto a los enlaces principales

### Objetivo

Mover `Nosotros` al primer bloque del submenú desktop de Comunidad para que viva junto a
`Publicaciones`, `Productos y servicios` y `Eventos`, sin perder el scroll interno del slice 1.

### Decisiones y rationale

- `Nosotros` pasó al primer `ul` del desplegable. Es la forma más pequeña de reflejar la jerarquía
  pedida: accesos principales arriba, luego categorías, luego secciones.
- Se eliminó el separador final que lo aislaba visualmente. Con `Nosotros` arriba, ese bloque ya no
  tenía responsabilidad.
- La prueba de scroll dejó de usar `Nosotros` como contenido final. Ese comportamiento cambió por
  diseño; ahora el scroll se protege con `Negocios locales`, que queda al final del contenido actual.

### Files touched

- **Producto:** `src/presentation/chrome/Header/Nav.tsx`.
- **E2E:** `src/e2e/menu/communitySubmenuScroll.feature`,
  `src/e2e/menu/communitySubmenuScroll.spec.ts`.
- **Documentación:** `docs/features/community/007-2026-08-30-submenu-comunidad-scroll.md`,
  `docs/features/community/007-2026-08-30-submenu-comunidad-scroll-bitacora.md`.

### Key commands

- `pnpm exec playwright test src/e2e/menu/communitySubmenuScroll.spec.ts`
- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm exec playwright test src/e2e/menu`

### Validation results

- Rojo inicial confirmado: el nuevo caso E2E midió `Nosotros` debajo de `Por categoría`
  (`757.43px` contra `286.67px`).
- `pnpm exec playwright test src/e2e/menu/communitySubmenuScroll.spec.ts`: **2/2 passed**.
- `pnpm run test:run`: **229/229 archivos**, **2505/2505 tests passed**.
- `pnpm run typecheck`: **passed**.
- `pnpm run lint`: **1043 files checked**, **passed**.
- `pnpm exec playwright test src/e2e/menu`: **22/22 passed**.

### Deviations from roadmap

- La prueba de scroll se ajustó de `Nosotros` a `Negocios locales` porque `Nosotros` ya no debe estar
  al final después de este slice.
- La corrida E2E scoped volvió a escribir datos reversibles de sesión por el escenario existente del
  menú de avatar; su `afterEach` elimina la sesión creada con `deleteSession`.

### Follow-ups

- Revisar visualmente si el primer bloque con cuatro tarjetas queda balanceado en desktop ancho.
- Si se agregan más accesos principales, considerar extraer la lista principal a datos locales del
  componente para evitar que el JSX vuelva a crecer.

### Recap

`Nosotros` ahora aparece antes de `Por categoría` y comparte el primer bloque del submenú desktop
con `Publicaciones`, `Productos y servicios` y `Eventos`. El scroll interno sigue activo y la prueba
lo valida contra el contenido final actual del panel.

### Próximos pasos (opciones)

1. Validar visualmente en desktop que el primer bloque de cuatro accesos se lee equilibrado.
2. Dejar el menú como está y continuar agregando categorías; el scroll interno ya cubre el crecimiento.
3. Si aparece otra entrada principal, convertir ese primer bloque en una estructura de datos explícita.
