# Bitácora — Validación de formularios

## Slice 1 — El mensaje bajo el campo, en el idioma de la página (2026-08-19)

### Objetivo

Que publicar y editar dejen de apoyarse en el globito nativo del navegador y contesten ellos, bajo
cada campo, en el idioma de la ruta. La pregunta que abrió el trabajo fue «¿validación nativa o
mensajes propios?», y la respuesta que se implementó es que no son alternativas.

### Decisiones y por qué

**1. Híbrido: el navegador juzga, nosotros hablamos.** Los atributos (`required`, `pattern`, `min`,
`step`, `type`) se quedan —son la regla, son declarativos y sostienen el formulario sin
JavaScript—, el `<form>` lleva `noValidate` para apagar **la interfaz** de la validación (no la
validación: `validity` se sigue calculando), y de ahí sale nuestro mensaje.

Lo que descartó la opción nativa pura no fue la estética sino el idioma: con `localePrefix:
"as-needed"`, el globito lo pinta el navegador con su propio idioma de interfaz, así que en
`/en/publish` con un Chrome en español decía «Completa este campo». Es una cadena visible que no
está en `src/i18n/messages/`, que nadie puede traducir y que `AGENTS.md` prohíbe. A eso se sumaba
que se muestra un campo por envío —publicar un evento son doce—, que desaparece sola, y que para
`pattern` sólo sabe decir «coincide con el formato solicitado»: el teléfono llevaba
`^\+?(\d{1,3})?[0-9]{10}$` sin una sola palabra que dijera cuál es ese formato.

Lo que descartó la opción propia pura fue la duplicación: tirar `required` y `pattern` obliga a
reimplementar en JavaScript los rangos, el `step`, el número y la fecha, y eso serían **tres**
copias de cada regla —el componente, la Server Action y `PostValidator`—.

**2. El cliente y el servidor leen la misma clave del catálogo.** Es la decisión de la que cuelga
todo lo demás. Si el navegador dijera «Falta llenar este campo» y la Server Action «El título es
obligatorio», el campo tendría dos voces para una sola regla y quien las viera una detrás de otra
creería que son dos problemas. `usePostValidationMessages` mapea cada bandera de la Constraint
Validation API a la clave que ya usaba la acción (`publish.errorTitleRequired`,
`publish.errorPriceRequired`…), así que no pueden contradecirse y traducir una regla se hace una
vez. Sólo se añadieron tres claves, para reglas que existían como atributo y no tenían frase en
ningún idioma: `errorPhoneFormat`, `errorDurationMin` y `errorDurationStep`.

**3. Tocado al `blur`, revalidación en cada tecla a partir de ahí.** Un formulario recién abierto no
está mal, está sin llenar, y un teléfono a medio escribir tampoco: pintar `:invalid` al cargar habría
teñido de rojo un formulario en blanco. Una vez tocado sí se revalida en cada tecla, para que el
error se borre en la misma que lo arregla y no en el siguiente envío.

**4. El orden de las banderas es una decisión de producto, no de gustos.** El navegador enciende
varias a la vez y sólo cabe una frase. `valueMissing` va primero porque un campo vacío no tiene
formato del que hablar; `rangeUnderflow` va antes que `stepMismatch` porque el paso se cuenta desde
el mínimo, y un `3` en `min="5" step="5"` enciende las dos —contestarle «escribe múltiplos de 5» a
quien escribió 3 responde la pregunta que no hizo—. Vive en `VALIDITY_PROBLEMS`, con su tabla.

**5. Tres capas, y el catálogo fuera del design system.** `AGENTS.md` prohíbe `useTranslations` en
`design_system/` porque parte del árbol se pinta fuera del `NextIntlClientProvider`. Así que
`validity.ts` es TypeScript puro, `useFieldValidity` recibe las frases ya traducidas, y quien lee el
catálogo es `presentation/forms/` (genéricas) y `presentation/post/` (las de una publicación). Mismo
trato que `loadingLabel` en `Button`.

**6. El reinicio del error del servidor se ajusta durante el render, no en un efecto.** Es el patrón
que documenta React para «reiniciar estado cuando cambia una prop». Con `useEffect` el campo se
pintaba primero sin mensaje y lo añadía en un segundo pase, que en una columna de campos se ve como
un parpadeo; además Biome marcaba la dependencia como innecesaria (`useExhaustiveDependencies`) y su
arreglo automático —quitarla— habría dejado el efecto corriendo sólo al montar.

**7. El foco también salta cuando quien rechaza es el servidor.** El camino nativo enfocaba el
primer campo inválido; el nuestro dejaba el mensaje arriba y a la persona donde estaba. `Form`
acepta `serverErrorSignal` y, cuando cambia, busca el primer control inválido —nativo o marcado con
`aria-invalid`— y salta a él.

### Archivos tocados

**Design system (mecanismo, sin catálogo)**
- `src/presentation/design_system/forms/validity.ts` (nuevo) + `validity.test.ts`
- `src/presentation/design_system/forms/FormValidityContext.ts` (nuevo)
- `src/presentation/design_system/forms/useFieldValidity.ts` (nuevo)
- `src/presentation/design_system/forms/Form.tsx` (nuevo) + `Form.test.tsx`
- `src/presentation/design_system/forms/{TextField,TextArea,Select}.tsx` — prop
  `validationMessages`, composición de `onBlur`/`onChange`, `ref` fusionado
- `src/presentation/design_system/forms/TextField.validity.test.tsx` (nuevo)

**Presentación (quien traduce)**
- `src/presentation/forms/useValidationMessages.ts`, `src/presentation/forms/ValidatedForm.tsx` (nuevos)
- `src/presentation/post/usePostValidationMessages.ts` (nuevo)

**Pantallas**
- `src/app/[locale]/publicar/PublishForm.tsx`, `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
- `src/app/[locale]/publicar/PublishForm.validation.test.tsx` (nuevo)

**Catálogo y especificación**
- `src/i18n/messages/{es,en}.json` — namespace `validation` (9 claves) y tres claves nuevas en
  `publish`
- `src/e2e/validacionFormularios/{validacionFormularios.feature,validacionFormularios.spec.ts}` (nuevos)
- `docs/features/platform/006-2026-08-19-validacion-formularios.md` (nuevo)

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2016 pasan / 2016**, 194 archivos. 46 en `design_system/forms` (29 nuevas), 14 nuevas en `PublishForm.validation.test.tsx`. |
| `pnpm run typecheck` | limpio |
| `pnpm run lint` | limpio (947 archivos) |
| `pnpm run check:i18n` | limpio |
| `pnpm run build` | compila |
| `pnpm run typecheck:tests` | **6 errores, todos previos.** Se comprobó con `git stash` que el conjunto es idéntico en `HEAD`: `EditPostForm.test.tsx` (4, tipos inferidos de un literal por defecto), `managePost.test.ts` (1), `PostsWithLoadMore.test.tsx` (1). No se tocaron: son de otro trabajo. |
| Playwright, `src/e2e/validacionFormularios` | **7 pasan / 7** (1.4 min). |

### La Playwright de este slice, y lo que destapó

Se corrió por lotes, matando al dueño del puerto 3000 entre uno y otro (no la suite completa).

| Lote | Resultado |
| --- | --- |
| `src/e2e/validacionFormularios` | **7 / 7**. Un fallo inicial fue del propio escenario, no del código: `getByRole("button", { name: /^publicar$/i })` casaba también con el botón de la cabecera. Se acotó al formulario. |
| `createPost` + `editPublicationTypes` + `localProducers/fixProvenance` | 7 pasan, 1 salta, **1 falla**: `createPost.spec.ts`. |
| `multimedia` + `eventos` + `sellerStore/managePost` | 16 pasan, **5 fallan**, las cinco de `multimediaMultiple.spec.ts`. |

**Los seis fallos son la misma avería, y es previa a este trabajo.** Se comprobó con `git stash`:
`createPost.spec.ts` falla igual en `HEAD` limpio, sin una línea de este slice. Son dos roturas
encadenadas, cada una del commit anterior a esta rama, y ninguna se vio porque la Playwright no se
había vuelto a correr:

1. **`507241d` («align type-specific field validation») hizo condicionales el precio y la
   procedencia** —sólo se pintan en lo que se vende— y no tocó los page objects. `/publicar` abre en
   `anuncio`, así que `fillFields` esperaba un `spinbutton` de precio que no existe en la página, y
   el escenario moría por tiempo agotado a los 90 s.
2. **`b9ebdf2` («complete editable contact fields») cambió la etiqueta del teléfono a «Teléfono»** y
   los page objects seguían buscando `/t[eé]lefono/i`, que casa «telefono» y «télefono» pero no
   «teléfono». Esta sólo salió a la luz al arreglar la primera: antes el escenario ya había muerto
   en el precio.

Al arreglar esas dos apareció una tercera, del mismo tipo:

3. **`multimediaMultiple.spec.ts` publicaba un producto con `price: "0"`.** Un producto lleva
   `min="1"`, y la Server Action ya lo rechazaba con «El precio debe ser mayor a cero», así que ese
   camino nunca pudo publicar: lo único que cambió es *dónde* se rechaza. Sus cinco escenarios
   hermanos usan precios reales (120, 80, 45, 25); ese `0` era el único fuera de línea, y el
   escenario prueba que una imagen y un vídeo conviven, no el precio.

Se repararon las tres, sólo en los page objects y el escenario:

- `src/e2e/createPost/PublishPage.ts` — elige el tipo (y la procedencia) **antes** del precio, con
  `producto` y `reventa_cercana` por omisión, que es lo que implica pasar `price`. Locator del
  teléfono corregido.
- `src/e2e/publishProduct/PublishProductPage.ts` y `src/e2e/unifiedCatalog/UnifiedCatalogPage.ts` —
  la selección del tipo sube al principio de `fill`, por la misma razón. Locator corregido.
- `src/e2e/multimedia/multimediaMultiple.spec.ts` — precio válido en el escenario del vídeo.

Es reparación de andamiaje: **ningún archivo de producción cambió por esto.**

Después de las tres:

| Lote | Antes | Después |
| --- | --- | --- |
| `createPost` | 2 / 3 | **3 / 3**, incluida la publicación completa — la señal que importaba |
| `multimedia/multimediaMultiple` | 0 / 5 | **5 / 5**. El del vídeo pasa en 5,1 s donde antes agotaba los 90: era el precio, no la lentitud |

### Desviaciones del roadmap

1. **`/en/publicar` no existe: es `/en/publish`.** `routing.ts` traduce la ruta, no sólo el prefijo.
   Se corrigió en el `.feature` y en el roadmap.
2. **Se retiró del `.feature` la fila «navegador en inglés en `/publicar`».** No se puede probar: el
   proxy de next-intl detecta el idioma y redirige a `/en/publish` antes de que la página se pinte,
   así que nadie llega ahí. La propiedad que sí se prueba —y que es la que importa— es que el mismo
   navegador vea español en `/publicar` e inglés en `/en/publish`.
3. **«El navegador y el servidor comparten hueco» pasó de Playwright a Vitest** (`@component`).
   Montarlo en un navegador exigía un envío completo con archivos subidos para provocar un rechazo
   que el navegador no pudiera ver, y la propiedad es del reparto del hueco, no del recorrido.

### Follow-ups

- El contador de `TextArea` sigue arrancando en `0` con `defaultValue` y sigue desapareciendo cuando
  hay error. Es el slice 3, tal como estaba planeado.
- `state.errors.media` sigue sin pintarse en `PublishForm`. Es el slice 2.
- Los seis errores previos de `typecheck:tests` no son de este trabajo, pero conviene que alguien los
  recoja: mientras estén, ese comando no sirve como señal.
- **La Playwright no se corría desde hace al menos dos commits.** Es lo que dejó pasar las dos
  roturas de los page objects. Cualquier cambio a los campos de `/publicar` obliga a correr al menos
  `createPost`, `multimedia` y `unifiedCatalog`, que son los que lo conducen.

### Recap

Publicar y editar ya no enseñan el globito del navegador: el `<form>` es `ValidatedForm`, que lo
apaga con `noValidate` y se queda con el veredicto de `validity` para pintar, bajo cada campo y en
el idioma de la ruta, la misma frase del catálogo que contestaría la Server Action. El mensaje
aparece al salir del campo o al primer envío fallido, se borra en la tecla que lo arregla, y al
enviar con errores el foco salta al primer campo inválido en vez de dejar a la persona buscando. El
mecanismo vive en el design system sin tocar el catálogo, y las frases las ponen dos hooks de
`presentation/`, así que los formularios de cuenta, tienda y admin ya sólo necesitan cambiar su
`<form>` por `ValidatedForm` para heredarlo. Vitest, typecheck, lint y check:i18n en verde, y la
Playwright de este slice también (7/7). El lote de regresión destapó de paso seis escenarios que
llevaban rotos desde los dos commits anteriores a esta rama —los page objects de `/publicar` no se
actualizaron cuando el precio se volvió condicional ni cuando cambió la etiqueta del teléfono—; se
repararon sin tocar una línea de producción.

### Próximos pasos (opciones)

1. **Slice 2 — los campos que hoy no dicen nada.** `PostMediaField` recibe `error` y lo pinta junto
   a la bandeja (hoy publicar sin archivos rechaza en silencio), el banner de editar pasa a `Alert`
   con su `role="alert"`, y la acción de editar contesta por `title` y `content`. Es el que arregla
   fallos visibles, no pulido.
2. **Slice 3 — pulido de primitivas y el resto de los formularios.** Contador sembrado con
   `defaultValue` y conviviendo con el error, `autoComplete`/`inputMode`, leyenda del `*`, y cuenta
   / tienda / admin pasando a `ValidatedForm`.
3. **Cerrar la deuda de `typecheck:tests`** antes de seguir, para que ese comando vuelva a ser una
   señal utilizable.

**Pendiente del usuario:** decir cuál de las tres opciones sigue. La Playwright de este slice y su
regresión ya se corrieron por lotes; la suite completa no, por decisión suya.

## 2026-08-19 — Slice 2: los campos que no decían nada

### Objetivo

Cerrar los rechazos silenciosos que quedaron fuera del primer slice: cuando publicar o editar falla
por falta de archivos, el mensaje debe verse junto a la bandeja de media; cuando editar falla por un
error general, debe anunciarse como alerta; y cuando editar falla por titulo o contenido vacios, la
respuesta debe caer bajo el campo que la persona tiene que corregir.

### Decisiones y racional

- `PostMediaField` recibe `error` como prop y lo pinta con `FieldHelper tone="error"`, el mismo hueco
  visual que usan las primitivas de formulario. No se invento un banner separado porque el problema
  pertenece al control de archivos, no a toda la pagina.
- `PublishForm` cablea `state.errors.media` hacia `PostMediaField`. La Server Action ya producia ese
  mensaje; lo que faltaba era la salida visual.
- `EditPostForm` usa `Alert tone="error"` para `errorMessage`. Asi queda el `role="alert"` y se
  alinea con publicar.
- `updatePost` responde con `errors.title`, `errors.content` y `errors.media` cuando el fallo es de
  campo. Esto evita esconder validaciones accionables en un mensaje general.
- El escenario e2e del media se activo en el `.feature`; los casos de editar quedaron marcados como
  `@component` porque Vitest prueba la respuesta de la Server Action y el render del formulario sin
  depender de una publicacion real editable en navegador.

### Archivos tocados

**Publicar y media**
- `src/app/[locale]/publicar/PublishForm.tsx`
- `src/app/[locale]/publicar/PublishForm.validation.test.tsx`
- `src/presentation/media/PostMediaField/PostMediaField.tsx`
- `src/presentation/media/PostMediaField/PostMediaField.test.tsx`
- `src/infra/types/Actions.d.ts`

**Editar**
- `src/app/[locale]/editar/[slug]/actions.ts`
- `src/app/[locale]/editar/[slug]/actions.test.ts`
- `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
- `src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx`

**Especificacion**
- `src/e2e/validacionFormularios/validacionFormularios.feature`
- `src/e2e/validacionFormularios/validacionFormularios.spec.ts`

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run src/presentation/media/PostMediaField/PostMediaField.test.tsx src/app/[locale]/publicar/PublishForm.validation.test.tsx src/app/[locale]/editar/[slug]/ui/EditPostForm.test.tsx src/app/[locale]/editar/[slug]/actions.test.ts` | **43 pasan / 43**, 4 archivos. |
| `pnpm run lint` | limpio, 948 archivos. |
| `pnpm run typecheck` | limpio. |
| `pnpm run test:run` | **2022 pasan / 2022**, 195 archivos. |
| `pnpm run check:i18n` | limpio: no queda texto en español escrito a mano en componentes. |
| `E2E_PORT=3106 pnpm run test:e2e:run -- src/e2e/validacionFormularios/validacionFormularios.spec.ts --shard=1/1` | **8 pasan / 8** en Chromium, shard 1/1. Primer intento dentro del sandbox expiro por `EACCES`/`ETIMEDOUT` contra la DB; el reintento fuera del sandbox paso. |

### Desviaciones del roadmap

Ninguna. El alcance quedo dentro del slice 2.

### Follow-ups

- El contador de `TextArea` sigue arrancando en `0` con `defaultValue` y sigue desapareciendo cuando
  hay error. Es slice 3.
- Todavia falta llevar `ValidatedForm` y los helpers a cuenta, tienda y admin. Es slice 3.
- `typecheck:tests` sigue siendo deuda separada; no se toco en este slice.
- La suite completa de Playwright sigue pendiente hasta terminar todos los slices, y debe correrse
  por shards/lotes, no como una sola corrida larga.

### Recap

El slice 2 deja visibles los errores que antes se perdian: publicar sin archivos ahora muestra
`Sube al menos una imagen o un video.` junto a la bandeja, editar anuncia su fallo general con
`Alert`, y la Server Action de editar devuelve titulo, contenido y media como errores de campo. La
validacion rapida, Vitest completo, typecheck, lint, i18n y el spec e2e focalizado en shard quedaron
verdes.

### Próximos pasos (opciones)

1. **Slice 3 — pulido de primitivas y otros formularios.** Arreglar contador de `TextArea`,
   `autoComplete`/`inputMode`, leyenda de requerido, y migrar cuenta / tienda / admin a
   `ValidatedForm`.
2. **Cerrar `typecheck:tests`.** Recuperar esa senal antes de seguir ampliando formularios.
3. **E2E por shards de regresion al final.** Cuando se cierren todos los slices, correr Playwright
   completo dividido en shards/lotes y registrar resultados.

**Pendiente del usuario:** elegir si seguimos con slice 3 o si primero se paga la deuda de
`typecheck:tests`.

## 2026-08-19 — Slice 3: el resto de los formularios y el pulido de las primitivas

### Objetivo

Cerrar el último slice del roadmap: llevar `ValidatedForm` a las cinco pantallas que se quedaron
fuera —cuenta (cuatro formularios) y el alta de categoría del admin—, y pagar los dos defectos de
las primitivas que la revisión inicial dejó anotados: el contador de `TextArea` que arrancaba en `0`
ignorando el valor inicial, y ese mismo contador desapareciendo justo cuando hay error.

### Decisiones y racional

**1. El contador se siembra con `defaultValue`, y si el campo es controlado se deriva de `value`.**
La versión que había en el árbol de trabajo sincronizaba `value` con un `useEffect`. Se cambió por
un valor derivado en el render (`value === undefined ? typedLength : textValueLength(value)`): un
efecto pinta primero un fotograma con la cifra vieja y la corrige en un segundo pase, que es
exactamente el parpadeo que el slice 1 ya había evitado en el reinicio del error del servidor. Sin
efecto no hay fotograma intermedio, y hay una dependencia menos que Biome pueda marcar.

**2. El contador convive con el error en vez de cederle el sitio.** Antes eran las dos ramas de un
ternario: o el mensaje, o la cuenta. Es la elección equivocada — cuando el texto está mal es cuando
más importa saber cuánto cabe todavía. Ahora el contador siempre está, y se tiñe de
`text-feedback-error` para no fingir que todo va bien.

**3. En el hueco del helper manda el error, no la pista.** Al hacer que el helper también pintara el
`hint`, la primera versión escribía `message ?? hint ?? genericErrorLabel`: con `error={true}`
—el booleano que `TextArea` admite por compatibilidad— y un `hint` puesto, la pista salía en el
hueco y con tono de error, diciendo lo que se sugería antes de escribir en lugar de lo que hay que
arreglar. Se separó en `helperText = hasError ? (message ?? genericErrorLabel) : hint`, que es la
precedencia que ya tenía `TextField`.

**4. La leyenda del `*` la pone el formulario, no el campo.** Es una frase por formulario y no por
campo, y leer el catálogo es justo lo que `design_system/` no puede hacer: por las dos razones vive
en `ValidatedForm`. Lleva `showRequiredLegend` para apagarla donde el asterisco no distinga nada
—un formulario con todo obligatorio, o con nada—.

**5. El asterisco pasa a `aria-hidden`.** Quien usa lector de pantalla ya oye «obligatorio» del
atributo `required` del control; el `*` sería la misma información dicha dos veces. Queda como señal
visual, y lo que significa lo explica la leyenda.

**6. La frase del teléfono se saca a `presentation/forms/`.** El mismo
`pattern="^\+?(\d{1,3})?[0-9]{10}$"` está en cuatro campos: publicar, editar, el alta de tienda y su
ficha. La frase que lo explica sólo la tenían los dos primeros, dentro de
`usePostValidationMessages`, que es de publicaciones y no de tiendas. `usePhoneValidationMessages`
la deja donde la alcanzan los cuatro, y el hook de publicaciones la **compone** en lugar de
repetirla — la regla de `AGENTS.md` sobre el segundo casi-duplicado aplica igual a una frase que a
un componente.

**7. `NewCategoryForm` traía nueve cadenas en español clavadas en el JSX.** Encabezado, etiquetas,
marcadores, el aviso de creación y los dos textos del botón. `check:i18n` no las veía, pero la regla
de `AGENTS.md` no distingue pantallas: pasan al namespace `admin` con su par en inglés. Fue trabajo
no planeado que salió al tocar el formulario; se hizo porque dejarlo habría sido pasar por encima de
una violación conocida.

### Archivos tocados

**Primitivas**
- `src/presentation/design_system/forms/TextArea.tsx` + `TextArea.test.tsx` (2 pruebas nuevas)
- `src/presentation/design_system/forms/FieldLabel.tsx`

**Presentación**
- `src/presentation/forms/ValidatedForm.tsx` + `ValidatedForm.test.tsx` (nuevo, 2 pruebas)
- `src/presentation/forms/usePhoneValidationMessages.ts` (nuevo)
- `src/presentation/post/usePostValidationMessages.ts` — compone el anterior

**Pantallas**
- `src/app/[locale]/cuenta/ui/{AddBranchForm,BecomeSellerForm,StoreProfileForm,UsernameSection}.tsx`
- `src/app/[locale]/cuenta/ui/accountForms.validation.test.tsx` (nuevo, 4 pruebas)
- `src/app/[locale]/admin/catalogo/ui/NewCategoryForm.tsx`
- `src/app/[locale]/admin/catalogo/ui/NewCategoryForm.validation.test.tsx` (nuevo, 1 prueba)
- `src/app/[locale]/publicar/PublishForm.tsx`, `src/app/[locale]/editar/[slug]/ui/EditPostForm.tsx`
  — `inputMode="numeric"` en precio y duración, `autoComplete="tel"` en el teléfono

**Catálogo y especificación**
- `src/i18n/messages/{es,en}.json` — `validation.requiredLegend` y diez claves en `admin`
- `src/e2e/validacionFormularios/validacionFormularios.feature` — los tres escenarios del slice 3
  pasan de `@future` a `@component`, y se suma el de la leyenda

### Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **2031 pasan / 2031**, 198 archivos (9 pruebas nuevas en 4 archivos). |
| `pnpm run typecheck` | limpio. Antes de añadir las claves daba 12 errores, los 12 por claves de catálogo que aún no existían — es exactamente la señal que da la augmentación de `next-intl.d.ts`. |
| `pnpm run lint` | limpio, 952 archivos. |
| `pnpm run check:i18n` | limpio. |
| `pnpm run build` | compila. |
| `pnpm run test:e2e:run` | **no ejecutada.** Es la corrida completa por shards que queda pendiente al cerrarse el último slice; los comandos están abajo. |

### Desviaciones del roadmap

1. **La internacionalización de `NewCategoryForm` no estaba en el alcance.** El roadmap sólo decía
   «`admin/catalogo` pasa a `ValidatedForm`». Al abrirlo aparecieron nueve literales en español, y
   se corrigieron ahí mismo (decisión 7).
2. **Se dedujo la frase del teléfono** (decisión 6). El roadmap no lo pedía; salió de que la ficha
   de tienda necesitaba la misma frase y copiarla habría sido el segundo casi-duplicado.
3. **Los tres escenarios del slice 3 quedaron `@component` y no Playwright.** Lo que prueban —la
   cuenta de caracteres, el reparto del hueco y que la acción no se ejecuta— es de composición, no
   de recorrido. Se añadió un cuarto escenario, el de la leyenda en `es` y `en`, que el `.feature`
   no tenía.

### Follow-ups

- **La corrida completa de Playwright por shards.** Es lo único que queda del roadmap entero.
- Quedan formularios con campos que siguen con `<form>` pelado y fuera del alcance de este roadmap:
  `ReportPostForm`, `TimeOffList` (alta de ausencia), `ModerationQueue` (motivo del rechazo),
  `CartLineRow` (cantidad) y `AddCommentForm`. Ninguno rechaza en silencio hoy, pero heredarían la
  leyenda y el foco con sólo cambiar la etiqueta.
- `typecheck:tests` sigue con sus seis errores previos, de otro trabajo. Ese comando no sirve como
  señal mientras estén.
- El contador de `TextArea` sigue apareciendo aunque no se declare `maxLength` (por omisión, 250).
  No es de este slice, pero es la siguiente pregunta que ese componente va a hacer.

### Recap

Con el slice 3 se cierra el roadmap. Las cinco pantallas que faltaban —las cuatro de cuenta y el
alta de categoría del admin— ya no traen su propio `<form>`: heredan de `ValidatedForm` el
`noValidate`, la frase del catálogo bajo el campo, el salto de foco al primero inválido y la leyenda
que por fin explica qué quiere decir el asterisco rojo. Las dos primitivas quedaron pulidas: el
contador de `TextArea` cuenta lo que ya venía escrito en vez de decir `0`, y se queda en pantalla
cuando hay error en vez de irse justo cuando hace falta. De paso, el formato del teléfono se dice
en un solo sitio para los cuatro campos que lo comparten, y `NewCategoryForm` dejó de tener nueve
cadenas en español clavadas en el JSX. Vitest (2031/2031), typecheck, lint, `check:i18n` y `build`
en verde.

### Próximos pasos (opciones)

1. **Correr la Playwright completa por shards** — es lo que cierra el trabajo. Va por lotes de
   directorios, matando al dueño del puerto 3000 entre uno y otro; la suite entera de una sentada se
   cae por RAM (`code=3221225794`). Y conviene repetir un lote que falle antes de diagnosticar: en
   frío es flaky. Comandos sugeridos:

   ```
   E2E_PORT=3106 pnpm run test:e2e:run -- src/e2e/validacionFormularios --shard=1/1
   E2E_PORT=3106 pnpm run test:e2e:run -- src/e2e/createPost src/e2e/publishProduct src/e2e/editPublicationTypes
   E2E_PORT=3106 pnpm run test:e2e:run -- src/e2e/multimedia src/e2e/eventos src/e2e/unifiedCatalog
   E2E_PORT=3106 pnpm run test:e2e:run -- src/e2e/sellerStore src/e2e/managePost src/e2e/localProducers
   ```

2. **Cerrar la deuda de `typecheck:tests`** — los seis errores previos, para que ese comando vuelva
   a servir de señal.
3. **Extender `ValidatedForm` a los formularios de fuera del roadmap** — reporte, ausencias,
   moderación, carrito y comentarios (ver follow-ups).

**Pendiente del usuario:** correr la Playwright completa por shards. No se lanzó desde aquí; queda
declarada como pendiente con sus comandos, y ningún resultado de este slice depende de ella salvo la
confirmación de que las cinco pantallas migradas no rompieron un recorrido existente.
