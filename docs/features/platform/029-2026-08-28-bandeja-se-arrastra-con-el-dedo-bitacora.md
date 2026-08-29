# Bitácora — La bandeja de archivos se arrastra también con el dedo

## Slice 5 de multimedia — Del arrastrar y soltar de HTML5 a los eventos de puntero (2026-08-28)

### Objetivo

Que reordenar las fotos de una publicación arrastrando funcione **en un teléfono**, que es donde se
publica. El slice 4 dio la función por hecha; sólo servía con ratón.

### Cómo se supo

Empezó como un reporte: «al editar una publicación ya no me deja arrastrar las fotos». La sospecha
razonable era una regresión de la pantalla de edición. No lo era. Se midió con sondas de Playwright
—escritas, ejecutadas y borradas— contra Chromium de verdad:

| pantalla | entrada | resultado |
| --- | --- | --- |
| `/editar/[slug]`, 3 archivos | ratón | reordena (`seed-2` pasa a portada) |
| `/publicar`, paso de archivos | ratón | reordena (`post-3` pasa a portada) |
| `/editar/[slug]`, 3 archivos | dedo (CDP, viewport de teléfono) | **no pasa nada** |

O sea: no era una regresión de editar, era una función que nunca existió al tacto. `draggable` +
`dragstart` es una API de escritorio y ningún navegador móvil la emite para un dedo.

Un detalle del camino, porque costó una hora: la primera sonda dijo «no se emite ni un evento» en
las dos pantallas. Era falso. `boundingBox()` de Playwright es relativo a la ventana, la bandeja
estaba a `y=1180` en una ventana de 720, y el ratón apuntaba a un sitio donde no había nada. Con un
`scrollIntoViewIfNeeded` delante, el arrastre de ratón funcionaba. **Una medición que no se
contrasta con un control miente igual de convincentemente que un bug**: lo que separó las dos cosas
fue inyectar un `<div draggable>` desnudo en la misma página y ver que ese sí arrastraba.

### Por qué la prueba anterior no lo vio

Esto es lo que hay que no repetir. El `@component` del slice 4 hacía:

```ts
fireEvent.dragStart(items[2]);
fireEvent.dragOver(items[0]);
fireEvent.drop(items[0]);
```

En jsdom eso **siempre** pasa: no hay navegador que decida si el gesto empieza, sólo tres eventos
disparados a mano. Y el `.feature` había escrito el porqué de no llevarlo al navegador: «el
arrastrar y soltar de HTML5 no se simula con un `dragTo`… un escenario verde ahí no diría que la
función sirve». La conclusión correcta de esa frase no era «entonces se prueba en jsdom», era
**«entonces el mecanismo no es probable, y eso es un motivo para no elegirlo»**.

### Decisiones y por qué

1. **Eventos de puntero en lugar del arrastrar y soltar de HTML5.** Una sola API para ratón, dedo y
   lápiz, en vez de una que sólo entiende una de las tres. Y —lo que cierra el círculo— Playwright
   sí los conduce: `page.mouse` los emite nativamente y el dedo entra por CDP. El mecanismo nuevo
   es, además de correcto, comprobable.

2. **El dedo sostiene; el ratón no.** Es la regla que hace que la bandeja no secuestre el
   formulario que la rodea. Deslizar el dedo sobre una miniatura tiene que seguir bajando por la
   página: mientras nadie sostiene, el gesto es de la página; a los 350 ms pasa a ser de la
   miniatura. Moverse antes de ese plazo abandona el gesto, porque eso es exactamente lo que hace
   quien está desplazándose. Con ratón no hay ambigüedad —no hay nada que desplazar— así que basta
   con 6 px de movimiento.

3. **El desplazamiento se bloquea a mano, y sólo mientras se arrastra.** `preventDefault` sobre
   `touchmove` exige un oyente **no pasivo** y React los registra pasivos, así que ese va puesto a
   mano sobre el `<ol>`. La alternativa —`touch-action: none` en cada miniatura— habría matado el
   desplazamiento vertical de la página siempre, no sólo durante el gesto.

4. **El mecanismo vive en `usePointerReorder.ts`, no dentro del componente.** Son umbrales,
   temporizador, oyentes en `window` y el bloqueo del desplazamiento: un mecanismo entero. En la
   bandeja sólo queda dónde se engancha, que es lo que se lee cuando alguien abre ese fichero.

5. **Las flechas ‹ › no se tocan.** Siguen siendo el único camino con teclado y con lector de
   pantalla. Esto añade una entrada, no sustituye la que ya servía.

6. **Los controles de la fila se marcan con `data-tray-control`.** La cruz y las dos flechas viven
   dentro del `<li>` que se arrastra: sin marcarlas, sostener el dedo sobre una flecha —lo que hace
   quien no está seguro de haberla tocado— levantaba la miniatura en vez de moverla un puesto.

7. **El clic que cierra un arrastre se descarta.** El navegador lo emite igual que el de un toque, y
   desde `onClick` son indistinguibles: sin esto, soltar una miniatura encima de otra reordenaba
   **y** abría la vista grande encima, tapando el resultado.

8. **`preventDefault` en `pointerdown` sólo con ratón.** Ahí cancela el arrastre nativo de la imagen
   y la selección de texto, que si no secuestran el gesto. Con el dedo se lleva por delante el toque
   que abre la vista grande, así que ahí no se hace.

9. **La pista nombra el gesto del teléfono.** «Mantén pulsada una miniatura y arrástrala para cambiar
   el orden, o usa las flechas». Sin el «mantén pulsada», quien lo intente deslizará el dedo, verá
   bajar la página y concluirá que no se puede — que es exactamente lo que pasaba antes.

### Un apaño del entorno de pruebas, dicho en voz alta

jsdom **no implementa `PointerEvent`**. Sin él, `fireEvent.pointerDown(nodo, { clientX: 40 })`
construye un `Event` a secas y las coordenadas se pierden: el oyente recibe el evento y `clientX`
llega `undefined`. Lo peor es cómo falla — la prueba no revienta, simplemente no ocurre nada, que es
el mismo modo de fallo que el bug que se estaba arreglando. Se añadió el polyfill en
`vitest-setup.ts`, documentado como lo que es: una carencia del entorno, no del producto.

### Ficheros tocados

- **Mecanismo (nuevo):** `src/presentation/media/PostMediaTray/usePointerReorder.ts`.
- **Componente:** `src/presentation/media/PostMediaTray/PostMediaTray.tsx` — fuera `draggable`,
  `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`; dentro `onPointerDown`, los dos `ref` de
  registro, el resalte del destino y el descarte del clic.
- **Escenarios:** `src/e2e/multimedia/multimediaMultiple.feature` (slice 5).
- **Pruebas:** `src/presentation/media/PostMediaTray/PostMediaTray.test.tsx` (los tres casos de
  arrastre reescritos a puntero + cinco nuevos de dedo), `src/e2e/multimedia/arrastreTactil.spec.ts`
  (nuevo), `src/e2e/testUtils/pointerDrag.ts` (nuevo), `vitest-setup.ts`.
- **Catálogo:** `src/i18n/messages/es.json`, `en.json` — `publish.mediaDragHint`.
- **Herramientas:** `.gitignore` — `.claude/skills/` pasa a ignorarse. Claude Code sólo registra las
  skills si están ahí, así que se copian desde `.agents/skills/`, pero **esa copia se queda en la
  máquina**: versionarla sería tener dos `SKILL.md` que pueden separarse sin que nadie se entere.
  `.agents/skills/` sigue siendo la única copia buena.

### Validación

| comando | resultado |
| --- | --- |
| `pnpm run test:run` | 225 ficheros, **2448 tests en verde** (eran 2440; +8 del arrastre) |
| `pnpm run typecheck` | limpio |
| `pnpm run typecheck:tests` | limpio |
| `pnpm run lint` | 1034 ficheros, sin hallazgos |
| `pnpm exec playwright test src/e2e/multimedia` | **14/14 en verde**, incluida la nueva del dedo (20,5 s) |

**Y la comprobación que le da valor a la e2e nueva:** se guardó el componente en `stash` —dejando la
bandeja con el arrastre de HTML5 de antes— y se volvió a correr `arrastreTactil.spec.ts`. **Falla**:
la bandeja se queda en `seed-0, seed-1, seed-2`. Con el mecanismo nuevo, pasa. Es decir, la prueba
puede fallar, que es lo único que distingue una prueba de una decoración — y es justo lo que le
faltaba a la del slice 4.

Los e2e corrieron **contra la base compartida**: siembran su publicación (`testSlug`) y su sesión y
las borran en `afterEach`; `globalTeardown` falla si algo sobrevive. No quedó nada que deshacer.

### Desviaciones

- Al arreglar el primer fallo de las pruebas de ratón apareció un defecto real del mecanismo, no de
  la prueba: el movimiento que **abre** el arrastre volvía sin registrar el destino, así que un
  gesto de ratón con un solo movimiento terminaba sin mover nada. En un navegador se disimulaba —
  llegan decenas de `pointermove`—, y sólo se vio porque la prueba conduce un movimiento. Arreglado
  en el hook.
- `.next/dev/types/` quedó truncado al matar el servidor de desarrollo que había levantado una sonda
  y hacía fallar `typecheck` con errores que no eran del código. Se borró; se regenera solo.

### Recap

La bandeja de archivos se reordena arrastrando con el dedo y con el ratón por el mismo camino, en
`/publicar` y en `/editar/[slug]`, que son el mismo componente. Sostener 350 ms abre el arrastre en
un teléfono sin robarle el desplazamiento a la página; las flechas siguen siendo el camino de
teclado; y el gesto tiene por fin una prueba de navegador que se comprobó capaz de fallar. Salió de
la rama `feat/bandeja-se-arrastra-con-el-dedo` y se integró en `dev`.

### Próximos pasos (opciones)

1. **Mirarlo en tu teléfono.** Los 350 ms del sostener son el número que más se nota en la mano, y
   es de una línea moverlo si sabe lento o precipitado.
2. **Levantar la miniatura mientras se arrastra** (que siga al dedo en vez de quedarse al 40 % de
   opacidad en su sitio). Hoy el resalte dice dónde va a caer, pero la foto no viaja con el dedo.
3. **Revisar si otras listas del sitio arrastran con HTML5** y tienen el mismo agujero al tacto;
   `usePointerReorder` ya está extraído para reutilizarse.
4. **Anotar en `AGENTS.md` la copia de las skills a `.claude/skills/`**, que ahora es un paso manual
   por máquina y no lo sabe nadie que clone el repo.

**Pendiente de tu parte:** probar el gesto en un teléfono de verdad — es lo único que estas pruebas
no pueden afirmar por ti, porque el navegador emulado no tiene dedos.
