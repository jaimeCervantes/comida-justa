# Bitácora: el ritual del pilar publica

## 2026-09-07 — Slice 1: completar el ritual crea la publicación en el feed

### Objetivo

Cerrar el hueco que destapó una prueba manual: empezar y completar el ritual de un pilar no producía
ninguna publicación, así que el feed del home seguía enseñando solo cosas en venta. El ritual tenía
que dejar publicación como cualquier otra práctica.

### Diagnóstico previo

El síntoma («empecé un ritual y no aparece nada en el home») no era una regresión del slice 4 de
`010`. Consultando la base compartida se vio que había **dos sistemas paralelos** de practicar y solo
uno publicaba: el ritual del pilar (`habit_challenge_progress`, `habit_repetitions`,
`habit_celebrations` con su **propia** tabla de reacciones) y la práctica del catálogo
(`practices`/`user_practices` → post `kind='practica'`). En toda la base había **0 publicaciones de
tipo `practica`** (418 producto, 10 anuncio, 2 servicio, 2 evento): el feed nunca había mostrado una
práctica fuera del e2e, que limpia lo suyo.

### Decisiones y racional

- **Publica al marcar el día, no al celebrar un hito.** La primera propuesta fue colgar la
  publicación de los hitos (`first_cycle`, `challenge_completed`) para proteger el feed del ruido; el
  usuario la descartó: practicar **es** el acto social. El ruido se resolverá filtrando por
  seguidores (slice 5), no publicando menos.
- **Sin migración de base.** `uq_habit_repetitions_local_cycle` ya garantiza una repetición por
  persona, ritual y día, así que `ritualPracticeSlug` deriva un slug determinista de esos tres datos.
  Eso permitirá encontrar después la publicación de un día sin agregar una columna a la base
  compartida, que es propiedad de `bot-whatsapp`.
- **La persona entra al slug como huella, no como id.** El slug es una URL pública; un FNV-1a de 32
  bits en base 36 basta para distinguir personas sin publicar su id de cuenta.
- **El prefijo del slug es `practica-`** y no uno nuevo: es el que ya identifica a las publicaciones
  de práctica, incluido el barrido que limpia la base tras la suite e2e. Estrenar prefijo habría
  dejado residuo en la base compartida en cada corrida.
- **`duplicate` es el único reconocimiento que no publica.** Los otros cuatro (`first`, `repeat`,
  `comeback`, `final`) guardan repetición nueva; el día ya contado no.
- **La publicación nace sin media.** El ritual no pide foto y obligarla convertiría practicar en un
  trámite. La evidencia opcional queda para el slice 4.
- **Se corrigió la promesa de privacidad del panel.** Decía «Es privado hasta que tú decidas
  compartir»; con esto, marcar el día publica. Se reescribió el aviso y se añadió uno nuevo junto al
  botón que lo hace: prometer privacidad y publicar es peor que publicar.
- **Publicar no puede tumbar el avance.** `publishRitualPractice` no lanza: si el post falla, la
  repetición ya quedó guardada y el progreso de la persona no depende de que el feed la acepte.
- **La categoría salió gratis.** `HABIT_CHALLENGE_EXPERIENCES` ya trae `categoryKey` por pilar, así
  que no hizo falta un mapeo nuevo de pilar a categoría.

### Archivos tocados

- Dominio: `src/domain/habits/ritualPost.ts` (+ test).
- App/acción: `src/app/[locale]/pilares/publishRitualPractice.ts` (nuevo),
  `src/app/[locale]/pilares/habitChallengeActions.ts`.
- Presentación: `src/presentation/habits/HabitChallengePanel.tsx`,
  `src/presentation/habits/useHabitChallengeCopy.ts` (+ test del panel).
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json` (`practicePostTitle`,
  `practicePostBody`, `publishNote`, y `shareNote` reescrito en los dos namespaces de ritual).
- Specs y roadmap: `src/e2e/habits/elRitualPublica.feature`,
  `src/e2e/habits/elRitualPublica.spec.ts`,
  `docs/features/community/011-2026-09-07-el-ritual-publica.md`.

### Comandos clave

- `pnpm exec vitest --run src/domain/habits/ritualPost.test.ts src/presentation/habits/HabitChallengePanel.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run -- --pool=forks`
- `node node_modules/@playwright/test/cli.js test src/e2e/habits/elRitualPublica.spec.ts --reporter=line`

### Validación

- Vitest focal: 2 archivos, 37 tests pasaron (11 del dominio, 26 del panel).
- Vitest completo: 273 archivos, 2867 tests pasaron.
- Typecheck: pasó.
- Lint: 1189 archivos revisados, sin errores.
- Playwright scoped: la primera corrida dejó 1 escenario en verde y 1 en rojo por un defecto **del
  spec** (contaba en la base sin esperar la acción de servidor). Corregidos el spec y el segundo
  escenario, **el usuario corrió los dos manualmente y pasaron**.
- La corrida e2e escribe en la base compartida bajo la cuenta de la suite
  (`pw.healthy.food@gmail.com`): progreso del reto, repeticiones y publicaciones
  `practica-ritual-%`. El `afterEach` las borra con `deleteHabitChallengeTestData`. Se verificó que
  esa cuenta existe y que el ritual real del usuario (`mind-one-connection-v1`, periodo
  2026-09-07 → 2026-09-14) y su repetición del día siguen intactos.

### Desviaciones del roadmap

- El escenario «volver a marcar el mismo día no duplica» pasó de Playwright a nivel de
  componente/unidad. No es una concesión: el panel retira el día de las fechas disponibles en cuanto
  queda contado, así que **desde el navegador no existe el segundo marcado**. El e2e afirma ahora esa
  conducta real (el formulario deja de ofrecerse) y la regla de la segunda publicación vive con su
  prueba de unidad.
- El escenario de apoyo sobre la publicación del ritual quedó como `@component`: es un post como
  cualquier otro y el slice 4 de `010` ya prueba que cualquier post ofrece apoyo.

### Follow-ups

- **Slice 2 es ahora más urgente que antes:** hoy se publica a diario y **no existe ninguna forma de
  retirar una publicación** —no hay caso de uso de borrado ni de ocultado—. Mientras no exista, lo
  publicado se queda.
- Slice 3: unificar `habit_celebration_reactions` con `post_reactions` (necesita migración de datos
  en `bot-whatsapp`).
- Slice 4: evidencia opcional al marcar el día.
- Slice 5: filtrar el home por seguidores y afinidad, que es lo que hace sostenible publicar a
  diario.

### Recap

El ritual de cada pilar ya deja huella social: marcar el día crea una publicación `practica` con el
nombre del ritual y su mínimo, en la categoría del pilar, que aparece en el home como cualquier otra
y acepta apoyo y comentarios. No hizo falta tocar el esquema compartido —el slug determinista hace de
vínculo— ni obligar a subir foto. El panel dejó de prometer privacidad y avisa que marcar publica.

### Próximos pasos (opciones)

- Slice 2: poder retirar una publicación de práctica, que es el hueco más afilado que deja este
  slice.
- Slice 3: un solo contador de apoyo, unificando las reacciones de celebración con `post_reactions`.
- Slice 5: empezar el filtrado del home por personas seguidas, que es la contrapartida acordada a
  publicar todos los días.

## 2026-09-07 — Slice 2: practicar publica por los dos caminos, y con portada

### Objetivo

Cerrar las dos cosas que el usuario vio al probar: las prácticas individuales de `/practicas` no
creaban publicación, y la publicación del ritual salía con el recuadro gris «Publicación sin imagen»
porque nace sin foto.

### Decisiones y racional

- **El slug se volvió compartido y ascendió a mecanismo antiduplicado.** Pasó de
  `src/domain/habits/ritualPost.ts` a `src/domain/practices/practiceDayPost.ts` como
  `practiceDaySlug`, y el ritual publica bajo la clave `ritual-<challengeKey>`. La comprobación de
  duplicado vive en `publishPracticeDayPost`: `createUniqueSlug` devuelve otro slug cuando el pedido
  ya está tomado, y que devuelva algo distinto significa exactamente «esto ya se publicó hoy».
- **Un solo publicador para los dos caminos.** `publishPracticeDayPost` concentra validación, alta y
  registro de error; el ritual y `markPracticeDone` solo aportan título, contenido y categoría. Dos
  copias de esa cadena habrían divergido.
- **`publishPracticeEvidence` no se enganchó al punto compartido.** `recordPracticeForPillar` lo
  llaman los dos caminos, así que publicar ahí habría dado dos posts por una práctica con evidencia.
  El enganche quedó en `markPracticeDone`.
- **La portada del pilar se dibuja, no se descarga.** `PracticeCover` es marcado inline con los
  tokens `--pillar-*`: cuatro fotos serían cuatro archivos que mantener, y servir un SVG por
  `next/image` obligaría a abrir `dangerouslyAllowSVG`, que aplicaría también a lo que sube la gente.
  Lleva el número del pilar junto al color, por la misma razón que `PillarBadge`: Movimiento y Mente
  contrastan 1.14 entre sí como tinta.
- **La portada es solo de prácticas.** Un producto sin foto conserva su recuadro: ahí sí falta algo.

### Hallazgo, y cómo se resolvió

Se acordó «una publicación por práctica y día», pero no se podía observar desde la pantalla:
`/practicas` escondía el botón de marcar en cuanto el **pilar** ya contaba hoy, y la base no tiene
registro por práctica y día —`habit_repetitions` es por reto y día—. Se le planteó al usuario y
**eligió que el botón se esconda por práctica y no por pilar**.

La huella que faltaba resultó existir desde el mismo slice: **la publicación**.
`findPracticeKeysMarkedToday` calcula los slugs deterministas del día para las prácticas adoptadas y
pregunta cuáles existen. Así el botón se retira práctica por práctica sin pedirle una tabla nueva a
`bot-whatsapp`, y el jardín conserva intacta su unidad de pilar y día. La copia de `countedToday`
también cambió: decía «Hoy ya cuenta. Un pilar suma una vez al día», que ya no era la razón por la
que el botón desaparecía.

### Archivos tocados

- Dominio: `src/domain/practices/practiceDayPost.ts` (+ test), `src/domain/habits/ritualPost.ts`
  (queda solo con la regla de reconocimiento) y sus pruebas.
- App: `src/app/[locale]/publishPracticeDayPost.ts` (nuevo),
  `src/app/[locale]/pilares/publishRitualPractice.ts` (ahora delega),
  `src/app/[locale]/practiceActions.ts` (`markPracticeDone` publica).
- Presentación: `src/presentation/post/PracticeCover/PracticeCover.tsx` (+ test),
  `src/presentation/post/CardForList/CardForList.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.tsx` y sus pruebas.
- Specs y roadmap: `src/e2e/habits/elRitualPublica.feature`,
  `src/e2e/habits/elRitualPublica.spec.ts`,
  `docs/features/community/011-2026-09-07-el-ritual-publica.md`.

### Comandos clave

- `pnpm exec vitest --run src/presentation/post/PracticeCover/PracticeCover.test.tsx src/presentation/post/CardForList/CardForList.test.tsx "src/app/[locale]/[slug]/ui/PostDetail.test.tsx" src/domain/practices/practiceDayPost.test.ts src/domain/habits/ritualPost.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run -- --pool=forks`

### Validación

- Vitest focal: 5 archivos, 69 tests pasaron; más 2 archivos y 22 tests al cambiar la regla del
  botón (`PracticeCardItem`, `MyPractices`).
- Vitest completo: 275 archivos, 2880 tests pasaron.
- Typecheck: pasó.
- Lint: 1195 archivos revisados, sin errores.
- Playwright: **pendiente**. El spec creció a 4 escenarios (el de `/practicas` y el de dos prácticas
  del mismo pilar) y no se corrió en esta sesión; queda como validación pendiente, no como hecha.
- Dos pruebas de componente se reescribieron porque **la conducta cambió**, no por fragilidad: las
  dos afirmaban que el botón desaparecía para todas las prácticas del pilar.

### Desviaciones del roadmap

- Ninguna en el alcance. La regla de UI de `/practicas` cambió dentro del mismo slice, por decisión
  explícita del usuario, y con ella el escenario de dos prácticas del mismo pilar dejó de ser
  `@future`.

### Follow-ups

- Slice 3: evidencia opcional al marcar, y reconciliar el formulario de evidencia de `/habitos` —que
  hoy exige foto— con este camino.
- Slice 4: poder retirar una publicación. Sigue sin existir y ahora se publica por dos caminos.
- `findPracticeKeysMarkedToday` ata «marcada hoy» a «publicada hoy». Es cierto por construcción
  mientras marcar publique siempre, pero si algún día se puede marcar sin publicar —o retirar la
  publicación sin desmarcar—, esa equivalencia deja de valer y hará falta un registro propio.

### Recap

Practicar publica por los dos caminos: el ritual del pilar y las prácticas del catálogo desde
`/practicas` y `/habitos`. Las publicaciones sin evidencia estrenan portada de su pilar —dibujada con
los tokens del design system— en tarjeta y en ficha, así que el feed dejó de llenarse de recuadros
grises. La deduplicación vive en el slug determinista, sin tocar la base compartida.

### Próximos pasos (opciones)

- Correr el Playwright scoped de `elRitualPublica.spec.ts`, que quedó pendiente con sus 3 escenarios.
- Slice 3: evidencia opcional al marcar, en ritual y catálogo.
- Decidir la regla de UI de `/practicas` (esconder por pilar o por práctica) para cerrar lo acordado
  sobre dos prácticas del mismo pilar.
