# Bitácora — «Así se verá» y «Falta poco»

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **5.3 · publicar**, columna derecha.
> Continúa [013 — el asistente de tres pasos](013-2026-08-22-publicar-v2-bitacora.md).

---

## Slice 2 — La columna que enseña lo que estás haciendo (2026-08-22)

### Qué entra

| Pieza | Qué contesta |
| --- | --- |
| **Vista previa** | «¿esto se va a ver bien?» — hoy solo se puede contestar publicando y mirando |
| **Checklist** | «¿ya puedo publicar?» — con tres pasos, lo que no está en pantalla deja de existir |

El asistente dice **dónde estás**; esto dice **qué te falta**. Son preguntas distintas y por eso son
dos piezas.

### El checklist tiene cinco puntos y el canvas cuatro

El canvas dibuja cuatro para un formulario de cuatro campos. Este tiene doce, y con cuatro puntos la
descripción y el teléfono se quedaban fuera: un checklist que omite un campo obligatorio promete
«falta poco» y luego el envío falla por algo que nunca se mencionó.

Quedan: título (**y precio**, solo cuando el `kind` lo exige), pilar, descripción, cómo te contactan
y foto. La foto es el único **recomendado**, lo dice en palabras —no con un gris más claro— y
**no cuenta** en el resumen: si contara, el contador nunca llegaría a cero para quien publica sin
ella, y un contador que no se puede cerrar deja de ser información y pasa a ser un reproche.

La regla del precio (`publishRequiresPrice`) ya no se escribe dos veces: la importa el formulario y
la importa el checklist, y una prueba lee `PublishForm.tsx` para comprobar que sigue siendo así.

### Cómo se lee lo que se está escribiendo

De los doce campos, solo `kind` y `category` están controlados por React. El resto son **no
controlados a propósito**: el navegador valida `required` y `pattern` sobre ellos y `Form` enfoca el
primero que rechaza. Volverlos controlados para poder leerlos habría cambiado la validación de toda
la pantalla para pintar una tarjeta al lado.

Así que se leen del DOM, con oyentes nativos de `input` y `change` en el contenedor de los pasos —
uno solo ve cada tecla de cada campo, incluidos los de los pasos escondidos.

**Esta vez el mecanismo se verificó en Chrome antes de darlo por bueno.** Es la lección directa del
slice anterior, donde tres mecanismos distintos funcionaban en jsdom y ninguno llegaba en un
navegador. `input` y `change` burbujean —a diferencia de `invalid`, que fue lo que hundió aquello—,
y `src/e2e/publicar/vistaPrevia.spec.ts` lo comprueba: **5 escenarios en verde en Chrome**.

La foto era la única pieza a la que ese camino no llegaba: su campo oculto lo escribe React y no
emite `input`. `PostMediaField` gana un `onItemsChange` opcional — la lista sigue viviendo allí,
quien escucha mira y no manda.

### Lo que la e2e encontró de paso

Dos cosas, y ninguna era del producto:

1. **Un `select` controlado no acepta nada antes de hidratarse.** Playwright teclea más rápido que
   React: la elección se perdía sin error, y lo que fallaba tres líneas después era otra cosa. Se
   resuelve con `selectWhenHydrated`, que reintenta la pareja «elegir y comprobar que se quedó» con
   `toPass`. No con un `waitForTimeout`: dormir medio segundo funciona hasta el día que la máquina
   va lenta, y entonces vuelve como intermitencia.
2. **`/categoría/i` encuentra también a «Sub-categoría».** En cuanto se elige una categoría hay dos
   `combobox` que casan. Los campos se conducen ahora por su `name`, que además es el contrato de
   verdad —lo lee la Server Action y lo reparte `PUBLISH_STEPS`—, así que sobrevive a que alguien
   reescriba la etiqueta. Los escenarios que **afirman** algo sobre un rótulo siguen usando
   `getByRole`: ahí el rótulo es la promesa.

### Solo donde hay sitio al lado

La columna es `lg` en adelante, como en el propio canvas: apilada caería **debajo** del botón de
publicar, que es donde nadie mira. En un teléfono quien lleva la cuenta es el asistente. Es `sticky`
porque su valor es acompañar — una vista previa que se queda arriba mientras se escribe el tercer
paso no es una vista previa, es un encabezado.

El formulario no lleva `max-w-*`: el ancho lo pone el `container-width` del layout y lo que sobra se
reparte en columnas.

### Limitación conocida

Quien elija una categoría **antes de que la página termine de hidratarse** verá cómo el selector
vuelve a vacío. Es inherente a un `select` controlado servido desde el servidor, existía desde antes
de este slice y dura menos de un segundo; se deja anotada porque ahora está medida, no porque sea
nueva.

### Archivos tocados

**Nuevos**
- `publicar/publishChecklist.ts` · `publishChecklist.test.ts` — la regla, sin React
- `publicar/usePublishDraft.ts` — leer el formulario mientras se escribe
- `publicar/ui/PublishPreview.tsx` · `ui/PublishChecklist.tsx`
- `src/e2e/publicar/vistaPrevia.feature` · `vistaPrevia.spec.ts`
- `src/e2e/publicar/PublishAsidePage.ts` · `PublishFieldsPage.ts`
- `src/e2e/testUtils/selectWhenHydrated.ts`

**Modificados**
- `publicar/PublishForm.tsx` — dos columnas, `goToField`, la regla del precio importada
- `presentation/media/PostMediaField/PostMediaField.tsx` — `onItemsChange` opcional
- `src/i18n/messages/{es,en}.json` — quince rótulos

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/publicar" "…/PostMediaField"` | **97 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (991 archivos) |
| `pnpm exec playwright test src/e2e/publicar` | **5/5 en verde** en Chrome |
| `createPost`, `publishProduct`, `validacionFormularios`, `multimedia`, `dimensionesMedia`, `filtroAlPublicar` | **40 en verde**, 1 saltada, 0 rojas |

### Recap

`/publicar` enseña la tarjeta que va a quedar mientras se escribe, y al lado dice qué falta y cuánto
de eso bloquea. Lo que cuenta como «hecho» es una regla probada sin navegador; lo que la alimenta es
un mecanismo de eventos **medido en Chrome**, que es la deuda que dejó el slice anterior. De paso,
los escenarios de publicar dejaron de depender de rótulos ambiguos y de la suerte de la hidratación.

### Próximos pasos (opciones)

1. **Los controles del 5.3**: `kind` como píldoras segmentadas, contador de caracteres en el título
   (29/70), precio con `$`/`MXN` como afijos.
2. **Adoptar en la hidratación lo que ya esté elegido** en `kind`/`category`, y cerrar la limitación
   anotada arriba.
3. **Seguir con el resto de secciones del canvas.**
