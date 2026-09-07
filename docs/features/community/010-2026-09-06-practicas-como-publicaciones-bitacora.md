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
