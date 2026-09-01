# Bitácora — Imágenes sin optimización de Vercel

## Slice 1 — Desactivar Image Optimization globalmente (2026-09-01)

### Objetivo

Evitar que las imágenes remotas desaparezcan en producción cuando Vercel responde `402 Payment
Required` desde `/_next/image`. La prioridad de este slice es disponibilidad: que las imágenes carguen
directo desde Firebase/Google Storage aunque se pierda la transformación automática de Vercel.

### Decisiones y rationale

**`images.unoptimized = true` global, no cambios componente por componente.** El problema ocurre en
el pipeline de Image Optimization, no en una tarjeta específica. Tocar cada `Image` con
`unoptimized` habría dejado huecos futuros: cualquier nuevo `next/image` remoto podría volver a
emitir `/_next/image`. La configuración global corta el origen del 402 para todo el sitio.

**Se conserva `remotePatterns`.** Aunque `unoptimized` hace que el navegador cargue directo desde el
host original, la allowlist sigue documentando cuáles hosts remotos reconoce el sitio y protege el
contrato si más adelante se vuelve a activar la optimización.

**El `minimumCacheTTL` queda como contexto histórico.** Con `unoptimized`, Vercel ya no transforma
esas imágenes normales, así que ese TTL no resuelve el incidente actual. No se elimina para mantener
la intención escrita si se decide reactivar Image Optimization con billing/cupo suficiente.

**Cobertura en dos niveles.** Vitest importa `next.config.mjs` y afirma el contrato de config. El
Playwright abre la home y revisa el `src` real de imágenes de Storage: si vuelve a aparecer
`/_next/image`, el escenario falla aunque la config parezca correcta.

### Archivos tocados

| Zona | Archivos |
| --- | --- |
| Config | `next.config.mjs` |
| Pruebas | `src/infra/config/nextImageConfig.test.mjs`, `src/e2e/media/imagenes-sin-optimizacion-vercel.spec.ts` |
| Especificación | `src/e2e/media/imagenes-sin-optimizacion-vercel.feature` |
| Documentación | `docs/features/platform/036-2026-09-01-imagenes-sin-optimizacion-vercel.md`, `docs/features/platform/036-2026-09-01-imagenes-sin-optimizacion-vercel-bitacora.md` |

### Comandos clave

```bash
pnpm exec vitest --run src/infra/config/nextImageConfig.test.mjs
pnpm run lint
pnpm run typecheck
pnpm run test:run
pnpm exec playwright test src/e2e/media/imagenes-sin-optimizacion-vercel.spec.ts
```

### Validación

- `pnpm exec vitest --run src/infra/config/nextImageConfig.test.mjs`: primero rojo por
  `images.unoptimized === undefined`; después 1 archivo, 2 pruebas en verde.
- `pnpm run lint`: limpio; 1062 archivos revisados.
- `pnpm run typecheck`: limpio.
- `pnpm run test:run`: 234 archivos, 2536 pruebas en verde.
- `pnpm exec playwright test src/e2e/media/imagenes-sin-optimizacion-vercel.spec.ts`: 1/1 escenario
  en verde, ejecutado fuera del sandbox porque necesita levantar la app y leer datos/rutas reales.

### Desviaciones del roadmap

El e2e no usa `toSatisfy` dentro de `expect.poll()` porque la versión instalada de Playwright no lo
soporta. Se cambió por un `poll` del conteo de imágenes remotas y assertions normales sobre los
`src` recolectados.

### Follow-ups

Conviene vigilar el tráfico/costo de Firebase Storage tras el deploy: la optimización de Vercel deja
de absorber transformaciones y caché para esas imágenes. Si más adelante se habilita billing/cupo de
Image Optimization, este cambio puede revertirse con una decisión explícita y manteniendo los tests
actualizados.

### Recap

Next queda configurado para no reescribir imágenes remotas por `/_next/image`; las imágenes de
Firebase/Google Storage cargan con su URL original, evitando el `402 Payment Required` de Vercel
Image Optimization. El costo técnico asumido es perder la transformación/caché automática de Vercel
para priorizar que el sitio muestre imágenes en producción.

### Próximos pasos (opciones)

1. Desplegar esta rama y verificar en producción que las URLs de imagen ya salgan directas a Storage.
2. Revisar métricas de Firebase Storage después del deploy para medir el cambio de tráfico.
3. Si se contrata/activa capacidad de Image Optimization en Vercel, decidir si se revierte
   `images.unoptimized` o si se mantiene el modelo directo por simplicidad.
