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
