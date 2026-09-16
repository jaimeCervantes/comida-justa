# Bitácora — Publicar no debe enviarse solo al volver a un paso

## Slice único — 2026-09-15

**Objetivo:** el usuario reportó que, al llegar al último paso de `/publicar`, volver a uno anterior
y regresar, a veces el botón "Publicar" marca "sube una imagen" sin que haya ningún problema real
con la foto, y que insistiendo (yendo y viniendo otra vez) a veces sí lo dejaba publicar. Pidió
revisar qué pasaba.

**Decisiones y su porqué:**

- Se descartó la primera hipótesis (una carrera entre la subida de la imagen a Cloud Storage y el
  clic en "Publicar", con el botón sin deshabilitarse mientras se sube) porque el propio usuario
  aclaró que la subida sí completaba (aparecía "cargando" y luego la confirmación) antes de volver
  de paso — la hipótesis no encajaba con lo que describía.
- Se reprodujo con un test de investigación en Playwright contra un navegador real (no jsdom): un
  test de Vitest con RTL **no** reprodujo nada (el estado de React sobrevivía la navegación de
  pasos sin problema), lo que ya apuntaba a un mecanismo del DOM real y no del estado de React.
  El repro real sí lo confirmó: instrumentando las peticiones de red se vio un POST con header
  `next-action` disparado *dentro* del clic en "Continuar" — antes de que el usuario tocara
  "Publicar" siquiera.
- Causa raíz: el botón derecho del pie del asistente cambia de "Continuar" (`type="button"`) a
  "Publicar" (`type="submit"`) en la misma posición del JSX sin `key`, así que React reutiliza el
  mismo nodo del DOM y solo le muta el `type`. El navegador evalúa si un clic dispara el envío
  mirando el `type` *después* de que React ya reaccionó al clic, así que el propio clic en
  "Continuar" puede acabar disparando el envío del "Publicar" en el que ese nodo se acaba de
  convertir. La primera vez que se llega al paso 3 esto no se nota porque el teléfono y la
  descripción siguen vacíos y la validación nativa cancela el envío fantasma; solo se vuelve visible
  cuando esos campos ya tenían algo escrito de una visita anterior al paso 3.
- Arreglo mínimo: `key` distinta en cada rama de los cuatro botones del pie (`back`/`cancel`,
  `next`/`submit`), para forzar a React a desmontar y montar en vez de mutar el `type` en el mismo
  nodo.

**Archivos tocados:**

- `src/app/[locale]/publicar/PublishForm.tsx` — `key` en los cuatro botones del pie del asistente.
- `src/e2e/publicar/navegarSinPublicarSolo.feature` y `.spec.ts` (nuevos) — escenario que reproduce
  el envío fantasma y confirma que ya no ocurre.
- `docs/features/platform/040-2026-09-15-publicar-envio-fantasma-al-volver.md` (nuevo) — este
  roadmap.

**Comandos clave:**

- `pnpm exec playwright test src/e2e/publicar/navegarSinPublicarSolo.spec.ts` — rojo contra el
  código anterior, verde tras el arreglo.
- `pnpm run test:run` — 278 archivos, 2922 tests, todos verdes.
- `pnpm run typecheck` — limpio.
- `pnpm run lint` — limpio (`biome check .`, 1210 archivos).
- `pnpm exec playwright test src/e2e/publicar src/e2e/publishProduct` — 13 escenarios, 12 verdes; el
  que falla (`publishProduct.spec.ts` — la insignia "Hazlo Sano") se confirmó preexistente: falla
  igual con el código de `dev` sin este cambio (se verificó hacienda `git stash` del fix y corriendo
  ese mismo spec), así que queda fuera de alcance de este slice.

**Validación:** manual en navegador real vía Playwright (no solo unitaria) — es justo el tipo de
bug que un test con jsdom no puede ver, porque depende del orden real en que el navegador evalúa la
activación de un botón `submit` frente al ciclo de render de React.

**Desviaciones del roadmap:** ninguna — un solo slice, tal como se planteó.

**Seguimientos:**

- El fallo preexistente de `publishProduct.spec.ts` (insignia "Hazlo Sano" no aparece) queda
  pendiente de investigar aparte; no está relacionado con este bug.

**Recap:** el asistente de `/publicar` ya no puede enviarse solo al volver a un paso anterior y
regresar: los cuatro botones del pie ahora tienen `key` propia, así que React siempre monta el
botón correcto en vez de mutar uno existente a mitad de un clic. Cubierto con un escenario Playwright
que reproduce el envío fantasma contra un navegador real. El resto de la suite (unitarias,
typecheck, lint, e2e de `/publicar` y `publishProduct`) sigue en verde salvo un fallo preexistente y
ajeno a este cambio.

**Próximos pasos (opciones):**

1. Cerrar aquí: el reporte original queda resuelto y documentado.
2. Investigar por separado el fallo preexistente de la insignia "Hazlo Sano" en
   `publishProduct.spec.ts` (parece un problema de datos de la tienda admin en el entorno
   compartido, no de la UI).
3. Auditar si el mismo patrón (dos botones condicionales sin `key` en la misma posición) se repite
   en otros asistentes o formularios multi-paso del repo.
