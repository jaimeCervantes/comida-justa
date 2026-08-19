# Bitácora — Página de marca en el menú (`/info` → `/nosotros`)

Append-only. Roadmap en `docs/features/content/001-2026-07-25-nosotros.md`.

## Slice 1 — renombrar `/info` a `/nosotros` y ponerla en el menú

**Fecha:** 2026-07-25

**Objetivo:** que la página que explica qué es Hazlo Sano tenga una URL semántica y sea alcanzable
desde el menú principal, sin robarle intención de búsqueda a `/productos`.

### Decisiones y por qué

- **`/nosotros`, no `/productos-naturales`.** La segunda pega más keyword, pero el contenido de
  producto de esta página ya está en `/productos` y en los posts de cada producto — sembrados desde
  aquí, según `src/scripts/seedHazloSanoProducts.ts`. Dos URLs propias compitiendo por
  "crema de cacahuate natural" se restan entre sí. `/nosotros` toma la intención de marca y la
  keyword secundaria viaja en el `<title>`: "Qué es Hazlo Sano - Ecosistema de vida sana".
- **Redirect 308, no borrar la ruta.** `permanent: true` es lo que le dice al buscador que mueva la
  autoridad de `/info` a `/nosotros`. Se cubrió también `/:locale(es|en)/info` porque next-intl
  sirve rutas con prefijo. Los redirects de `next.config` corren **antes** del middleware, así que
  el 308 sale primero y la detección de idioma actúa después.
- **`metadata.ts` aparte, copiando `productos/metadata.ts`.** El canónico es dato de SEO, no de
  render; sacarlo del componente deja la página como presentación pura y da un solo lugar donde
  cambiar título/descripción.
- **Anchor text del footer cambiado** de "Productos Naturales" a "Qué es Hazlo Sano": un enlace
  interno con el anchor del competidor es exactamente la canibalización que se quería evitar.
- **"Nosotros" antes de "Productos" en el menú:** la narrativa va marca → catálogo.
- **La entrada mobile no entró en `MENU_ITEMS`**, porque ese array es para secciones con submenú;
  se replicó el patrón del link plano de "Productos".

### Archivos tocados

- **Ruta:** `src/app/[locale]/nosotros/page.tsx` (movida con `git mv` desde `info/`),
  `src/app/[locale]/nosotros/metadata.ts` (nuevo).
- **Config:** `next.config.mjs` (bloque `redirects()`, antes inexistente).
- **Navegación:** `src/infra/UI/components/Header/Nav.tsx`,
  `src/infra/UI/components/Header/MobileNav.tsx`, `src/infra/UI/components/Footer/Footer.tsx`.
- **Docs/comentarios:** `src/scripts/seedHazloSanoProducts.ts` (referencia a `/info`).
- **Tests:** `src/e2e/about/{about.feature, AboutPage.ts, about.spec.ts}` (nuevos).

### Comandos clave

```
pnpm run typecheck     # tras borrar .next/types, que aún tenía el validator apuntando a /info
pnpm run lint
pnpm run test:run
pnpm run build
pnpm run test:e2e:run
```

### Validación

- Vitest: **22 archivos / 127 tests en verde**.
- `pnpm run build`: OK, `/[locale]/nosotros` en el árbol de rutas y `/info` ya no aparece.
- Playwright, suite completa: **16 passed / 3 skipped**, incluidos los 2 escenarios nuevos de
  `about`.
- Manual contra el dev server: `/nosotros` → 200, `/info` → 308 con `Location: /nosotros`.

### Desviaciones respecto al roadmap

- **El e2e no pudo correr en el primer intento.** La `posts` de la Supabase compartida todavía no
  tenía `category`/`sub_category`, así que `/` y `/productos` daban 500 y Playwright ni siquiera
  reusaba el dev server. Se corrió después de que el usuario aplicó la migración de Alembic.
- **Mi propio test del redirect falló primero por leer el salto equivocado.** En un navegador la
  cadena real es `/info --308--> /nosotros --307--> /en/nosotros`: Chromium manda
  `Accept-Language: en-US` y next-intl (`localePrefix: 'as-needed'`) redirige al idioma detectado.
  `redirectedFrom()` devuelve el **último** salto, no el primero. Se cambió a
  `page.request.get("/info", { maxRedirects: 0 })`, que mide exactamente el 308 que le importa a un
  buscador y es inmune al idioma del navegador.

### Hallazgo fuera de este slice (corregido)

Al revisar el fallo de `unifiedCatalog` se encontró un bug real de `catalogo-unificado` slice 1:
`CreateOnePostUseCase` armaba el DTO campo por campo y **nunca copiaba `category`/`subCategory`**
(`createOnePostUseCase.ts:56-69`). La Server Action los resolvía bien y el repositorio los escribía,
pero llegaban `undefined` → la BD guardaba `null` y `CategoryTag` no renderizaba nada. Nada lo
cachó porque `Post.category` es opcional (TypeScript no avisa) y el test unitario solo verificaba
`kind`, `origin` y `price`. Se agregaron las dos líneas y se extendió el unitario a `category` /
`subCategory`. El mismo test e2e falló después por `"Juices"` vs `"Jugos"`, otra vez por la
detección de idioma: se añadió `test.use({ locale: "es-MX" })` al describe para que el visitante
hispanohablante del escenario sea explícito y no una suposición.

### Follow-ups

- No hay `sitemap.ts` en el proyecto; cuando exista, `/nosotros` debe entrar y `/info` no.
- Slice 2 (`@future`): mover el detalle de producto de esta página a los posts de `/productos` para
  eliminar el contenido duplicado.

### Recap

`/info` ya no existe como ruta: la página de marca vive en `/nosotros`, con su propio `metadata.ts`
y canónico, H1 "Qué es Hazlo Sano", entrada "Nosotros" en el menú desktop y mobile, footer
apuntando ahí y un 308 permanente desde la URL vieja. Todo validado con typecheck, lint, 127 tests
unitarios, build y la suite e2e completa (16 passed / 3 skipped). De paso quedó corregido un bug de
`catalogo-unificado` que impedía guardar la categoría al publicar.

### Próximos pasos (opciones)

1. **Cerrar aquí** y hacer commit de las dos cosas por separado: el rename + menú, y el fix de
   `category` en el caso de uso (pertenece a `catalogo-unificado`, conviene su propio commit).
2. **Slice 2 de esta feature:** mover el detalle de crema de cacahuate y pan de masa madre a sus
   posts de producto y dejar `/nosotros` como página de marca pura.
3. **Traducir `/nosotros` al inglés.** Hoy `/en/nosotros` sirve el mismo contenido en español,
   porque la página nunca se internacionalizó. Es preexistente, pero ahora es más visible al estar
   en el menú.

**Pendiente del usuario:** decidir si el fix de `CreateOnePostUseCase` se anota también en
`docs/features/catalog/002-2026-07-25-catalogo-unificado-bitacora.md` (es su feature, no la toqué).
