# Base de datos

> Volcado del esquema **real** el 2026-08-09, contra la base compartida (`alembic_version` =
> `0032_2026_08_09`). La versión anterior de este documento describía una base que ya no existía:
> tres tablas, `posts.id` como `uuid` cuando es `text`, un `UNIQUE(post_id, locale)` que nunca se
> creó, y una sección entera sobre leer de Firestore. Si vuelves a dudar, el volcado se reproduce
> con las consultas de `information_schema` en vez de creerle a este archivo.

## Lo que hay que saber antes de tocar nada

1. **La base es compartida** con el backend Python del bot de WhatsApp
   (`C:\Users\S2G52\Desktop\jaimito\HazloSano\bot-whatsapp\backend`). Ese backend administra el
   esquema con **Alembic**, y es la **única** fuente de verdad de migraciones.
2. **Nunca corras `drizzle-kit generate/migrate`.** El esquema Drizzle de
   `src/infra/dataAccess/db/schema/` es un **espejo de consulta y tipos**, no una definición: no
   conoce las columnas que Alembic administra ni las 8 tablas que solo usa el bot, así que
   `generate` produce migraciones entrelazadas y potencialmente destructivas.
   - **Cambio de esquema** → migración Alembic en el backend, encadenada desde el head, y
     `alembic upgrade head`.
   - **Espejo Drizzle** → edítalo a mano para que coincida con lo que Alembic creó.
3. **La app ya no lee de Firestore.** `DB_PROVIDER` sigue en los `.env` pero **ningún archivo de
   `src/` lo lee**: es una variable muerta. Todo pasa por PostgreSQL. Firebase se sigue usando
   para *storage* de imágenes y vídeo, no para datos.

## Qué tabla es de quién

26 tablas. No todas son de este sitio:

| Tabla | La usa | Notas |
| --- | --- | --- |
| `posts`, `post_translations`, `post_media` | **el sitio** (y el bot lee) | el contenido |
| `comments` | **el sitio** | 45 filas |
| `users`, `accounts`, `sessions`, `verification_tokens` | **el sitio** (NextAuth) | `users` la comparten los dos |
| `categories`, `category_translations`, `category_aliases` | **el sitio** y el bot | taxonomía centralizada |
| `sellers` | **el sitio** y el bot | el perfil detrás de `/tienda/<slug>` |
| `branches` | **el sitio** y el bot | sucursales con `location` PostGIS; es lo que da las distancias |
| `seller_translations`, `branch_translations` | **el sitio** | desde `0029`. Español sembrado; el camino de lectura es el slice 5 de i18n |
| `searches` | **el sitio** | desde `0029`. Qué se busca y cuánta gente se va vacía |
| `follows` | **el sitio** | desde `0031`. Seguir a una tienda o a una persona |
| `customer_orders`, `customer_order_items` | **el sitio** | desde `0032`. Los pedidos y sus renglones con el precio congelado |
| `messages`, `orders`, `prompts`, `ai_training_logs`, `product_recommendations` | **solo el bot** | no hay espejo Drizzle |
| `social_posts`, `social_post_deliveries` | **solo el bot** | desde `0028`. Ledger de publicación en redes |
| `alembic_version` | Alembic | |

`products` ya no existe: desapareció al unificar el catálogo dentro de `posts`.

## El esquema que usa el sitio

```sql
-- 23 filas. El id es TEXT, no uuid: convive el id de Firestore ("j5FOSBacjlJrX9dRU2Hw")
-- con el uuid de lo creado después ("1bb033d3-9bc2-48cd-9608-b7e8b7443ea1").
CREATE TABLE posts (
  id               text PRIMARY KEY,
  user_id          text NOT NULL REFERENCES users(id),
  price            numeric,
  kind             text NOT NULL DEFAULT 'anuncio',   -- 'anuncio' | 'producto'
  origin           text,
  category         text REFERENCES categories(key) ON DELETE RESTRICT,
  sub_category     text REFERENCES categories(key) ON DELETE RESTRICT,
  is_available     boolean NOT NULL DEFAULT true,     -- lo que filtra el chatbot
  seller_id        uuid REFERENCES sellers(id),
  external_url     text,                              -- enlace heredado del catálogo del bot
  contact_phone    text,
  contact_email    text,
  contact_whatsapp text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (sub_category IS NULL OR category IS NOT NULL)
);

-- 46 filas: las 23 publicaciones en 'es' y en 'en'.
-- `tags` y `embedding` viven aquí y no en `posts` porque ambos se derivan del TEXTO,
-- y el texto cambia con el idioma.
CREATE TABLE post_translations (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  locale    text NOT NULL,
  title     text NOT NULL,
  slug      text NOT NULL,
  content   text NOT NULL,
  tags      json NOT NULL DEFAULT '[]',
  embedding vector(768)          -- gemini-embedding-001, el mismo modelo que el bot
  -- ⚠️ NO hay UNIQUE(post_id, locale). Ni sobre slug. Ver "Lo que la base NO impide".
);

CREATE TABLE post_media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url        text NOT NULL,
  type       text NOT NULL,      -- 'image' | 'video'
  alt        text,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE comments (
  id         text PRIMARY KEY,
  post_id    text NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    text NOT NULL REFERENCES users(id),
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Usuarios y sesiones (NextAuth sobre la tabla del bot)

```sql
-- 21 filas. `external_id` es de cuando los usuarios vivían en Firebase Auth; sigue siendo
-- NOT NULL y único. `username` y `email` son nullable pero únicos: dos NULL no chocan.
CREATE TABLE users (
  id                  text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  external_id         varchar NOT NULL UNIQUE,
  name                varchar,
  email               text UNIQUE,
  email_verified      timestamptz,
  image               text,
  username            text UNIQUE,
  last_latitude       double precision,
  last_longitude      double precision,
  location_updated_at timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (…);              -- PK (provider, provider_account_id)
CREATE TABLE sessions (…);              -- PK session_token
CREATE TABLE verification_tokens (…);   -- PK (identifier, token)
```

### Tiendas y sucursales

```sql
-- 1 fila. `slug` es la dirección pública: /tienda/<slug>.
CREATE TABLE sellers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           varchar NOT NULL,
  category       varchar NOT NULL,
  phone          varchar NOT NULL UNIQUE,
  slug           text UNIQUE,
  user_id        text UNIQUE REFERENCES users(id),
  url            varchar,
  description    varchar,
  logo_url       varchar,
  has_membership boolean NOT NULL DEFAULT false,
  has_paid_ads   boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 1 fila. `location` es geography(Point,4326) de PostGIS, con índice GiST:
-- es lo que hace posible ST_Distance y por tanto todas las distancias del sitio.
CREATE TABLE branches (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id),
  name      varchar NOT NULL,
  address   varchar NOT NULL,
  map_url   varchar NOT NULL,
  location  geography(Point, 4326) NOT NULL
);
```

### Traducciones de tienda y sucursal (desde `0029`)

```sql
CREATE TABLE seller_translations (
  seller_id   uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  locale      text NOT NULL,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (seller_id, locale),
  CHECK (locale IN ('es', 'en')),
  CHECK (btrim(name) <> '')
);

CREATE TABLE branch_translations (   -- igual, más `address text NOT NULL`
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  …
);
```

**Las columnas originales de `sellers` y `branches` no se vaciaron ni se van a vaciar**: el bot de
WhatsApp las lee y no sabe de locales. Las tablas nuevas son aditivas y sus filas `es` se sembraron
copiando lo que ya había, así que nacieron consistentes.

Falta el **camino de lectura**: la ficha de tienda sigue leyendo `sellers.name` y `branches.address`
directos. Es el slice 5 de i18n, que ya no está bloqueado por esquema.

### Pedidos (desde `0032`)

```sql
-- Los N pedidos nacidos de un mismo carrito comparten `checkout_id`. Hoy N es siempre 1,
-- porque hay una sola tienda: existe para el día que no.
CREATE TABLE customer_orders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id uuid NOT NULL,
  seller_id   uuid NOT NULL REFERENCES sellers(id),
  user_id     text NOT NULL REFERENCES users(id),
  status      orderstatus NOT NULL DEFAULT 'PENDING',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- `title` y `unit_price` son COPIAS del momento en que se pidió, no referencias: si el
-- vendedor sube el precio mañana, el pedido de ayer no cambia.
CREATE TABLE customer_order_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   uuid NOT NULL REFERENCES customer_orders(id) ON DELETE CASCADE,
  post_id    text REFERENCES posts(id) ON DELETE SET NULL,   -- nullable a propósito
  title      text    NOT NULL,
  unit_price numeric NOT NULL,
  quantity   integer NOT NULL,
  CHECK (quantity > 0),
  CHECK (unit_price >= 0)
);
```

**No hay columna `total`.** Se suma de los renglones, que son la única verdad; una copia
denormalizada solo puede desincronizarse de lo que la compone.

**`post_id` es nulo con `ON DELETE SET NULL`, y eso es el diseño, no un descuido.** Si la
publicación desaparece, el renglón sobrevive con su copia — que es justo para lo que se guardó. Con
`RESTRICT`, el histórico bloquearía para siempre el borrado de cualquier producto que alguien haya
pedido una vez.

**Qué transición de estado vale NO lo impone la base.** El enum acepta los siete valores y cualquier
salto entre ellos; las reglas (`PENDING → CONFIRMED → PREPARING → DELIVERED`, y `CANCELLED` desde
cualquier punto menos el último) viven en `src/domain/order/order.ts`. Son de negocio, van a cambiar
—con el pago en línea, `PAID` se mete en medio— y tienen que dar un mensaje entendible en vez de una
violación de constraint.

> **`orders` NO es esta tabla.** `orders` es el **carrito** del bot y sigue siendo suya: allí una
> fila nace en `DRAFT` sin vendedor y va acumulando artículos en un JSON conforme avanza la
> conversación de WhatsApp (`app/use_cases/orders.py`, inyectado en `api/dependencies.py`). El enum
> `orderstatus` sí se comparte. Ver "Por qué NO se reusa `orders`" en `docs/features/pedidos.md`.

### Taxonomía

```sql
-- 11 filas. Dos niveles, con la jerarquía forzada por CHECK.
CREATE TABLE categories (
  key        text PRIMARY KEY,
  parent_key text REFERENCES categories(key) ON DELETE RESTRICT,
  level      smallint NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (key ~ '^[a-z0-9]+(_[a-z0-9]+)*$'),     -- guion BAJO, nunca medio
  CHECK (level IN (1, 2)),
  CHECK ((level = 1 AND parent_key IS NULL) OR (level = 2 AND parent_key IS NOT NULL)),
  CHECK (parent_key IS DISTINCT FROM key),
  UNIQUE (key, parent_key)
);

CREATE TABLE category_translations (
  category_key text NOT NULL REFERENCES categories(key) ON DELETE CASCADE,
  locale       text NOT NULL,
  label        text NOT NULL,
  label_normalized text,
  PRIMARY KEY (category_key, locale),
  CHECK (locale IN ('es', 'en')),
  CHECK (btrim(label) <> '')
);

CREATE TABLE category_aliases (
  alias            text PRIMARY KEY,
  alias_normalized text UNIQUE,
  category_key     text NOT NULL REFERENCES categories(key) ON DELETE CASCADE,
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
```

`CHECK (locale IN ('es','en'))` en `category_translations` es la única parte del esquema que
**enumera los idiomas**: añadir un tercero pide una migración aquí.

## Índices

```sql
-- posts
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX ix_posts_category ON posts (category);
CREATE INDEX ix_posts_sub_category_category ON posts (sub_category, category);
CREATE INDEX ix_posts_seller_id ON posts (seller_id);

-- post_translations
CREATE INDEX        idx_translations_post_id     ON post_translations (post_id);
CREATE UNIQUE INDEX ux_translations_post_locale  ON post_translations (post_id, locale);
CREATE UNIQUE INDEX ux_translations_slug         ON post_translations (slug);
CREATE INDEX ix_translations_embedding ON post_translations USING hnsw (embedding vector_cosine_ops);

-- Búsqueda de texto: TRES índices GIN parciales, uno por idioma. Ver abajo.
CREATE INDEX ix_translations_fts_es    ON post_translations USING gin ((…'spanish'…)) WHERE locale = 'es';
CREATE INDEX ix_translations_fts_en    ON post_translations USING gin ((…'english'…)) WHERE locale = 'en';
CREATE INDEX ix_translations_fts_other ON post_translations USING gin ((…'simple'…))  WHERE locale NOT IN ('es','en');

-- resto
CREATE INDEX idx_media_post_id ON post_media (post_id);
CREATE INDEX idx_comments_post_id_created_at ON comments (post_id, created_at DESC);
CREATE INDEX idx_branches_location ON branches USING gist (location);
CREATE INDEX ix_categories_active ON categories (key) WHERE is_active;
CREATE INDEX ix_categories_parent ON categories (parent_key);
CREATE INDEX ix_category_translations_locale ON category_translations (locale);
CREATE INDEX ix_category_translations_label_norm ON category_translations (label_normalized);
CREATE INDEX ix_searches_empty_handed ON searches (term) WHERE empty_handed;
CREATE INDEX ix_searches_created_at ON searches (created_at DESC);
```

### Por qué la búsqueda de texto lleva tres índices y no uno

Porque **uno solo no se usa nunca**, y esto cuesta media hora de desconcierto si no está escrito.

La consulta analiza cada fila con el diccionario de SU idioma, así que el `tsquery` también sale de
un `CASE` sobre `locale`: la clave de búsqueda **cambia de una fila a otra**. Un GIN necesita una
clave fija para descender por el índice, así que un índice único sobre esa expresión se crea sin
protestar y el planner lo ignora siempre — comprobado con `EXPLAIN` y `enable_seqscan = off`.

Partida por idioma, cada rama lleva su diccionario como constante y empareja con su índice parcial:

```
BitmapOr
  → Bitmap Index Scan on ix_translations_fts_es
  → Bitmap Index Scan on ix_translations_fts_en
  → Bitmap Index Scan on ix_translations_fts_other
```

El tercero **cubre 0 filas hoy y es imprescindible**: un `OR` solo se resuelve por índices si los
tienen todas sus ramas, y la de reserva existe para que una fila en un idioma inesperado no sea
invisible al buscar.

**Van atados a `PostgresSearchPostRepository`.** El planner solo usa un índice de expresión cuando
la expresión coincide palabra por palabra; si se desalinean no falla nada, solo se vuelve lento en
silencio. Lo vigila `rowConfigMatchesIndex.test.ts`. Un idioma nuevo pide tres cosas: su línea en
`TEXT_SEARCH_CONFIG`, su índice parcial, y recrear `ix_translations_fts_other`.

## Lo que la base NO impide (y el código sí)

Las reglas que **parecen** estar en el esquema. Dos de las tres ya están; la que falta importa
saberla:

| Regla que se asume | ¿La impone la base? | Quién la sostiene |
| --- | --- | --- |
| Una sola traducción por `(post_id, locale)` | **Sí**, desde `0029`: `ux_translations_post_locale`. | La base. El `WHERE NOT EXISTS` de `saveTranslation` se queda porque da un error legible antes de que salte el constraint. |
| Un `slug` no se repite | **Sí**, desde `0029`: `ux_translations_slug`. | La base. `createUniqueSlug` sigue desambiguando para no chocar. |
| Un idioma es `es` o `en` | **Solo** en `category_translations`, `seller_translations` y `branch_translations`. | En `post_translations` **cabe cualquier cosa**: no hay CHECK. |

Ese último hueco es deliberado por ahora: la búsqueda tiene una rama de reserva
(`ix_translations_fts_other`) precisamente para que una fila en un idioma inesperado no sea
invisible. Cerrarlo con un CHECK obligaría a una migración por cada idioma nuevo.

## Extensiones y funciones

Extensiones: `postgis`, `vector` (pgvector), `pgcrypto`, `uuid-ossp`, `pg_stat_statements`,
`supabase_vault`.

Dos funciones SQL las escribió Alembic **para el chatbot**, no para el sitio:

- `search_posts_semantic(query_embedding, p_locale, p_fallback_locale, p_threshold, p_pool_size, p_latitude, p_longitude, p_radius_m, p_exclude_ids)`
- `recommend_posts(…)` — la anterior más impulso por membresía y anuncios pagados.

**El sitio no las usa, y es deliberado**: filtran `kind = 'producto'`, así que dejarían fuera las
publicaciones de tipo `anuncio` —los artículos—, que son justo las que alguien encuentra buscando
por concepto. La búsqueda del sitio consulta `post_translations` directamente. Está medido en
`docs/features/busqueda-semantica.md`.

## Dónde vive el espejo

```
src/infra/dataAccess/db/
  connection.ts        — pool singleton + Drizzle
  schema/
    posts.ts           — posts, post_translations, post_media
    auth.ts            — users, accounts, sessions, verification_tokens
    sellers.ts         — sellers, branches
    categories.ts      — categories, category_translations, category_aliases
    comments.ts
    searches.ts        — searches
```

Las tablas que solo usa el bot (`messages`, `orders`, `prompts`, `ai_training_logs`,
`product_recommendations`, `social_posts`, `social_post_deliveries`) **no tienen espejo**, y está
bien así: el sitio no las toca.

`seller_translations` y `branch_translations` tampoco lo tienen **todavía**: el espejo existe para
las consultas del sitio, y hasta que el slice 5 de i18n las lea sería código muerto.

## Scripts

| Script | Qué hace |
| --- | --- |
| `pnpm run backfill-translations` | Traduce a `en` lo que no tenga fila. Idempotente. |
| `pnpm run backfill-embeddings` | Genera el vector de las traducciones sin indexar. |
| `src/scripts/seedPosts.ts` | Copia de Firestore a PostgreSQL. **Histórico**: la migración ya se hizo. |
| `src/scripts/migrateProductsToPosts.ts` | Unificó `products` dentro de `posts`. **Histórico.** |
| `src/scripts/verifyEmbeddingSpace.ts` | Comprueba que el sitio y el bot vectorizan en el mismo espacio. |

Traducir deja la fila **sin embedding a propósito**: son dos trabajos, y encadenarlos haría cada
script el doble de frágil. Después de un backfill de traducciones hay que correr el de embeddings o
el chatbot no las encontrará.

Para deshacer todas las traducciones automáticas:

```sql
DELETE FROM post_translations WHERE locale = 'en';
```

## Conexión

**Producción (Supabase):** Transaction Pooler, puerto **6543**.

```
DATABASE_URL=postgres://[user]:[pass]@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify
```

`connection.ts`: `max: 3`, `idleTimeoutMillis: 10000`, `connectionTimeoutMillis: 10000`, SSL con
`rejectUnauthorized: false`, y el `Pool` como singleton en `globalThis`.

`DATABASE_DIRECT_URL` apunta a la conexión directa (`db.<ref>.supabase.co:5432`) y **no** pasa por
el pooler: es la de migraciones y scripts.

### Por qué no el Session Pooler (5432)

En *session mode* el pooler amarra una conexión de Postgres a cada cliente durante toda su vida, con
un tope de 15. En Vercel cada instancia serverless es un proceso aparte con su propio `Pool`, así que
el multiplicador es el número de instancias: con `max: 10`, dos instancias concurrentes ya rebasaban
el límite y la app moría con `(EMAXCONNSESSION) max clients reached in session mode`. Como NextAuth
usa el mismo `db` vía `DrizzleAdapter`, el síntoma visible incluía también un `SessionTokenError`.

En *transaction mode* la conexión vuelve al pool al terminar cada transacción. Por eso conviene
además un `max` bajo por instancia y un `idleTimeoutMillis` corto: Vercel congela la instancia entre
peticiones y una conexión ociosa retendría su lugar sin dar servicio.

Restricciones que el código respeta hoy:

- Nada de *prepared statements* (drizzle + `node-postgres` no los usa salvo `.prepare()`).
- Nada de `LISTEN/NOTIFY` ni `SET` de sesión.
- Las transacciones caben en un solo bloque.

### Desarrollo local

```sh
docker compose -f docker-compose.dev.yml up -d postgres
# Migraciones desde el backend Python, NO Drizzle:
#   cd .../bot-whatsapp/backend && alembic upgrade head
pnpm dev
```

`postgresql://postgres:postgres@localhost:5432/comida_justa`

## Migraciones aplicadas desde el sitio

| Migración | Qué agregó |
| --- | --- |
| `0023` | `posts.seller_id`, `sellers.user_id`, categorías, `is_available`, embeddings |
| `0026` | Taxonomía centralizada en `categories` |
| `0027` | `sellers.slug`, `users.username` (nullable, con índice único) |
| `0029` | Unicidad de traducción y slug, los 3 GIN + HNSW, `searches`, `seller_translations`, `branch_translations` |
| `0030` | `post_media.width` y `post_media.height` |
| `0031` | `follows`, con sus dos únicos parciales |
| `0032` | `customer_orders` y `customer_order_items` |

`0028` es del bot (ledger de publicación en redes) y se aplicó de camino al `0029`: estaba escrita
sin aplicar y `alembic upgrade head` no la puede saltar.

Head actual: **`0032_2026_08_09`**.
