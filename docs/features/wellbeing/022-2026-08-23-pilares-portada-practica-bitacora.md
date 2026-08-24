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

## Slice 3 — La portada cabe en un teléfono (2026-08-23)

### Se midió antes de decidir

El usuario preguntó si la composición móvil del 5.10 vale el trabajo. En vez de opinar, se midió
`/pilares` en un iPhone 13 (390×664):

| | Antes |
| --- | --- |
| Página entera | 9712px = **14.6 pantallas** |
| Ver la práctica del primer pilar | pantalla 3.5 |
| **Ver las cuatro para poder elegir** | **pantalla 6.1** |
| Llegar al «Tu turno» | pantalla 12.4 |

Seis pantallas de scroll para ver las cuatro opciones, en una página cuyo único trabajo es que
elijas una. La respuesta era sí.

### Pero el trabajo no estaba donde el canvas lo pone

El desglose enseñó que la mayor parte **no necesitaba nada responsive**:

- **El héroe cargaba más palabras de las que el canvas pidió.** El 5.10 escribe 155 caracteres de
  intro y **ninguna cita**. Lo implementado eran 175 de intro más un blockquote de 140px que decía
  lo mismo con otras palabras. Adoptar la copia del propio canvas acorta el héroe en **todas** las
  pantallas, sin duplicar contenido.
- **Cada tarjeta medía ~420px** en el teléfono, casi todo subtítulo y descripción.

### Y una parte del canvas que no se hizo, con motivo

El canvas móvil sube **el jardín por encima de los cuatro pilares**. Eso pone «359 repeticiones
compartidas» delante de alguien que todavía no sabe qué es una repetición: **prueba social antes que
comprensión**. En escritorio va debajo de las tarjetas y ahí sí funciona, porque para entonces ya
sabes qué se cuenta. Se dejó donde estaba. Si el objetivo es que la gente elija, arriba van las
opciones y no el marcador.

Acordado con el usuario: las dos piezas baratas sí, el reordenamiento no.

### Qué se hizo

1. **La copia del héroe, la del canvas.** Intro más corta y más concreta —nombra los cuatro y dice
   qué se hace con ellos— y fuera la cita de identidad. `pillarsOverview.heroIdentity` se **borra**
   del catálogo: dejarla sin usar habría creado exactamente la copia muerta que el slice anterior
   vino a rescatar.
2. **El porqué se guarda para las pantallas que tienen sitio.** Subtítulo y descripción de cada
   tarjeta van con `hidden sm:block`. Siguen en el HTML —verificado en la respuesta del servidor, los
   leen los buscadores— y el artículo completo está a un toque, que es lo que promete el «Leer más».

Sobre accesibilidad: `display:none` sí saca esos párrafos del árbol de accesibilidad en móvil, así
que quien navega con lector de pantalla en un teléfono oye «Sueño · práctica · Del atardecer al
amanecer · Leer más». Sigue siendo una elección informada y el detalle completo está detrás del
enlace; en escritorio no cambia nada.

### El resultado, medido

| | Antes | Ahora |
| --- | --- | --- |
| Página entera | 9712px (14.6 pantallas) | **8056px (12.1)** |
| Primera práctica | pantalla 3.5 | **pantalla 2.7** |
| **Las cuatro prácticas** | **pantalla 6.1** | **pantalla 3.6** |
| Recorrido para verlas todas | 1681px | **609px** |

609px de recorrido en una ventana de 664: **las cuatro opciones caben casi de una vez**. La
estimación previa decía «pantalla ~3.4» y salió 3.6.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec playwright test src/e2e/pilares` | **15/15** |
| `pnpm exec vitest --run src/presentation/habits src/app/[locale]/pilares` | **212 en verde** |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios |
| Medición real en `next dev` con viewport de iPhone 13 | la tabla de arriba |

### Recap

`/pilares` pasó de 14.6 a 12.1 pantallas en un teléfono, y lo que importa —ver las cuatro prácticas
para elegir una— de la pantalla 6.1 a la 3.6. Se consiguió adoptando la copia que el canvas ya
proponía y guardando el porqué para donde hay sitio, sin tocar el orden de la página y sin quitar
una palabra del HTML.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — sigue siendo lo pedido y lo único
   pendiente que arregla algo roto hoy.
2. **Otras secciones del canvas**: `5.12 · /productores-locales`, `5.13 · /habitos`, `5.16 · pie y 404`.
3. Si algún día hay analítica de móvil, volver a mirar si el jardín arriba tenía razón. Hoy se
   decidió por criterio, no por datos.

## Slice 4 — La primera pantalla de un pilar ofrece algo que hacer (2026-08-24)

Cierra el **5.6 · página de pilar** del canvas, que es lo que quedaba de las cuatro páginas.

### Lo que el 5.6 pedía, y lo que ya estaba

Al comparar apareció que las cuatro páginas están **más construidas** que el dibujo. De las siete
cosas que propone el 5.6:

| El canvas propone | Estado |
| --- | --- |
| Chips de categoría y productos del pilar | **ya estaba** (`PillarLocal`) |
| Panel de seguimiento con «Marcar hoy» | **ya estaba, y más rico** (`HabitChallengePanel`) |
| Héroe con el número y «pilar uno de cuatro» | este slice |
| Héroe con dos acciones | este slice |
| «tu racha · 9 días seguidos» | **descartado** en el slice 4 de `026` |
| «sostenla catorce días» | **superado**: la ventana es la semana de la comunidad |
| «Apagar pantallas 30 min antes» | **superado**: la práctica es «Del atardecer al amanecer» |
| Testimonio firmado de la comunidad | **contra la regla**: la celebración es del hito, no del texto libre |

Cuatro de las siete las desmiente el propio producto, tres de ellas por decisiones tomadas el día
anterior. El canvas es de agosto y el dominio se le adelantó.

### Lo que se hizo

**Las dos acciones.** «Empezar la práctica» → `#practica`, «Ver lo que hay cerca» → `#cerca`. La
práctica y la sección local ya vivían en la página, pero detrás del artículo entero: quien llegaba
convencido tenía que recorrérselo para encontrar dónde empezar. El hueco del héroe ya existía —
`action` se le añadió a `PillarHero` el día anterior para `/pilares`— así que entra en los cuatro
pilares de una vez, porque `PillarArticle` es el armazón compartido.

**«Empezar la práctica» y no «Adoptar un hábito»**, que es lo que rotula el canvas. Este producto se
niega en su propia redacción a afirmar que alguien formó un hábito —`noHabitClaim` lo dice después de
cinco repeticiones—, así que prometerlo en el botón de entrada sería contradecirse en la primera
pantalla. Además «práctica» es la palabra que usa el resto del sitio.

**El número en el héroe.** Placa y «pilar uno de cuatro». No es decoración: Movimiento y Mente
contrastan 1.14 entre sí como tinta, así que el color por sí solo no distingue un pilar de otro — el
mismo motivo por el que la insignia de la tarjeta del feed ya lo lleva. El número **se deriva** de
`PILLAR_KEY_BY_CHALLENGE` y `PILLARS`, sin un cuarto emparejamiento a mano.

**Y el «1. » sale del título.** Con la placa puesta, el número salía tres veces en la misma pantalla:
la placa, «pilar uno de cuatro» y el «1.» de «1. Sueño y descanso profundo». El canvas titula «Sueño»
a secas justamente por eso.

### Tres cosas que el trabajo destapó

**Importar una constante arrastraba `next-auth`.** `PillarArticle` importó `PillarLocalSection` solo
para leer el id del ancla, y con él vino su árbol entero —tarjetas, directorio, navegación— hasta el
entorno de pruebas: las **seis** suites de páginas de pilar dejaron de cargar con un
`ERR_MODULE_NOT_FOUND` que no mencionaba ni el pilar ni el héroe. Las dos anclas viven ahora en
`pillarPageAnchors.ts`, un módulo **sin una sola importación**. Una constante no tiene capa.

**Dos colores en el mismo `class`.** La segunda acción llevaba `text-pillar-*-ink` y `text-white` a la
vez, y ahí gana el que decida el orden del CSS, no el que se escribió — el mismo enredo que ya se
llevó por delante el precio de la tarjeta del feed. Se queda solo el blanco.

**Dos specs que transcribían la redacción.** `PillarPages.test.tsx` escribía a mano título, entradilla
e identidad de los cuatro pilares, y `atomicSleepChallenge.spec.ts` el título de Sueño con su «1. ».
Quitar el prefijo tumbó las cinco de golpe **sin que nada estuviera mal**. Las dos pasan a leer del
mismo catálogo que pinta la página; la del pilar, además, usa el `h1` que ya afirmaba ser único en vez
de nombrarlo.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Presentación | `pillarPageAnchors.ts` (**nuevo**), `PillarHero.tsx` (+`number`), `PillarPracticeSection.tsx` |
| Ruta | `PillarArticle.tsx`, `PillarLocalSection.tsx` |
| Catálogo | `es.json`, `en.json`: `heroEyebrow`, `heroPracticeCta`, `heroLocalCta`; fuera el «N. » de los cuatro títulos |
| Especificación | `heroeDelPilar.feature` y su spec (**nuevos**), `PillarPages.test.tsx`, `atomicSleepChallenge.spec.ts` |

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm run test:run` | **219 de 219 archivos en verde** |
| `pnpm exec playwright test src/e2e/pilares` | **24/24** (8 nuevas) |
| `pnpm exec playwright test src/e2e/habits` | **28/28** |
| `pnpm run typecheck` · `typecheck:tests` (zona) · `lint` · `check:i18n` | limpios |

Nota de la corrida: lanzar `pilares` y `habits` **juntas** se degradó a 30 minutos con un resumen
inservible; por separado, 2.4 y 11.1 minutos. Había otro proyecto tocando la misma base a la vez. Es
otra confirmación de que esta suite se corre por lotes.

### Recap

Las cuatro páginas de pilar dejan de abrir con puro texto: su primera pantalla dice qué número de
pilar es y ofrece dos salidas —empezar la práctica, o ver lo que hay cerca— a secciones que ya
existían pero estaban enterradas. De las siete propuestas del 5.6, dos se hicieron, dos ya estaban y
cuatro las desmiente el propio producto, lo cual queda escrito para que nadie las reintroduzca
copiando del canvas.

### Próximos pasos (opciones)

1. **El editor enriquecido** (`docs/features/content/027`) — lo pedido, y lo único pendiente que
   arregla algo roto hoy.
2. **Las secciones del canvas sin tocar**: `5.12 · /productores-locales`, `5.13 · /habitos`,
   `5.16 · pie y 404`.
3. **La composición móvil del 5.6**, hermana de la que se hizo en `/pilares`: el canvas compacta
   también la página de pilar en el teléfono.
