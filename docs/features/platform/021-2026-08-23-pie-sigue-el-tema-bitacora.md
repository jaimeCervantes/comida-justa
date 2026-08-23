# Bitácora — El pie vuelve a seguir el tema

> Corrige [019 — la banda oscura](019-2026-08-22-pie-oscuro-bitacora.md).

---

## Slice 3 — Claro en claro, oscuro en oscuro (2026-08-23)

### Qué se revierte y por qué

El 5.16 dibuja el pie **siempre oscuro** —«cierra la página y libera el papel claro para el
contenido»— y así se entregó, con una superficie que no participaba del tema.

Decisión del usuario: no. Una banda negra en mitad de una página clara no cierra, **corta**; y en el
tema oscuro se fundía con el resto de la página, así que el pie dejaba de leerse como el final de
nada justo donde el argumento del canvas debería ser más fuerte.

### Lo que sí había que conservar

El cierre. Y el cierre no depende del color: lo dan **un escalón de superficie** —
`surface-elevation-1` sobre el fondo de la página — y **un filo arriba** (`border-t border-border`,
el borde fuerte y no el separador tenue). Las dos cosas funcionan igual en los dos temas, que es
exactamente lo que el oscuro fijo no hacía.

Se usan las dos a la vez a propósito: con solo el escalón, el cierre depende de que el monitor
distinga dos grises vecinos.

### Lo que se retira entero

`--surface-inverted` y sus cuatro tintas, sus alias del `@theme` y
`invertedSurface.contrast.test.ts`. **Nadie más los usaba.** Un juego de tokens sin consumidor —con
una prueba que no vigila nada— es ruido, y la regla de esta casa es no dejar abstracciones sin un
segundo uso real. La medición que documentaban queda escrita en la bitácora 019, incluido el dato de
que **el canvas afirma 8.4:1 para su verde sobre `#101410` y son 6.16**.

Si algún día llega el 5.5 —la tienda en oscuro—, los tokens se vuelven a introducir con su
consumidor delante.

### Las pruebas afirman ahora otra cosa

Antes: «el pie es mucho más oscuro que el cuerpo». Eso era el color, y el color acaba de cambiar.

Ahora: **la división se ve**, y se comprueba en los **dos temas** con el mismo par de escenarios
declarado una vez y ejecutado dos veces (`test.use({ colorScheme })`). Si se hubieran copiado, la
copia oscura se quedaría atrás en el primer cambio.

Se sigue midiendo el estilo **calculado** en el navegador y no el `class`: es lo que atrapó, hace
dos commits, una utilidad que no compilaba y dejaba el texto a 1.10 de contraste.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "…/chrome/Footer" "…/tokens"` | **125 en verde** |
| `pnpm run typecheck` · `lint` | limpios (1001 archivos) |
| `pnpm exec playwright test src/e2e/chrome/pie.spec.ts` | **5/5**, dos de ellos en tema oscuro |

### Recap

El pie sigue al tema y se separa del contenido por forma —superficie y filo— en vez de por un color
fijo. Los tokens de la banda oscura se van completos, con su prueba, en vez de quedarse esperando un
uso que no existe.
