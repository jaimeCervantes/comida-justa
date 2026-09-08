# Bitácora: prácticas como publicaciones

## 2026-09-06 — Slice 1: evidencia de práctica como publicación social

### Objetivo

Hacer que una práctica activa pueda publicarse desde `/habitos` con foto o video, sin convertirla en
un formulario genérico de venta/evento. La evidencia debía aparecer como post social `practica`,
seguir ligada al pilar y mantener el check-in simple como camino privado y rápido.

### Decisiones y racional

- Se creó un formulario específico (`PracticeEvidenceForm`) compuesto con piezas reutilizables:
  `ValidatedForm`, `PostMediaField`, `TextArea`, `Button` y `Alert`. Reusar el formulario completo
  de `/publicar` habría arrastrado tipo, precio, teléfono, fecha y duración; justo lo contrario de
  reducir fricción para practicar.
- `PostMediaField` ahora acepta etiquetas configurables. La lógica de subida, bandeja, orden y campo
  oculto queda en un solo componente, pero `/habitos` puede hablar en lenguaje de evidencia.
- `practica` se agregó como `PostKind`, pero no se ofrece en `/publicar`. Nace desde la práctica
  activa porque el servidor debe resolver pilar, categoría, título y descripción desde el catálogo.
- Publicar evidencia también registra el día del pilar con la misma regla del check-in simple: el
  avance semanal no duplica el pilar por subir más de una evidencia, pero sí permite varias
  publicaciones sociales con foto/video el mismo día.
- La tarjeta del feed distingue `practica` con una insignia y un CTA a `/practicas`, y evita carrito
  o agenda. La publicación se lee como reconocimiento, no como cosa vendible.

### Archivos tocados

- Dominio: `src/domain/entities/post/kind.ts`, `src/domain/practices/practicePost.ts`,
  `src/domain/schemas/PostValidator.test.ts`.
- App `/habitos`: `src/app/[locale]/practiceActions.ts`,
  `src/app/[locale]/habitos/page.tsx`,
  `src/app/[locale]/habitos/ui/MyPractices.tsx`,
  `src/app/[locale]/habitos/ui/PracticeEvidenceForm.tsx`.
- Publicación/feed/media: `src/app/[locale]/publicar/publishKinds.ts`,
  `src/presentation/media/PostMediaField/PostMediaField.tsx`,
  `src/presentation/post/CardForList/CardForList.tsx`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- Pruebas/specs: `src/e2e/habits/practicasComoPublicaciones.feature`,
  `src/e2e/habits/practicasComoPublicaciones.spec.ts`,
  `src/e2e/habits/testData.ts`, más pruebas colocadas junto a dominio/componentes.

### Comandos clave

- `pnpm exec vitest --run src/domain/practices/practicePost.test.ts src/domain/schemas/PostValidator.test.ts src/app/[locale]/publicar/publishKinds.test.ts src/presentation/post/CardForList/CardForList.test.tsx src/app/[locale]/habitos/ui/PracticeEvidenceForm.test.tsx`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `pnpm run test:run -- --pool=forks`
- `node node_modules/@playwright/test/cli.js test src/e2e/habits/practicasComoPublicaciones.spec.ts --reporter=line`
- `node node_modules/@playwright/test/cli.js test src/e2e/habits/practicasComoPublicaciones.spec.ts --grep "formulario de evidencia" --workers=1 --reporter=line`

### Validación

- Vitest focal: 5 archivos, 91 tests pasaron.
- Typecheck: pasó.
- Lint: 1175 archivos revisados, sin errores.
- Vitest completo: el primer `pnpm run test:run` mostró todos los tests visibles en verde pero cerró
  con código Windows `3221226505`; al repetir con `--pool=forks`, cerró correctamente con 268
  archivos y 2825 tests pasados.
- Playwright scoped: no quedó validado por entorno. La primera corrida por `pnpm exec playwright`
  falló antes de imprimir reporte por `GC heap initialization failed` al inicializar CoreCLR. La
  corrida por `node node_modules/@playwright/test/cli.js` sí arrancó, pero dentro del sandbox el
  `next dev` no pudo conectarse a la DB (`EACCES/ETIMEDOUT`). Repetida fuera del sandbox, el dev
  server terminó fallando antes del escenario por recursos insuficientes (`os error 1450`) al
  persistir caché/compilar rutas. Se cortó la corrida y se verificó que no quedara servidor
  escuchando en 3000.

### Desviaciones del roadmap

- No se implementó una tabla de vínculo práctica-post en slice 1. El vínculo queda derivado por
  `kind`, slug, categoría, título y contenido, como se acordó para evitar migración de base en esta
  primera entrega.
- No se agregó moderación/traducción/indexado automático al camino de evidencia. El slice priorizó
  la publicación social visible; conviene extraer el post-publish pipeline de `/publicar` antes de
  reutilizarlo aquí sin duplicar lógica.

### Follow-ups

- Extraer un servicio/app helper para el pipeline post-publicación: moderación, traducción e
  indexado, reusable por `/publicar` y `publishPracticeEvidence`.
- Agregar reacciones/comentarios específicos o destacados sobre posts `practica` en los siguientes
  slices.
- Repetir Playwright scoped cuando la máquina tenga memoria/handles suficientes o cuando Next dev no
  falle con `os error 1450`.

### Recap

El slice 1 deja las prácticas activas con un camino social claro: desde `/habitos`, una persona puede
subir foto/video y publicar una práctica ligada al pilar, sin pasar por el formulario de venta. El
feed reconoce esa actividad como `Práctica`, no ofrece carrito, y la publicación invita a practicar
algo parecido. El avance semanal conserva su regla de un pilar por día aunque haya varias evidencias.

### Próximos pasos (opciones)

- Slice 2: mejorar cómo el feed y el detalle de post presentan una práctica frente a productos,
  eventos y servicios.
- Slice 3: agregar reacciones de apoyo a publicaciones de práctica.
- Validación pendiente: repetir
  `node node_modules/@playwright/test/cli.js test src/e2e/habits/practicasComoPublicaciones.spec.ts --reporter=line`
  después de resolver el `os error 1450` del dev server.

## 2026-09-07 — Slice 2: práctica reconocible en feed y detalle

### Objetivo

Hacer que una publicación `practica` se lea como actividad saludable reconocible, no como venta,
servicio o evento. El feed debía reconocer a quien practica con enlace a su perfil público, y la
ficha debía llevar naturalmente a `/practicas` sin precio, teléfono, carrito ni agenda.

### Decisiones y racional

- La firma de `Card` ahora acepta un `userHref` opcional. `CardForList` lo usa solo cuando el autor
  tiene `username`, manteniendo igual las tarjetas de cuentas sin perfil reclamado.
- La consulta del feed ahora trae `u.username` y el contrato `PostUser` de data access lo declara.
  Sin eso el componente pasaba con datos manuales, pero el feed real no podía enlazar al perfil.
- `PostDetail` reconoce `kind = practica` de forma explícita: pinta contexto de práctica saludable,
  muestra CTA a `/practicas`, oculta precio/teléfono y no monta carrito, WhatsApp de pedido,
  asistencia a evento ni agenda.
- El escenario `@slice-2` dejó de ser `@future` y quedó cubierto por Playwright. También se amplió
  el helper de publicación para esperar hasta 45 s el primer submit, porque una acción de servidor
  recién compilada puede tardar más que el timeout corto de 5 s.
- Se añadió a `AGENTS.md` y al skill `nextjs-bdd-feature` la regla operativa: si Playwright falla
  dentro del sandbox por red/DB/permisos (`EACCES`, `ETIMEDOUT`, adapter de NextAuth, fuentes sin
  red), se reintenta el mismo scoped fuera del sandbox después de limpiar `.next` y puerto 3000,
  antes de diagnosticar código.

### Archivos tocados

- Presentación de posts: `src/presentation/post/Card/Card.tsx`,
  `src/presentation/post/Card/types.ts`,
  `src/presentation/post/CardForList/CardForList.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.tsx`.
- Datos: `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`,
  `src/infra/dataAccess/users/IUserRepository.ts`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- Pruebas/specs: `src/e2e/habits/practicasComoPublicaciones.feature`,
  `src/e2e/habits/practicasComoPublicaciones.spec.ts`,
  `src/presentation/post/CardForList/CardForList.test.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.test.tsx`.
- Instrucciones de trabajo: `AGENTS.md`, `.agents/skills/nextjs-bdd-feature/SKILL.md`.

### Comandos clave

- `pnpm exec vitest --run src/presentation/post/CardForList/CardForList.test.tsx "src/app/[locale]/[slug]/ui/PostDetail.test.tsx"`
- `pnpm exec vitest --run src/presentation/post/CardForList/CardForList.test.tsx "src/app/[locale]/[slug]/ui/PostDetail.test.tsx" src/infra/UI/mappers/posts/mapPostsToCards.test.ts`
- `pnpm run typecheck`
- `pnpm run lint`
- `pnpm run test:run`
- `node node_modules/@playwright/test/cli.js test src/e2e/habits/practicasComoPublicaciones.spec.ts --reporter=line`

### Validación

- Vitest focal final: 3 archivos, 52 tests pasaron.
- Typecheck: pasó.
- Lint: 1176 archivos revisados, sin errores.
- Vitest completo final: 269 archivos, 2826 tests pasaron.
- Playwright scoped: 5 escenarios pasaron en 2.5 min, corrido fuera del sandbox después de borrar
  `.next`. La corrida dentro del sandbox volvió a fallar por `EACCES/ETIMEDOUT` contra DB y recursos
  de red, que es precisamente la regla operativa que quedó documentada.
- La corrida e2e escribió datos reversibles de la suite: sesión temporal, adopción de práctica,
  progreso/repeticiones, publicaciones `practica-%` y username temporal `e2e-practicas-ana` para la
  cuenta de pruebas. El `afterEach` los limpió y restauró el username.

### Desviaciones del roadmap

- No se agregó un enlace profundo al pilar específico desde la tarjeta. Se mantuvo `/practicas`
  como puerta de baja fricción porque aún no existe un filtro/URL estable por práctica o pilar en
  esa pantalla.
- El perfil no necesitó cambios: ya lista publicaciones con `CardForList`, así que al enlazar la
  firma del feed y mantener `practica` como post normal, la evidencia queda visible en perfiles
  públicos sin duplicar una sección.

### Follow-ups

- Slice 3: reacciones de apoyo para publicaciones `practica`, empezando por una reacción simple y
  reversible.
- Considerar un filtro estable en `/practicas` por pilar/práctica para que el CTA de una evidencia
  pueda abrir una práctica relacionada exacta.

### Recap

El slice 2 deja las prácticas publicadas mejor integradas a la red social: en el feed llevan
reconocimiento al autor si tiene perfil público y siguen invitando a practicar; en la ficha se leen
como evidencia saludable, no como producto ni servicio. La validación completa de unidad, tipo, lint
y e2e scoped quedó en verde, y la regla de probar Playwright fuera del sandbox cuando hay bloqueos
de red/DB ya vive en las instrucciones del repo.

### Próximos pasos (opciones)

- Slice 3: agregar reacciones de apoyo a publicaciones de práctica.
- Slice 4: agregar comentarios moderados sobre publicaciones de práctica.
- Mejora de ruta: diseñar un destino por pilar/práctica en `/practicas` para que el CTA sea más
  específico que la portada de prácticas.

## 2026-09-07 — Slice 3: apoyo social para prácticas publicadas

### Objetivo

Dar reconocimiento visible a quien practica sin convertir la experiencia en una tabla de posiciones.
Las publicaciones `practica` necesitaban una reacción simple, reversible y contable para que la
comunidad pudiera apoyar evidencia saludable en el feed y en el detalle.

### Decisiones y racional

- La reacción se modeló como una relación única por persona y publicación. Eso evita inflar
  artificialmente el reconocimiento, pero permite retirar el apoyo sin castigar la publicación ni el
  avance semanal.
- La lógica vive en dominio y caso de uso (`practicePostReactions`) y la acción de servidor solo
  resuelve sesión, delega y revalida. Así la regla de negocio queda probada sin depender de Next.
- El contador y el estado `viewerReacted` se agregaron a las consultas de lista y detalle. El feed
  no necesita una segunda carga ni un endpoint extra para pintar el apoyo inicial.
- Solo las publicaciones de práctica muestran el control de apoyo. Productos, eventos y servicios
  mantienen sus acciones propias para no mezclar intención social con intención comercial.
- La migración real se hizo en el repo hermano `bot-whatsapp`; este repo solo actualizó su espejo de
  Drizzle para leer y escribir la tabla ya versionada por Alembic.
- La acción usa `revalidatePath(path, "page")` cuando recibe una ruta dinámica, eliminando el warning
  de Next sobre paths con segmentos `[...]`.

### Archivos tocados

- Dominio y caso de uso: `src/domain/practicePostReactions/*`,
  `src/use_cases/practicePostReactions/*`.
- Infraestructura: `src/infra/dataAccess/practicePostReactions/*`,
  `src/infra/dataAccess/db/schema/posts.ts`,
  `src/infra/dataAccess/posts/*`,
  `src/infra/dataAccess/getOnePostWithPaginatedComments/PostgresGetOnePost.ts`.
- Presentación y app: `src/presentation/post/PracticePostReaction/*`,
  `src/presentation/post/CardForList/*`,
  `src/app/(home)/PostsWithLoadMore.tsx`,
  `src/app/[locale]/page.tsx`,
  `src/app/[locale]/page/[page]/page.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.tsx`,
  `src/app/api/posts/[...pagination]/route.ts`.
- i18n y mapeos: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`,
  `src/infra/UI/mappers/posts/mapPostsToCards.ts`.
- Pruebas/specs: `src/e2e/habits/practicasComoPublicaciones.feature`,
  `src/e2e/habits/practicasComoPublicaciones.spec.ts`,
  `src/e2e/habits/testData.ts` y tests focales de tarjetas, detalle, mappers, dominio y caso de
  uso.
- Repo hermano: `bot-whatsapp/backend/alembic/versions/0055_2026-09-07_add_post_reactions.py`.

### Comandos clave

- `uv run ruff check alembic/versions/0055_2026-09-07_add_post_reactions.py`
- `uv run ruff format --check alembic/versions/0055_2026-09-07_add_post_reactions.py`
- `uv run alembic heads`
- `uv run alembic upgrade 0054_2026_09_05:0055_2026_09_07 --sql`
- `pnpm exec vitest --run src/domain/practicePostReactions/practicePostReaction.test.ts src/use_cases/practicePostReactions/setPracticePostReactionUseCase.test.ts src/presentation/post/PracticePostReaction/PracticePostReactionButton.test.tsx src/presentation/post/CardForList/CardForList.test.tsx src/app/[locale]/[slug]/ui/PostDetail.test.tsx src/infra/UI/mappers/posts/mapPostsToCards.test.ts`
- `pnpm run lint`
- `pnpm run typecheck`
- `pnpm run test:run`
- `pnpm exec playwright test 'src/e2e/habits/practicasComoPublicaciones.spec.ts' --reporter=line`

### Validación

- Migración Alembic: `ruff check`, `ruff format --check`, `alembic heads` y SQL offline pasaron; la
  migración quedó como head `0055_2026_09_07`.
- Vitest focal: 6 archivos, 73 tests pasaron.
- Lint: 1185 archivos revisados, sin errores.
- Typecheck: pasó.
- Vitest completo: 272 archivos, 2847 tests pasaron.
- Playwright scoped fuera del sandbox: validado manualmente por el usuario con el spec de 6
  escenarios `src/e2e/habits/practicasComoPublicaciones.spec.ts`.
- La corrida e2e escribe datos reversibles de la suite: usuarios/sesiones temporales, progreso de
  práctica, publicaciones `practica-%` y reacciones sobre esas publicaciones. Los helpers del spec
  eliminan esos registros al terminar.

### Desviaciones del roadmap

- Se agregó una migración Alembic en `bot-whatsapp` porque la tabla `post_reactions` no existía en
  la base compartida. No se creó migración Drizzle en este repo.
- El e2e tuvo corridas previas no contadas: una falló por falta de tabla antes de aplicar la
  migración, otra por timeout inicial de DB y otra fue interrumpida por instrucción explícita del
  usuario. La validación final considerada es la corrida manual posterior.

### Follow-ups

- Slice 4: comentarios moderados en publicaciones de práctica, reutilizando reconocimiento social
  sin abrir ruido ni spam.
- Evaluar una superficie de "Top 10 practicantes" semanal sin posiciones visibles, basada en
  actividad con evidencia y apoyo comunitario.
- Reducir el costo del calentamiento e2e de `/` y rutas compartidas para que el spec scoped vuelva a
  cerrar en minutos incluso desde `.next` limpio.

### Recap

El slice 3 deja las prácticas publicadas con apoyo social real: una persona puede reaccionar una vez,
retirar su apoyo y ver el contador actualizado tanto en feed como en detalle, sin alterar las reglas
de avance semanal. La persistencia quedó versionada en `bot-whatsapp` y el repo web solo refleja el
schema necesario para leer y escribir la tabla.

### Próximos pasos (opciones)

- Slice 4: comentarios moderados para que la evidencia saludable tenga conversación.
- Slice 5: top semanal de practicantes destacados, mostrando solo el grupo destacado y no una tabla
  completa de posiciones.
- Deuda técnica: optimizar el warm-up e2e de rutas compartidas para evitar timeouts de arranque en
  Next dev.

## 2026-09-07 — Slice 4: el apoyo es infraestructura social de cualquier publicación

### Objetivo

Replantear el slice 4 original ("comentarios en publicaciones de práctica"): el usuario confirmó que
los comentarios ya existían para toda publicación antes de esta entrega, así que no había nada que
habilitar ahí. Lo que sí distinguía una práctica del resto era el botón de apoyo del slice 3,
restringido por `kind`. Si una práctica es una publicación más, el reconocimiento social (apoyo,
conteo) debía ser capacidad de cualquier tipo de publicación; lo que cambia por tipo es el CTA
principal (comprar, agendar, asistir, contactar), no si puede recibir apoyo.

### Decisiones y racional

- Se generalizó `practicePostReactions` a `postReactions` en dominio, caso de uso, puerto e
  infraestructura: `rejectPostReactionRequest` ya no rechaza por `kind`, solo valida usuario, post
  existente e intención. El trabajo de renombrado ya venía adelantado; esta entrega lo completó y lo
  probó de punta a punta.
- Las consultas (`PostgresPostQueryRepository`, `PostgresGetOnePost`) ya calculaban `reaction_count`
  y `viewer_reacted` sin filtrar por `kind` desde el slice 3 — la restricción vivía solo en la UI. Por
  eso este slice no tocó SQL ni necesitó una migración nueva: alcanzó con quitar la condición
  `kind === PRACTICE_POST_KIND` alrededor de `PracticePostReactionButton` en `CardForList` y
  `PostDetail`, y renombrar el componente a `PostReactionButton`.
- Se auditó si faltaba `viewerId` en listados no-práctica (productos, eventos, categoría, tienda,
  perfil, pilares) antes de asumir una segunda pasada: los 13 `page.tsx` que arman esos listados ya
  leen `readViewerId()` y lo pasan hasta `CardForList`. No hubo trabajo de plomería pendiente.
- Las claves de i18n `practiceReaction*` pasaron a `reaction*` dentro del namespace `post`, sin
  choque con las `reactionCount`/`reactionSignIn` de `atomicChallenges`/`atomicSleepChallenge` (otro
  namespace, otra feature).
- El escenario de slice 4 en el `.feature` quedó como `Scenario Outline` con `@component`: la
  mecánica de extremo a extremo (servidor, persistencia, revalidación) ya la prueba el e2e de
  slice 3; lo único nuevo es que el botón se pinta también para producto/evento/servicio/anuncio, que
  es una prueba de presentación cubierta por Vitest.

### Archivos tocados

- Dominio y caso de uso: `src/domain/postReactions/*`, `src/use_cases/postReactions/*`.
- Infraestructura: `src/infra/dataAccess/postReactions/*`.
- Presentación: `src/presentation/post/PostReaction/*`,
  `src/presentation/post/CardForList/CardForList.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.tsx`.
- Pruebas actualizadas por el renombrado (mocks de la Server Action, testids `post-reaction-*`):
  `src/presentation/post/CardForList/CardForList.test.tsx`,
  `src/app/[locale]/[slug]/ui/PostDetail.test.tsx`,
  `src/app/(home)/PostsWithLoadMore.test.tsx`,
  `src/app/[locale]/eventos/ui/EventsList.test.tsx`,
  `src/app/[locale]/pilares/components/PillarLocalSection.test.tsx`,
  `src/app/[locale]/productos/ui/ProductsList.test.tsx`.
- i18n: `src/i18n/messages/es.json`, `src/i18n/messages/en.json`.
- Specs: `src/e2e/habits/practicasComoPublicaciones.feature`,
  `src/e2e/habits/practicasComoPublicaciones.spec.ts` (testid `post-reaction*`, escopado a
  `post-detail` porque las tarjetas relacionadas ahora también traen su propio control de apoyo).
- Roadmap: `docs/features/community/010-2026-09-06-practicas-como-publicaciones.md` (slice 4
  reescrito).

### Comandos clave

- `pnpm exec vitest --run src/domain/postReactions/postReaction.test.ts src/use_cases/postReactions/setPostReactionUseCase.test.ts src/presentation/post/PostReaction/PostReactionButton.test.tsx src/presentation/post/CardForList/CardForList.test.tsx "src/app/[locale]/[slug]/ui/PostDetail.test.tsx" src/infra/UI/mappers/posts/mapPostsToCards.test.ts`
- `pnpm exec vitest --run "src/app/(home)/PostsWithLoadMore.test.tsx" "src/app/[locale]/eventos/ui/EventsList.test.tsx" "src/app/[locale]/pilares/components/PillarLocalSection.test.tsx" "src/app/[locale]/productos/ui/ProductsList.test.tsx"`
- `pnpm run typecheck`
- `pnpm run lint` (más `biome format --write` sobre los 4 archivos que quedaron mal formateados)
- `pnpm run test:run -- --pool=forks`
- `node node_modules/@playwright/test/cli.js test src/e2e/habits/practicasComoPublicaciones.spec.ts --reporter=line`

### Validación

- Vitest focal: 10 archivos, 111 tests pasaron entre las dos corridas.
- Typecheck: pasó.
- Lint: 1185 archivos revisados; quedaron 4 errores de formato (herencia del trabajo a medias con
  ChatGPT) resueltos con `biome format --write`, luego 0 errores.
- Vitest completo: 272 archivos, 2855 tests pasaron.
- Playwright scoped: 6 escenarios pasaron en 2.1 min, corrido dentro del sandbox sin bloqueos de
  red/DB esta vez.
- No se corrieron los e2e de otras áreas (carrito, pedidos, agenda de servicios, eventos) que también
  usan `CardForList`. Se auditó su riesgo: todos escopan sus `getByTestId` a `add-to-cart` o
  `card-book-service` dentro de una tarjeta o del detalle, así que el nuevo botón de apoyo hermano no
  debería romper esos selectores; queda como riesgo residual no verificado, no como validación hecha.

### Desviaciones del roadmap

- El roadmap original de slice 4 ("comentarios moderados") se descartó por completo: los comentarios
  ya eran genéricos. Se reemplazó por el slice de generalización de apoyo, documentado arriba.
- No se agregó un nuevo escenario Playwright para la generalización: se decidió que la prueba de
  presentación (el botón aparece también en producto/evento/servicio/anuncio) pertenece a Vitest,
  porque el mecanismo de extremo a extremo ya lo prueba el e2e de slice 3 sobre práctica.

### Follow-ups

- Correr los e2e de carrito, pedidos, agenda de servicios y eventos cuando se toque de nuevo esa
  área, para confirmar que el botón de apoyo adicional en cada tarjeta no interfiere.
- Slice 5: top semanal de practicantes destacados.
- Evaluar si `PostReactionPost.kind`, que ya no se usa para rechazar nada, vale la pena simplificar a
  solo `id` en una limpieza posterior.

### Recap

El slice 4 deja el apoyo social como capacidad de cualquier publicación, no solo de práctica: el
mismo botón, el mismo conteo y la misma regla de una reacción por persona aplican a producto, evento,
servicio y anuncio, sin tocar SQL porque la consulta ya era genérica desde el slice 3. El CTA propio
de cada tipo (comprar, agendar, practicar algo parecido) sigue intacto junto al apoyo. Unit, tipo,
lint y el e2e scoped de práctica quedaron en verde.

### Próximos pasos (opciones)

- Correr los e2e de otras áreas que usan `CardForList` (carrito, pedidos, servicios, eventos) para
  cerrar el riesgo residual no verificado.
- Slice 5: practicantes destacados de la semana, sin posiciones visibles.
- Limpieza opcional: simplificar `PostReactionPost` a solo `id` si no aparece un uso real de `kind`.
