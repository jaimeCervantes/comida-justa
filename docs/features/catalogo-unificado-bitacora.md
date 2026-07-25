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
