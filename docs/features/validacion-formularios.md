# Validación de formularios — el campo dice por qué, en el idioma de la página

> Nace de una revisión de las primitivas de formulario (`TextField`, `TextArea`, `Select`,
> `InputShell`, `FieldHelper`) pedida sobre las pantallas de **publicar** y **editar**. Continúa el
> trabajo del slice 7 de `design-system` («Estado, retroalimentación y foco»), que unificó el anillo
> de foco y los avisos, pero no llegó a la validación.

## Context

### Problem

Hoy un formulario del sitio tiene **dos formas de decir que algo está mal, y ninguna completa**:

1. **El globito nativo del navegador.** Sale de los atributos `required`, `pattern`, `min` y `step`
   que ya llevan los campos. Tiene cuatro fallos, y en este repo tres son graves:
   - **Habla el idioma del navegador, no el de la página.** Con `localePrefix: "as-needed"`, alguien
     con Chrome en español en `/en/publish` lee «Completa este campo». `AGENTS.md` prohíbe que una
     cadena visible viva fuera del catálogo; esta ni siquiera es nuestra.
   - **Muestra un campo a la vez y el mensaje se va.** Publicar un evento son doce campos: los
     errores se descubren de envío en envío, y el globito desaparece a los pocos segundos o al hacer
     scroll.
   - **`pattern` dice «Coincide con el formato solicitado».** Para el teléfono
     (`^\+?(\d{1,3})?[0-9]{10}$`) eso no explica nada. Es el peor mensaje del formulario.
   - **No pinta el campo.** El borde rojo y `aria-invalid` sólo aparecen *después* del viaje al
     servidor: antes de enviar no hay ningún estado visual.

2. **Los errores de la Server Action.** Llegan traducidos y bien puestos bajo el campo… cuando el
   campo está cableado. Tres no lo están:
   - `state.errors.media` **no se pinta en ninguna parte** de `PublishForm`. La acción lo devuelve
     (`src/app/[locale]/publicar/actions.ts`), `PostMediaField` no tiene por dónde recibirlo, y el
     resultado es que publicar sin archivos rechaza en silencio: la pantalla no cambia.
   - El banner de error de `EditPostForm` es un `<p className="text-red-700">` sin `role="alert"` —
     exactamente lo que ya se corrigió en `PublishForm` sustituyéndolo por `Alert`.
   - Al volver del servidor **nada se enfoca ni hace scroll**. El camino nativo sí enfoca; el
     nuestro deja el mensaje arriba y a la persona donde estaba.

Y dos defectos de las primitivas que salieron en la misma revisión:

- El contador de `TextArea` arranca en `0` porque su estado no lee `defaultValue`: al editar «Dona
  Chocolate Keto» (1205 caracteres) la pantalla dice `0/2500`.
- Ese mismo contador **desaparece** cuando hay error, así que justo cuando el texto importa deja de
  saberse cuánto cabe.

### Savings

- **Menos publicaciones abandonadas.** El caso que hoy se pierde entero es el teléfono: se escribe
  con guiones o con nueve dígitos, el globito dice «coincide con el formato solicitado», y no hay
  nada en pantalla que diga qué formato.
- **Menos viajes al servidor.** Cada rechazo del formulario es una Server Action ejecutada, con su
  sesión, su consulta de taxonomía y un repintado. Lo que el navegador ya sabe no tiene por qué
  costar una llamada.
- **Un solo sitio donde arreglarlo.** Publicar, editar, cuenta, tienda y el alta de categorías del
  admin usan las mismas tres primitivas. Hoy cada pantalla decide por su cuenta qué error enseña.

### Why

Publicar es la entrada del embudo: quien no consigue publicar no vuelve. Y el sitio se presenta en
dos idiomas — un formulario que contesta en un tercero (el del navegador) rompe la única promesa que
`i18n` hace de forma visible.

## El modelo: el navegador juzga, nosotros hablamos

**Híbrido, y con el globito apagado.**

- Los atributos se quedan (`required`, `pattern`, `min`, `max`, `step`, `type`). Son la declaración
  de la regla, y sin JavaScript siguen impidiendo que se envíe basura.
- El `<form>` lleva `noValidate`: apaga el globito, **no** la validación. `validity` se sigue
  calculando.
- Al necesitar el veredicto se lee `input.validity` (Constraint Validation API) y se traduce la
  bandera (`valueMissing`, `patternMismatch`, `rangeUnderflow`, `stepMismatch`, `badInput`…) a una
  frase del catálogo.
- Esa frase cae en el **mismo hueco** (`FieldHelper`) donde ya caen los errores del servidor. Un
  campo nunca tiene dos maneras de verse mal.

Lo que **no** se hace: reimplementar en JavaScript lo que el navegador ya sabe (rangos, `step`,
número, fecha). Eso sería una tercera copia de las reglas, junto a la de la Server Action y la de
`PostValidator`.

### Cuándo se pinta

Ni al cargar ni en la primera tecla:

| Momento | Qué pasa |
| --- | --- |
| Al cargar | Nada. Un formulario vacío no está mal, está sin llenar. |
| Al escribir por primera vez | Nada. El campo aún no está «tocado». |
| Al salir del campo (`blur`) | Se marca tocado y, si es inválido, aparece el mensaje. |
| Al pulsar enviar | Todos los campos pasan a tocados de golpe, y se enfoca el primero inválido. |
| Al escribir en un campo ya tocado | Se revalida en cada tecla: el error se borra en cuanto se corrige. |

### Dónde vive cada pieza

`AGENTS.md`: **`design_system/` no puede llamar `useTranslations`** — parte del árbol se pinta fuera
del `NextIntlClientProvider`. Así que el mapa de mensajes entra por props, igual que `loadingLabel`
en `Button`.

| Módulo | Capa | Responsabilidad |
| --- | --- | --- |
| `design_system/forms/validity.ts` | design system | `firstValidityProblem(validity)` → clave del problema. TypeScript puro, sin React ni catálogo. |
| `design_system/forms/useFieldValidity.ts` | design system | El ciclo tocado/revalidar de **un** campo. Recibe el mapa de frases ya traducido. |
| `presentation/forms/useValidationMessages.ts` | presentación | Lee `useTranslations("validation")` y arma el mapa, con anulaciones por campo (el teléfono trae la suya). |
| `presentation/forms/ValidatedForm.tsx` | presentación | El `<form noValidate>`: al enviar corre `checkValidity()`, marca todo como tocado, enfoca y hace scroll al primer inválido, y sólo entonces deja pasar la Server Action. |

`ValidatedForm` cancela la acción con `event.preventDefault()` dentro de `onSubmit`: React 19
comprueba `defaultPrevented` antes de invocar la acción del formulario, así que `useActionState`
sigue funcionando igual y no hace falta tocar ninguna de las dos Server Actions.

## Roadmap de slices

### Slice 1 — El mensaje bajo el campo, en el idioma de la página

**Alcance:** las primitivas (`validity.ts`, `useFieldValidity`, `ValidatedForm`,
`useValidationMessages`) y su estreno en `/publicar` y `/editar/[slug]`.

- `noValidate` en los dos formularios, a través de `ValidatedForm`.
- Mensajes traducidos bajo cada campo para: obligatorio, formato (teléfono), mínimo (precio,
  duración) y paso.
- El teléfono estrena frase propia: «Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116».
- Tocado al `blur`, revalidación en cada tecla, todo tocado al enviar.
- Al enviar con errores: foco y scroll al primer campo inválido.
- El mismo hueco sirve al error del servidor: si la acción contesta `errors.price`, se ve donde se
  vería el del navegador.

**Aceptación:** ningún mensaje de validación en pantalla viene del navegador; los casos del
`Scenario Outline` del `.feature` dan la frase del catálogo, en `es` y en `en`; enviar vacío enfoca
el título y no llama a la Server Action.

**Fuera de alcance:** los formularios de cuenta, tienda y admin, que heredan la primitiva pero se
cablean en el slice 3.

### Slice 2 — Los campos que hoy no dicen nada

- `PostMediaField` acepta `error` y lo pinta en un `FieldHelper` bajo la bandeja.
- `PublishForm` le pasa `state.errors.media`.
- El banner de `EditPostForm` pasa a `Alert tone="error"` con su `role="alert"`.
- La acción de editar produce `title` y `content` como errores de campo, y el formulario los cablea.

**Aceptación:** publicar sin archivos muestra «Sube al menos una imagen o un video» junto a la
bandeja; un lector de pantalla anuncia el banner de editar.

### Slice 3 — El resto de los formularios y el pulido de las primitivas

- Contador de `TextArea` sembrado con `defaultValue`, y contador y error conviviendo.
- `autoComplete`/`inputMode` donde el navegador puede ayudar (`tel`, `numeric`).
- Leyenda del `*` obligatorio.
- Cuenta (`AddBranchForm`, `BecomeSellerForm`, `StoreProfileForm`, `UsernameSection`) y
  `admin/catalogo` pasan a `ValidatedForm`.

## Verificación

```
pnpm run test:run
pnpm run typecheck
pnpm run lint
pnpm run check:i18n
pnpm run test:e2e:run
```
