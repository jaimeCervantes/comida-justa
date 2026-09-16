# Bitácora — enlace de retroalimentación por WhatsApp

## Slice único — 2026-09-16

**Objetivo:** el usuario preguntó si convenía un formulario propio o WhatsApp para recibir ideas y
reportes de error, y tras acordar WhatsApp, pidió el enlace en el header (como icono), en el pie, y
"por todos lados".

**Decisiones y por qué:**

- **WhatsApp antes que formulario propio**, decisión tomada en la conversación previa a este
  slice: reutiliza infraestructura que ya existe (el bot, el número, `whatsappLink.ts`) en vez de
  construir una tabla y una vista de triage que hoy nadie necesita — se revisita cuando el volumen
  de mensajes ya no quepa cómodo en una conversación.
- **Mismo número, mensaje distinto**, no un número dedicado: separar "escríbenos para comprar" de
  "dinos qué falta" no exige un canal nuevo, solo un mensaje que se note distinto al abrir el chat.
- **Texto "¿Qué te hace falta?"**, sugerido tras descartar "quejas" (suena negativo) y "sugerencias"
  (deja fuera los reportes de error) — una pregunta abierta cubre las tres sin presuponer cuál es.
- **En el teléfono, menú de hamburguesa y no la barra inferior.** Esa barra (`BottomNav`) tiene
  exactamente cinco lugares fijos —inicio, buscar, publicar, catálogo, cuenta— y añadir un sexto
  rompía su `grid-cols-5`; quitarle uno de los cinco para dárselo a esto tampoco se planteó, así
  que la fila de texto va donde ya vive todo lo secundario: el menú.
- **`feedbackHref` se calcula una sola vez en `Header.tsx`** y baja como uno de los `children` de
  `MobileNav`, en vez de que el icono de escritorio y la fila del menú recalculen el mismo mensaje
  cada uno por su cuenta.
- **`ExternalLink` del pie ganó un `data-testid` opcional** en vez de duplicar su marcado con un
  `<a>` suelto para el enlace nuevo — la razón de ser de ese componente es evitar justo esa
  repetición.

**Archivos tocados:**

- `src/infra/constants/index.ts`: `HAZLO_SANO_WHATSAPP_PHONE`.
- `src/presentation/chrome/Header/Header.tsx`: icono de escritorio junto a `CartLink`, fila dentro
  de `MobileNav`.
- `src/presentation/chrome/Footer/Footer.tsx` + `Footer.test.tsx`: nueva entrada de contacto,
  `ExternalLink` con `data-testid` opcional.
- `src/i18n/messages/es.json` / `en.json`: `common.feedbackLabel`, `common.feedbackWhatsappMessage`,
  `footer.feedback`.
- `src/e2e/chrome/feedbackLink.feature` + `.spec.ts` (nuevos).
- `docs/features/platform/041-2026-09-16-enlace-de-retroalimentacion.md` (este roadmap).

**Comandos y validación:**

- `pnpm exec vitest run src/presentation/chrome/Footer/Footer.test.tsx` — 6 tests, verdes.
- `pnpm run test:run` — 278 archivos, 2927 tests, verdes.
- `pnpm run typecheck` — limpio.
- `pnpm run lint` — un error de formato (`biome check --write` lo corrigió); limpio después.
- `pnpm run check:i18n` — sin literales nuevos en español fuera del catálogo; el único hallazgo
  (`publishPracticeDayPost.ts`) es preexistente y ajeno a este slice.
- `pnpm exec playwright test src/e2e/chrome/feedbackLink.spec.ts` — 4 escenarios, verdes.
- `pnpm exec playwright test src/e2e/chrome` en 4 tramos (56 escenarios) — 2 fallos, los dos
  confirmados preexistentes con `git stash` sobre el código de `dev` sin este cambio
  (`header-glass-theme-toggle.spec.ts` y `mainMenu.spec.ts`, ninguno relacionado con el header, el
  pie o el menú móvil que se tocaron aquí); el resto, verde.

**Desviaciones del roadmap:** ninguna.

**Recap:** cualquiera que use el sitio tiene ahora un atajo de un clic para proponer una idea o
reportar un error, con el mismo WhatsApp de siempre y un mensaje ya escrito: un icono junto al
carrito en escritorio, una fila en el menú del teléfono (sin tocar la barra inferior), y una línea
nueva en el pie. Todo cubierto por Vitest y Playwright, y validado contra un navegador real.

**Próximos pasos (opciones):**

1. Cerrar aquí: lo pedido queda resuelto y documentado.
2. Si el volumen de mensajes crece, retomar la idea original de un formulario propio con una tabla
   de triage — la conversación previa a este slice ya dejó escrito el criterio de cuándo conviene.
3. Investigar aparte los dos fallos preexistentes de `src/e2e/chrome` encontrados durante la
   validación (`header-glass-theme-toggle.spec.ts` y `mainMenu.spec.ts`), ajenos a este cambio.
