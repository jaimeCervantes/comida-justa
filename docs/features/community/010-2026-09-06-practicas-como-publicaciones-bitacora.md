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
