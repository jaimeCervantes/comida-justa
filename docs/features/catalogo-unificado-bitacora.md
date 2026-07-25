# Bitácora — Catálogo unificado

Registro append-only por slice. El roadmap vive en `docs/features/catalogo-unificado.md`.

---

## Slice 1 — Esquema unificado y categoría en la publicación (2026-07-25)

### Objetivo

Preparar `posts` para que pueda contener todo lo que hoy vive en `products` (la tabla que lee el
chatbot), y entregar de paso el primer pedazo visible: publicar un producto con categoría y verla
traducida. Todo aditivo: `products` no se toca y nada se borra.

### Decisiones y por qué

- **El `embedding` va en `post_translations`, no en `posts`.** El vector se deriva del texto y el
  texto cambia con el idioma. Como la consulta de búsqueda ya se une a esa tabla para devolver
  título y slug, filtrar por `locale` agrega una condición, no un JOIN. Cambiarlo hoy cuesta una
  migración de un minuto (14 filas); con 5,000 posts sería regenerar todos los vectores.
- **`category`/`sub_category` guardan la clave de una allowlist, no la etiqueta.** Guardar
  `"Alimentación"` metería español en la UI en inglés y en el texto que alimenta el embedding.
  Mismo patrón que ya usaba `origin`.
- **Las etiquetas se resuelven por idioma en un módulo de labels, no con next-intl.** El repo no
  tiene `NextIntlClientProvider` montado y `CardForList` se renderiza también dentro de un
  componente cliente; usar `useLocale()` habría reventado en runtime. Un mapa por locale es
  testeable, no necesita provider y sigue la convención de `postOriginLabels.ts`.
- **Una categoría inválida se ignora (queda `null`), no rompe la publicación.** Es la misma
  defensa en servidor que `resolveOriginForUser`: la forma del dato se normaliza antes de validar.
- **Los selectores de categoría solo aparecen cuando el tipo es "producto".** En un anuncio serían
  ruido; obligó a volver el `<select>` de `kind` un input controlado.

### Archivos tocados

**Backend Python (Alembic — dueño del esquema)**
- `alembic/versions/0023_2026-07-25_unify_catalog_into_posts.py` (nuevo)

**Dominio**
- `src/domain/entities/post/category.ts` (nuevo) + `category.test.ts`
- `src/domain/entities/post/types.ts`

**Infra**
- `src/infra/dataAccess/db/schema/posts.ts` (espejo manual del esquema)
- `src/infra/dataAccess/createOnePost/PostgresPostRepository.ts`
- `src/infra/dataAccess/getOnePostWithPaginatedComments/PostgresGetOnePost.ts`
- `src/infra/dataAccess/posts/PostgresPostQueryRepository.ts`
- `src/infra/UI/labels/postCategoryLabels.ts` (nuevo) + test
- `src/infra/UI/components/CategoryTag/CategoryTag.tsx` (nuevo) + test
- `src/infra/UI/components/CardForList/CardForList.tsx`
- `src/infra/UI/mappers/posts/mapPostsToCards.ts`

**App**
- `src/app/[locale]/publicar/actions.ts`
- `src/app/[locale]/publicar/PublishForm.tsx`
- `src/app/[locale]/[slug]/page.tsx`
- `src/app/[locale]/[slug]/ui/PostDetail.tsx`

**Pruebas**
- `src/e2e/unifiedCatalog/unifiedCatalog.feature`, `unifiedCatalog.spec.ts`, `UnifiedCatalogPage.ts`
- `src/e2e/testUtils/seedPost.ts`, `readPostRow.ts` (nuevo)

### Comandos

```
pnpm run typecheck          # limpio
pnpm run lint               # limpio
pnpm run test:run           # 22 archivos, 127 pruebas en verde
venv/Scripts/python -m alembic heads   # una sola cabeza: 0023_2026_07_25
```

### Validación

- **Typecheck:** sin errores.
- **Lint:** sin errores.
- **Vitest:** 127 pruebas en verde (22 archivos). Nuevas: 12 de la allowlist de categorías,
  8 de etiquetas por idioma, 5 del componente `CategoryTag`.
- **Alembic:** la migración carga y deja una sola cabeza (`0022 → 0023`), sin ramas.
- **Playwright: NO ejecutado.** Depende de que la migración esté aplicada; queda pendiente.

### Desviaciones respecto al roadmap

- El roadmap decía "etiquetas traducidas en los archivos i18n". Se hizo con un módulo de labels
  por locale (ver decisiones). El comportamiento observable es el mismo.
- Se agregó `readPostRow.ts` como utilidad de e2e, no previsto: los escenarios con tabla
  campo/valor necesitan leer el estado guardado sin pasar por la UI.

### Pendiente sobre recursos compartidos

Nada escrito todavía en la BD compartida. La migración **no está aplicada**: mientras no se
aplique, cualquier consulta que lea `p.category` falla, es decir la home, `/productos` y el detalle
responden error. Aplicarla es el siguiente paso y requiere aprobación explícita.

### Recap

El código del slice 1 está completo y verde en todo lo que no toca la base de datos: dominio,
infra, UI y pruebas unitarias. La migración de Alembic está escrita, carga bien y no genera ramas,
pero sigue sin aplicarse, así que la aplicación no puede correr contra la BD hasta que se ejecute
`alembic upgrade head`. Los escenarios de Playwright están escritos y esperando esa aplicación.

### Próximos pasos (opciones)

1. **Aplicar la migración** (`alembic upgrade head` en el backend) y correr `pnpm run test:e2e:run`
   para cerrar el slice 1 con los escenarios en verde. **Pendiente del usuario:** autorizarlo.
2. Retro-ajustar `publishProduct.feature` a la convención nueva (bloque `Context:` y tablas de
   ejemplos), que quedó fuera de este slice.
3. Arrancar el slice 2 (migrar los 9 productos a `posts`) una vez que el 1 esté verde.

---

## Slice 2 — Migrar los 9 productos del chatbot a `posts` (2026-07-25)

### Objetivo

Traer el catálogo que hoy lee el chatbot (`products`) a `posts`, sin tocar `products`: el bot lo
sigue leyendo hasta el slice 3, así que la migración es aditiva y no hay ventana de caída.

### Decisiones y por qué

- **Se conserva el id.** `posts.id` es `text` y `products.id` es `uuid`, pero el valor es el mismo.
  Los 69 registros de `product_recommendations` guardan ids en JSON (no hay FK), así que
  conservarlos es lo único que mantiene vivo ese histórico. Por eso el script **no** usa
  `PostgresPostRepository`, que genera su propio `crypto.randomUUID()`.
- **El embedding se copia dentro de PostgreSQL**, con un `INSERT ... SELECT` que lo lee de
  `products` en el mismo statement. Nunca pasa por JavaScript: se evita serializar 768 floats y se
  garantiza que el vector es idéntico, no uno regenerado con otro texto.
- **Las reglas de mapeo viven en el dominio** (`legacyCatalog.ts`), no en el script: qué origen se
  asigna, cómo se traduce la etiqueta heredada a la clave de la allowlist y cómo se arma el
  WhatsApp son decisiones de negocio, y así se prueban sin base de datos.
- **`storage.googleapis.com` se agregó a `next.config`.** Las imágenes de los 9 productos viven
  ahí; sin el host, `next/image` lanza "hostname not configured" y la tarjeta no renderiza. Sin
  esto, el criterio de aceptación 4 no se cumplía.
- **Idempotencia por id, no por slug.** Si el post ya existe se omite; así una segunda corrida no
  duplica ni cambia nada.

### Archivos tocados

- `src/domain/entities/post/legacyCatalog.ts` (nuevo) + `legacyCatalog.test.ts`
- `src/scripts/migrateProductsToPosts.ts` (nuevo)
- `package.json` (script `migrate:products`)
- `next.config.mjs` (host de imágenes del catálogo)
- `src/e2e/unifiedCatalog/unifiedCatalog.feature` (slice 2 detallado, sin `@future`)
- `docs/features/catalogo-unificado.md` (estados de slices)

### Comandos

```
pnpm run typecheck                        # limpio
pnpm run lint                             # limpio
pnpm run migrate:products -- --dry-run    # 9 productos mapeados, sin escribir
pnpm run migrate:products                 # migrados 9, omitidos 0
pnpm run migrate:products                 # 2ª corrida: migrados 0, omitidos 9
```

### Validación (con números)

- **Mapeo (Vitest):** 12 pruebas nuevas en `legacyCatalog.test.ts`, en verde.
- **Migración:** 9 de 9 productos migrados. `posts` con `kind='producto'` pasó de 4 a **13**.
- **Ids conservados:** 9 de 9 (`join products pr on pr.id::text = p.id`).
- **Embeddings:** 9 de 9 presentes y **9 de 9 idénticos** al vector original
  (`count(*) filter (where t.embedding = pr.embedding)` = 9).
- **Media:** 9 de 9 con imagen; 0 posts con media duplicada tras la segunda corrida.
- **Idempotencia:** segunda corrida → 0 migrados, 9 omitidos, totales sin cambio.
- **Lectura de `/productos`:** la consulta del listado devuelve **13** items (los 9 migrados con
  su sub-categoría + los 4 previos).
- **Playwright:** no ejecutado en esta sesión (el hook de pre-commit lo corre completo).

### Escrito en recursos compartidos

Se insertaron **9 posts** (más sus 9 traducciones y 9 medios) en la BD compartida. `products`,
`sellers`, `orders` y `product_recommendations` **no se tocaron**. Para deshacer:

```
pnpm run migrate:products -- --remove
```

que borra exactamente los posts cuyo id existe en `products` (translations y media caen por
cascada).

### Desviaciones respecto al roadmap

- El roadmap no contemplaba tocar `next.config.mjs`; fue necesario para que las imágenes del
  catálogo rendericen.
- El roadmap decía mapear "teléfono del seller → `contact_whatsapp`". Se guardan ambos:
  `contact_phone` con el número tal cual y `contact_whatsapp` con la lada de país.

### Recap

Los 9 productos del chatbot ya son publicaciones de comida-justa, con su id original, su embedding
intacto, su imagen y su categoría, y `/productos` los lista junto a los 4 que ya existían: 13 en
total. `products` sigue en pie e intacta, así que el bot no se enteró de nada — sigue leyendo su
tabla. El script es idempotente y reversible.

### Próximos pasos (opciones)

1. **Slice 3:** crear la función SQL `search_posts_semantic` y apuntar el repositorio del backend a
   `posts`, con test golden de recomendaciones antes/después. Es el slice de mayor riesgo y el que
   permite finalmente eliminar `products`.
2. Adelantar el slice 4 (embedding al publicar) para que lo que se publique desde la web ya nazca
   indexado; no depende del slice 3.
3. Retro-ajustar `publishProduct.feature` a la convención nueva del skill.
