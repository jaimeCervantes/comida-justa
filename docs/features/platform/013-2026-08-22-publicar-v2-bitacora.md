# Bitácora — /publicar estrena el asistente del 5.3

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **5.3 · publicar**.
> El asistente había quedado **fuera por acuerdo** al cerrar v2 (slice 13 solo repintó el
> formulario) y entra ahora por petición explícita del usuario.

---

## Slice 1 — Tres pasos (2026-08-22)

### Decisiones acordadas

| Pregunta | Elegido |
| --- | --- |
| ¿Asistente de tres pasos? | **Sí** |
| ¿Guardado de borrador («se guarda solo cada cambio»)? | **Ahora no** — necesita persistencia y decidir qué pasa con las fotos ya subidas |

### El reparto, y por qué no copia al canvas

El canvas parte un formulario de cuatro campos; este tiene doce. El reparto sigue las tres preguntas
que alguien se hace al publicar — y **coincide con el orden en que los campos ya estaban escritos**,
así que envolverlos no obligó a reordenar una sola línea de JSX:

| Paso | Campos |
| --- | --- |
| 1 · lo esencial | `title`, `kind`, `category`, `subCategory` |
| 2 · los detalles | `origin`, `startsAt`, `endsAt`, `route`, `durationMinutes`, `price` |
| 3 · cuándo y cómo te encuentran | `media`, `phone`, `content` |

El mapa vive en `publishSteps.ts`, no dentro del componente, por lo mismo que `menuItems.ts` y
`bottomNavTabs.ts`: es una regla y se prueba sin navegador. Su prueba **lee los `name=` del propio
formulario**, así que un campo nuevo sin paso asignado la rompe — un campo huérfano no se vería en
ninguna pantalla y el formulario no se podría enviar.

### Lo que no se pudo hacer, y qué se hizo en su lugar

El primer diseño dejaba «Publicar» en los tres pasos, para no obligar a cruzar tres pantallas a
quien ya terminó. Eso abría un agujero: al enviar desde el primero, los errores de los otros dos
quedaban tras un `hidden` — se leía «el título es obligatorio» y nada decía que faltaban el teléfono
y la descripción.

Se intentó **marcar los pasos pendientes** en la barra, por tres vías distintas:

1. Un gancho `onInvalidFields` en el primitivo `Form`, leyendo `form.elements`.
2. El evento `invalid` por `onInvalidCapture` de React.
3. Un oyente DOM nativo en captura sobre el contenedor.

**Las tres funcionaban en jsdom y ninguna llegaba en un navegador de verdad**: ni saltaba de paso ni
marcaba nada, y el foco al primer campo inválido —que antes funcionaba— dejaba de moverse. Medido
sobre Chrome: el formulario sí es inválido (`checkValidity() === false`, `invalid: ["title",
"phone", "content"]`), y aun así `document.activeElement` seguía siendo el botón.

Enviar un mecanismo que solo funciona en las pruebas es peor que no tenerlo, así que se retiró. Y el
gancho en `Form` se revirtió por completo: mientras estuvo puesto, **rompió el foco de
`/editar`**, que no tiene nada que ver con este slice.

Lo que queda es lo que el 5.3 dibuja y no necesita ese mecanismo: **se avanza con «Continuar» y se
publica en el último paso**, cuando ya se han visto los tres. Los puntos de la barra siguen
navegando libremente para quien quiera volver, y un rechazo del servidor sigue llevando al paso que
contiene el campo — eso sí se pudo verificar.

### Las pruebas no se tocaron una por una

`openPublishStep(page, field)` vive **una vez** en `src/e2e/testUtils/`, y deriva el paso de
`PUBLISH_STEPS`, el mismo mapa que usa el componente. Lo consumen los dos page objects y el spec que
conduce el formulario a pelo. Si mañana el precio cambia de paso, los tres lo siguen sin editarse.
Su gemelo para Vitest es `publishFormHarness.ts`.

Es el rédito directo de la regla que se escribió ayer en `AGENTS.md`: los specs afirman la promesa,
y quien sabe cómo llegar a un campo es el page object, no cada aserción.

### Archivos tocados

**Nuevos**
- `publicar/publishSteps.ts` · `publishSteps.test.ts` · `publishFormHarness.ts`
- `publicar/ui/PublishStepper.tsx`
- `src/e2e/testUtils/openPublishStep.ts`

**Modificados**
- `publicar/PublishForm.tsx` — los tres pasos, la navegación y el salto al paso del error del servidor
- `src/i18n/messages/{es,en}.json` — ocho rótulos del asistente
- `src/e2e/createPost/PublishPage.ts` · `publishProduct/PublishProductPage.ts` — cruzan el asistente
- `src/e2e/validacionFormularios/validacionFormularios.spec.ts` · los dos tests de componente

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/publicar"` | **69 pruebas** en verde |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (984 archivos) |
| `pnpm exec playwright test validacionFormularios publishProduct createPost filtroAlPublicar` | 23 verdes + el de `verifyForm`, corregido después |
| `pnpm exec playwright test createPost dimensionesMedia multimedia` | **19/19 en verde** |

### Recap

`/publicar` es un asistente de tres pasos: se avanza con «Continuar», se publica al final y los
puntos de la barra dejan volver a cualquier paso. Qué campo vive en qué paso es un dato probado
contra el propio formulario, y las pruebas llegan a los campos por un helper único en vez de saber
el reparto de memoria. Se descartó el marcado de pasos pendientes porque no funcionaba fuera de
jsdom — y arreglarlo a ciegas habría dejado en el repo un mecanismo que miente.

### Próximos pasos (opciones)

1. **Slice 2 — la vista previa («así se verá») y el checklist («Falta poco»)**, que son las dos
   piezas del 5.3 que faltan y las de más valor: enseñan la tarjeta con lo que se lleva escrito.
2. **Los controles del 5.3**: `kind` como píldoras segmentadas, contador de caracteres en el título,
   precio con `$`/`MXN` y el pilar con su número.
3. **El marcado de pasos pendientes**, si aparece una vía que funcione en el navegador.
