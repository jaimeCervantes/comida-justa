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

## Migraciones

Se usa **Drizzle Kit** para generar y aplicar migraciones.

```sh
# Generar migracion a partir del schema
pnpm drizzle-kit generate

# Aplicar migraciones pendientes
pnpm drizzle-kit migrate
```

Las migraciones se generan en `src/infra/dataAccess/db/migrations/`.

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

# Aplicar migraciones
pnpm drizzle-kit migrate

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
