# Bitácora — Cada pilar enseña su práctica

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.10 · /pilares**.

---

## Slice 1 — «Leer más» con destino (2026-08-23)

### Las tres anotaciones del 5.10, revisadas

| Anotación | Estado |
| --- | --- |
| «Cada tarjeta lleva su práctica» | **faltaba** — es este slice |
| «El jardín cuenta repeticiones, no días… con la nota de privacidad a la vista» | ya estaba (`CommunityHabitGarden`) |
| «La celebración es del hito, no del texto libre» | ya estaba (`PublicHabitCelebrationList`) |

El canvas nombra `buildCommunityGarden` por su nombre, así que las dos últimas se dibujaron
mirando lo que ya existía. La primera no.

### Qué faltaba

La tarjeta de cada pilar decía número, título, subtítulo, descripción y «Leer más →». Cuatro
conceptos, y ninguna cosa que hacer: el enlace no prometía nada concreto. Ahora lleva delante el
nombre de su ritual —«Del atardecer al amanecer»— bajo el rótulo *práctica*, y entonces «Leer más»
tiene destino.

### El nombre vive bajo la clave del reto, no la del pilar

`atomicChallenges.<reto>.title` es donde están esos nombres, y el reto y el pilar **no se llaman
igual** en el cuarto: `mind` frente a `mindSpirit`. La equivalencia ya existía en
`PILLAR_KEY_BY_CHALLENGE`, escrita precisamente para que nadie volviera a emparejarlas a mano.

Hacía falta el camino de vuelta, y **se deriva de ella** en vez de escribirse otra vez: una segunda
tabla en el otro sentido sería la copia que la primera vino a evitar. `pilaresData.test.ts` recorre
los cuatro de ida y vuelta, comprueba que no sobra ni falta ninguno, y afirma explícitamente el par
que no se llama igual.

### Lo que afirma la e2e

Que **lo que promete la tarjeta es lo que hay dentro**: se lee el nombre anunciado en la portada, se
entra a ese pilar y se comprueba que aparece. Si el emparejamiento estuviera cruzado, la tarjeta
anunciaría la práctica de otro y esto se pondría rojo.

No copia ningún nombre: esos textos se afinan, y una prueba que los transcribe se cae en cada
retoque de redacción.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/pilares"` | **138 en verde** (3 nuevas de la equivalencia) |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (1002 archivos) |
| `pnpm exec playwright test src/e2e/pilares` | **13/13** |

### Recap

La portada dejó de ser un índice de conceptos: cada pilar dice qué se hace con él, y la prueba
garantiza que lo que anuncia es lo que se encuentra al entrar.

### Próximos pasos (opciones)

1. **El botón «Elegir mi práctica» del héroe**, que el canvas pone junto a «Meta 5 de 7 días · leer
   no pide cuenta» — es la salida directa a la práctica sin pasar por el artículo.
2. **5.11 · /nosotros**.
3. **5.15 · /cuenta**.

## Slice 2 — La portada abre y cierra invitando a practicar (2026-08-23)

Continúa el 5.10. Era el **próximo paso número 1** que dejó escrito la entrada anterior: «el botón
"Elegir mi práctica" del héroe, que el canvas pone junto a "Meta 5 de 7 días · leer no pide cuenta"».

### Dónde estaba el diseño

El canvas no estaba en el repo ni entre los artifacts publicados; el proyecto «Design System» de
claude.ai/design está vacío. Vive en otro proyecto, `204186e2…`, en el archivo
**`Hazlo Sano - Sistema de diseño v2.dc.html`**. Ojo: el `(standalone).html` de al lado **no sirve**
—es solo el cargador del bundle y no contiene ni una palabra del diseño—. Queda anotado para la
próxima.

Sus dieciséis secciones van de `5.1 · header y búsqueda` a `5.16 · pie de página y 404`; la de esta
página es `5.10 · /pilares · portada de los cuatro`.

### Las tres anotaciones ya estaban; faltaba la composición

Las anotaciones del 5.10 —cada tarjeta con su práctica, el jardín contando repeticiones con su nota
de privacidad, la celebración del hito— las cerró la entrada anterior. Lo que faltaba era el
esqueleto: el canvas **abre y cierra con la misma acción**, «Elegir mi práctica», y la página no
tenía ninguna de las dos.

### El hallazgo: copia muerta esperando su componente

Los cuatro textos del bloque de cierre llevaban escritos en el catálogo desde antes de esto:
`habitCommunity.invitation.{eyebrow,title,body,cta}` — «Tu turno» / «Practica algo que inspire a la
comunidad» / … / «Elegir mi práctica». **No los pintaba nadie.** Traducidos a dos idiomas, revisados
en cada barrido de i18n, y sin llegar nunca a una pantalla. `PracticeInvitation` les da cuerpo.

La etiqueta del CTA del héroe sale de esa misma clave y no de una nueva: el canvas escribe lo mismo
en los dos sitios, y dos claves con el mismo texto se separan en cuanto alguien retoca una.

### La línea que el canvas ya no podía prometer

El canvas pone «Meta 5 de 7 días · leer no pide cuenta» bajo el CTA. **La primera mitad dejó de ser
cierta esta misma tarde**: el slice 2 de `026` hizo la meta proporcional, así que quien se suma un
domingo tiene «1 de 1 día» y un jueves «3 de 4». Ponerla habría estrenado una promesa falsa justo en
la página que presume de no afirmar de más.

Acordado con el usuario: **«Una meta que cabe en tu semana · leer no pide cuenta»**. Cierta cualquier
día, y en la voz que ya usa el intro del canvas («una versión mínima que cabe hoy»). La segunda mitad
se queda tal cual, que es la que importa en una portada: leer no pide cuenta.

La e2e lo protege por la negativa — el héroe **no** afirma un número fijo de días — para que nadie lo
reintroduzca copiando del canvas sin mirar el dominio.

### Un enlace, no un botón

Ambas invitaciones son `<a>` vestidos con `buttonVariants`. El docstring de ese módulo ya lo pedía a
gritos: «un CTA que navega tiene que ser un `<a>`: se abre en pestaña nueva, se copia su dirección y
un rastreador lo sigue». Y como esta portada **es** el hub de práctica —lo dice su propia e2e—, el
destino es un ancla a las tarjetas de abajo, no un salto a otra página.

### Y el `max-w-3xl` que sobraba

«¿Por qué estos cuatro pilares?» estaba encajonado en `max-w-3xl mx-auto`, contra la regla de páginas
a todo el ancho. La tarjeta pasa a ocupar el ancho de la página y el límite de medida se queda **en
el párrafo**, que es donde sirve: una cosa es que la página no se estreche y otra que un renglón mida
doscientos caracteres.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `PracticeInvitation.tsx` (**nuevo**), `PillarHero.tsx` (+`action`, +`actionNote`) |
| Ruta | `PilaresOverviewPage.tsx` |
| Catálogo | `es.json`, `en.json`: `pillarsOverview.heroNote` |
| Especificación | `portada.feature` y `portada.spec.ts` |

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec playwright test src/e2e/pilares` | **15/15** (2 nuevas) |
| `pnpm exec vitest --run src/presentation/habits src/app/[locale]/pilares` | **212 en verde** |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios |
| Renderizado real en `next dev` | héroe con CTA + nota, cierre «Tu turno», 2 enlaces a `#practicas` y 1 ancla |

### Recap

`/pilares` deja de ser un índice que explica: abre ofreciendo elegir una práctica y cierra invitando
a hacerlo, con las dos invitaciones apuntando a las mismas cuatro tarjetas. Se rescató un bloque
entero que llevaba escrito en el catálogo sin que nadie lo pintara, y la única línea del canvas que
el dominio ya había desmentido se reescribió en vez de copiarse.

### Próximos pasos (opciones)

1. **La composición móvil del 5.10**, que el usuario dejó fuera de este slice: el canvas pone en el
   teléfono héroe → jardín compacto → lista compacta de los cuatro → CTA, y hoy el teléfono recibe el
   orden de escritorio con las tarjetas enteras. Es un rehacer de la página, no un retoque.
2. **El editor enriquecido** (`docs/features/content/027`), que sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
3. **Otras secciones del canvas sin hacer**: `5.12 · /productores-locales`, `5.13 · /habitos`,
   `5.16 · pie y 404`.
