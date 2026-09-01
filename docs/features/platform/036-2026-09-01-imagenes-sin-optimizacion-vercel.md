# Imágenes sin optimización de Vercel

## Contexto

- Problem: en producción, Vercel responde `402 Payment Required` para URLs `/_next/image` que
  intentan optimizar imágenes remotas de Firebase Storage.
- Savings: se recupera la disponibilidad de imágenes sin depender del cupo o billing de Image
  Optimization de Vercel.
- Why: el sitio público necesita mostrar sus imágenes de producto/contenido aunque se pierda la
  optimización automática de Vercel.

## Slice 1 - Desactivar Image Optimization globalmente

### Alcance

- Configurar `images.unoptimized = true` en `next.config.mjs`.
- Mantener los `remotePatterns` documentados como allowlist de hosts conocidos para el código que
  sigue usando `next/image`.
- Añadir cobertura para que el HTML renderizado no emita URLs `/_next/image` para imágenes remotas.
- Documentar el tradeoff: las imágenes vuelven a cargar directo desde Firebase/Google Storage, sin
  transformación ni caché de Image Optimization en Vercel.

### Criterios de aceptación

- Una imagen remota renderizada por `next/image` conserva como `src` la URL original remota.
- El HTML de la página no usa `/_next/image` para esa imagen remota.
- `pnpm run typecheck`, `pnpm run lint` y la prueba enfocada pasan.

### Fuera de alcance

- Migrar archivos entre buckets.
- Cambiar tamaños, compresión o formatos de las imágenes ya subidas.
- Reemplazar `next/image` por `<img>` en componentes existentes.
