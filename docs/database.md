# Base de datos

## Schema PostgreSQL

El schema esta normalizado en 3 tablas. Los usuarios NO tienen tabla propia porque viven en Firebase Auth.

```sql
-- Tabla principal de posts
CREATE TABLE posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         text NOT NULL,              -- Firebase UID
  price           numeric,
  contact_phone   text,
  contact_email   text,
  contact_whatsapp text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Traducciones (un post puede tener varias: "es", "en", etc.)
CREATE TABLE post_translations (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id  uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale   text NOT NULL,
  title    text NOT NULL,
  slug     text NOT NULL,
  content  text NOT NULL,
  UNIQUE(post_id, locale)
);

-- Archivos multimedia asociados al post
CREATE TABLE post_media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url        text NOT NULL,
  type       text NOT NULL,    -- "image" | "video"
  alt        text,
  sort_order int NOT NULL DEFAULT 0
);
```

### Indices

```sql
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_translations_post_id ON post_translations (post_id);
CREATE INDEX idx_translations_slug ON post_translations (slug);
CREATE INDEX idx_media_post_id ON post_media (post_id);
```

### Ubicacion de archivos

```
src/infra/dataAccess/db/
  connection.ts          — pool singleton de PostgreSQL + Drizzle
  schema/
    posts.ts             — definicion de las 3 tablas en Drizzle
  migrations/
    0001_good_chat.sql   — migracion inicial autogenerada
```

## Migraciones — Alembic es la fuente de verdad (⚠️ IMPORTANTE)

La base de datos es **compartida** con el backend de Python (bot de WhatsApp), ubicado en
`C:\Users\S2G52\Desktop\jaimito\HazloSano\bot-whatsapp\backend`. Ese backend administra el schema
con **Alembic**, y es la **única** fuente de verdad de migraciones.

Las tablas que usa este app (`posts`, `post_translations`, `post_media`, `comments`, `users`,
`accounts`, `sessions`, `verification_tokens`) fueron creadas por Alembic (ver `alembic/versions/`,
p. ej. `0020_..._unify_users_for_nextauth.py` y `0021_..._add_comida_justa_tables.py`).

### NO migrar la BD con Drizzle

`drizzle-kit generate/migrate` **no debe usarse** contra esta BD. El schema Drizzle en
`src/infra/dataAccess/db/schema/` es solo un **espejo de consulta/tipos** para el app Next.js; no
conoce las columnas que Alembic administra (p. ej. `users.external_id`), así que `generate` produce
migraciones entrelazadas y potencialmente destructivas. Regla:

- **Cambio de schema** → nueva migración **Alembic** en el backend, encadenada desde el head actual,
  y luego `alembic upgrade head`.
- **Espejo Drizzle** → actualiza a mano `src/infra/dataAccess/db/schema/*.ts` para que los tipos y
  consultas del app coincidan con lo que Alembic creó. Nunca corras `drizzle-kit generate`.

> Nota: el backend además tiene su propio dominio de comercio (`products`, `sellers`, `branches`,
> `ads`, `seller_membership`) para el bot. `products` desapareció al unificar el catálogo, y
> **`sellers` ya la usa el sitio**: es el perfil comercial detrás de `/tienda/<slug>`
> (`src/infra/dataAccess/db/schema/sellers.ts` es su espejo). `branches` sigue siendo solo del bot
> hasta el slice de sucursales.

### Migraciones aplicadas desde el sitio

| Migración | Qué agregó | Para qué |
|---|---|---|
| `0023` | `posts.seller_id`, `sellers.user_id`, categorías, `is_available`, embeddings | Catálogo unificado |
| `0026` | Taxonomía centralizada en `categories` | Categorías en la base |
| `0027` | `sellers.slug`, `users.username` (ambas nullable, con índice único) | Direcciones públicas: `/tienda/<slug>` y, a futuro, `/u/<username>` |

## Seed de datos (Firestore → PostgreSQL)

El script `src/scripts/seedPosts.ts` copia todos los posts de Firestore a PostgreSQL:

```sh
npx tsx src/scripts/seedPosts.ts
```

El script:
1. Lee todos los posts de Firestore
2. Inserta cada post en las tablas `posts`, `post_translations`, `post_media`
3. Maneja conflictos con `ON CONFLICT DO UPDATE` / `DO NOTHING` (idempotente)
4. Convierte Firestore `Timestamp` → `Date` de JavaScript

## Desarrollo local con Docker

```sh
# Iniciar PostgreSQL local
docker compose -f docker-compose.dev.yml up -d postgres

# Aplicar migraciones (desde el backend de Python, NO Drizzle)
#   cd .../bot-whatsapp/backend && alembic upgrade head

# Seed de datos (opcional)
npx tsx src/scripts/seedPosts.ts

# Iniciar la app
pnpm dev
```

La URL de conexion local es: `postgresql://postgres:postgres@localhost:5432/comida_justa`

## Produccion (Supabase)

En produccion se usa el **Session Pooler** de Supabase para conexiones serverless:

```
DATABASE_URL=postgres://[user]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify
```

El pool de conexiones esta configurado en `connection.ts`:
- `max: 10` conexiones
- `idleTimeoutMillis: 30000`
- `connectionTimeoutMillis: 2000`
- SSL con `rejectUnauthorized: false`

## Coexistencia Firestore + PostgreSQL

Mientras `DB_PROVIDER=firestore`, la app lee posts desde Firestore (comportamiento original). Las unicas consultas que pasan por PostgreSQL cuando `DB_PROVIDER=postgres` son:

- `getMultiplePosts()` — listado de posts con paginacion
- `getTotalPosts()` — conteo total de posts

El resto de operaciones (crear post, comentarios, busqueda) siguen usando Firestore directamente. Conforme se migren mas funcionalidades, se agregan metodos a `IPostQueryRepository` (o nuevas interfaces) y sus implementaciones PostgreSQL.
