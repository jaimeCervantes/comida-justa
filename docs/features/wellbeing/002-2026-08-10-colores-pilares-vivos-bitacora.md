# Bitácora: colores vivos para los pilares

## 2026-08-10 - Slice 1: Sueño y Mente/Espíritu recuperan su color

### Objetivo

Devolver a Sueño el violeta y a Mente/Espíritu el azul cielo que los hacían más vivos y fáciles de
reconocer, sin mover los colores actuales de Alimentación y Movimiento ni perder contraste WCAG AA.

### Decisiones y racional

- Los hexadecimales anteriores (`#8b5cf6` y `#38bdf8`) se conservaron como semillas visuales, no
  como un único color para cualquier uso. Blanco sobre ellos da 4.23:1 y 2.14:1 respectivamente, así
  que reutilizarlos sin adaptación habría reintroducido problemas de legibilidad.
- En claro, Sueño usa `#7c3aed` como tinta/sólido sobre `#f5f3ff`; Mente/Espíritu usa `#0369a1`
  sobre `#f0f9ff`. Son variantes más oscuras de los matices recuperados y superan AA.
- En oscuro, donde el fondo sí admite tonos luminosos, Sueño usa `#c4b5fd` y Mente/Espíritu recupera
  exactamente `#38bdf8`. Sus superficies se oscurecen a `#2e1065` y `#0c2a3b`.
- La prueba fija también los seis valores de Alimentación y Movimiento. Así, un retoque posterior de
  los dos pilares solicitados no puede mover accidentalmente los dos que el usuario decidió conservar.
- No se creó un spec de Playwright para este escenario: la conducta es una invariante de tokens sin
  navegación ni datos remotos. El escenario `@component` se ejecuta con Vitest leyendo el CSS real.

### Archivos tocados

- **Tokens y catálogo:** `src/presentation/design_system/tokens/colors.css`,
  `PillarPalette.stories.tsx`.
- **Pruebas:** `src/presentation/design_system/tokens/pillarPalette.contrast.test.ts`.
- **Especificaciones:** `src/e2e/pilares/colores-pilares-vivos.feature`,
  `src/e2e/design-system/design-system.feature`.
- **Documentación:** `docs/features/wellbeing/002-2026-08-10-colores-pilares-vivos.md`, `docs/features/platform/001-2026-07-28-design-system.md`.

### Comandos clave

```bash
pnpm exec vitest run src/presentation/design_system/tokens/pillarPalette.contrast.test.ts
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
pnpm run build
pnpm run test:e2e:run
pnpm exec biome check <archivos del slice>
git diff --check
```

### Resultados de validación

- La prueba específica falló primero en los cuatro lugares esperados (las rampas clara y oscura de
  Sueño y Mente/Espíritu) y quedó después en **25/25 pruebas verdes**.
- `pnpm run test:run`: **1,210/1,210 pruebas verdes**, 124 archivos.
- `pnpm run typecheck`: exit 0. El primer intento encontró `.next/dev/types/validator.ts` truncado;
  se eliminó solo ese artefacto generado y la repetición pasó.
- `pnpm run lint`: exit 0, con una información preexistente por un fragmento redundante en
  `src/app/[locale]/admin/productos/ui/IndexingStatusPanel.tsx`. Los tres archivos de código del
  slice pasan además una ejecución dirigida de Biome sin observaciones.
- `pnpm run check:i18n`: limpio.
- `pnpm run build`: compilación de producción completa, 33 páginas estáticas generadas.
- `git diff --check`: limpio.
- `pnpm run test:e2e:run`: **incompleto**. Playwright planeó 225 casos y el proceso alcanzó el
  inicio del 123 antes del timeout de 10 minutos. Había reportado 15 fallos, concentrados en búsquedas
  que devolvían resultados vacíos/404 y una inserción de traducción con FK ausente. Los seis casos de
  design system ejecutados (jerarquía y primer pintado) pasaron, pero no se afirma que la suite e2e
  completa esté verde.
- La e2e escribió fixtures en la base compartida. Como el timeout podía impedir el teardown, se
  ejecutó manualmente el barrido oficial `sweepTestData()`: eliminó **1 publicación y 1 tienda E2E**;
  el conteo posterior quedó en **0 publicaciones, 0 categorías, 0 sucursales, 0 tiendas y 0
  direcciones personales de prueba**. No quedó nada que deshacer.

### Desviaciones del roadmap

- No cambió el alcance visual ni se tocaron Alimentación o Movimiento.
- La validación e2e completa no terminó por fallos y duración ajenos a este slice. La cobertura
  ejecutable acordada para el cambio, que es de componente/token, sí quedó completa y verde.

### Seguimiento

- La única comprobación pendiente es subjetiva: mirar `/pilares` en claro y oscuro y confirmar que
  el violeta y el azul recuperaron la energía esperada. Los valores ya están centralizados, por lo
  que un ajuste fino posterior sería un cambio de seis tokens sin tocar componentes.
- El fallo de búsquedas de la e2e y la FK de traducciones merecen diagnóstico separado; mezclarlos
  con este cambio visual ocultaría su causa real.

### Recap

Sueño vuelve a ser violeta y Mente/Espíritu vuelve a ser azul cielo en toda la experiencia de
pilares, tanto en claro como en oscuro. Los tonos se adaptaron por papel para mantener AA, mientras
Alimentación y Movimiento quedaron exactamente como estaban. Las pruebas unitarias, tipos, lint,
i18n y build están verdes; la e2e global quedó incompleta por problemas de búsqueda y datos ajenos,
y sus residuos en la base compartida fueron barridos y verificados en cero.

### Próximos pasos (opciones)

1. **Revisión visual:** abrir `/pilares`, `/pilares/sueno` y `/pilares/mente-espiritu` en claro y
   oscuro; no hay otra acción funcional pendiente.
2. **Ajuste fino:** si alguno todavía se percibe demasiado oscuro o brillante, indicar cuál y en qué
   tema para mover solo su rampa conservando AA.
3. **Deuda separada:** diagnosticar en otra tarea los 404 de búsqueda y la FK de traducciones que
   impidieron completar Playwright.
