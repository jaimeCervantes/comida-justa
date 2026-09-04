import {
  boolean,
  index,
  integer,
  json,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Espejo del esquema que administra Alembic en el backend Python (ver `docs/data/001-2026-06-19-database.md`).
 * Nunca correr `drizzle-kit generate/migrate` contra esta BD: se edita a mano después de que
 * la migración de Alembic quedó aplicada.
 */
export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    price: numeric("price"),
    kind: text("kind").notNull().default("anuncio"),
    origin: text("origin"),
    /** Claves de allowlist (`alimentacion`, `jugos`), nunca etiquetas traducidas. */
    category: text("category"),
    subCategory: text("sub_category"),
    /** Lo que filtra el chatbot; por defecto true para no ocultar lo ya publicado. */
    isAvailable: boolean("is_available").notNull().default(true),
    /**
     * Cuántas unidades quedan. Espejo de la migración `0048_2026_09_03`.
     *
     * **Nulo NO es cero.** Nulo significa «esta publicación no lleva inventario», que es lo que son
     * las 432 filas del día de la migración: su disponibilidad la sigue decidiendo el interruptor
     * manual de `is_available`. Cero significa que se acabó. La base sólo afirma que no sea
     * negativa (`CHECK`); que sólo un `producto` la use es regla del dominio, como `starts_at`.
     *
     * Cuando sí lleva inventario, **manda ella**: quien la escribe deriva `is_available` en la
     * misma sentencia, para que el bot, el carrito y la búsqueda sigan leyendo la columna de
     * siempre sin conocer ésta. Ver `src/domain/entities/post/stock.ts`.
     */
    stockQuantity: integer("stock_quantity"),
    /**
     * `published` | `in_review` | `rejected`, con `CHECK` en la base (migración `0040_2026_08_16`).
     * Por omisión `published`: quien inserte sin conocer la columna —el bot— sigue funcionando.
     */
    moderationStatus: text("moderation_status").notNull().default("published"),
    /** Código de `MODERATION_REASONS`, nunca texto redactado por un modelo. */
    moderationReason: text("moderation_reason"),
    moderationReviewedAt: timestamp("moderation_reviewed_at", {
      withTimezone: true,
    }),
    /**
     * Cuándo ocurre. **Solo un `evento` la usa** (migración `0042_2026_08_16`); nula en todo lo
     * demás, que es lo que hace que las 27 publicaciones de antes no cambien. Que un evento SÍ la
     * necesite es una regla del tipo y vive en `PostValidator`, no en un `CHECK`: la base no sabe
     * qué es un evento.
     */
    startsAt: timestamp("starts_at", { withTimezone: true }),
    /** Cuándo termina. Sin ella, un evento caduca en su hora de inicio (ver `event.ts`). */
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /**
     * Cuánto dura, en minutos. **Solo un `servicio` la usa** (migración `0044_2026_08_16`); es lo
     * que definirá el hueco cuando llegue la agenda. La base solo afirma que sea positiva.
     */
    durationMinutes: integer("duration_minutes"),
    sellerId: uuid("seller_id"),
    /** Enlace externo heredado del catálogo del bot (`products.product_url`). */
    externalUrl: text("external_url"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    contactWhatsapp: text("contact_whatsapp"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_posts_created_at").on(table.createdAt.desc()),
    index("ix_posts_category").on(table.category),
    index("ix_posts_seller_id").on(table.sellerId),
    /* Parcial en la base sobre `<> 'published'`: sirve al panel de moderación, no al feed. Drizzle
       solo espeja su existencia; la definición real vive en la migración. */
    index("ix_posts_moderation_pending").on(table.moderationStatus),
  ],
);

export const postTranslations = pgTable(
  "post_translations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    /**
     * `tags` y `embedding` viven aquí, no en `posts`: ambos se derivan del TEXTO y el texto
     * cambia con el idioma. 768 dimensiones = `gemini-embedding-001`, igual que el catálogo
     * del chatbot.
     */
    tags: json("tags").$type<string[]>().notNull().default([]),
    embedding: vector("embedding", { dimensions: 768 }),
  },
  (table) => [
    index("idx_translations_post_id").on(table.postId),
    index("idx_translations_slug").on(table.slug),
  ],
);

export const postMedia = pgTable(
  "post_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    type: text("type").notNull(),
    alt: text("alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    /**
     * Las dimensiones reales del archivo, o nulas cuando no se saben.
     *
     * Nulas es la verdad para los vídeos —medir uno pide `ffprobe`— y para lo que se publique
     * antes de que el formulario las capture. **`NULL` no es "es cuadrada"**: quien las pinta
     * distingue el nulo y cae al alto fijo de siempre. Las escribe Alembic (`0030`), que es la
     * fuente de verdad del esquema; aquí solo se leen.
     */
    width: integer("width"),
    height: integer("height"),
  },
  (table) => [index("idx_media_post_id").on(table.postId)],
);

/**
 * Las denuncias de la comunidad. Espejo de la migración `0041_2026_08_16`.
 *
 * **Denunciar avisa, no oculta**: la publicación no cambia de estado, solo aparece en el panel con
 * su cuenta. Es una tabla y no una bandera en `posts` porque el número tiene que significar algo —
 * cuántas personas distintas—, y eso lo sostiene el `UNIQUE(post_id, user_id)`.
 */
export const postReports = pgTable(
  "post_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Sin identidad no hay a qué aplicarle el UNIQUE: una denuncia anónima no se puede contar. */
    userId: text("user_id").notNull(),
    /** Código de `MODERATION_REASONS`, el mismo vocabulario que usa el clasificador. */
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_post_reports_post_id").on(table.postId),
    unique("post_reports_one_per_person").on(table.postId, table.userId),
  ],
);

/**
 * Asistencias confirmadas a eventos. Espejo de la migración `0046_2026_08_18`.
 *
 * **Una fila por persona y publicación**: el contador solo significa algo si una persona no puede
 * aparecer dos veces en el mismo evento. La sesión da el `user_id`; el formulario solo manda la
 * intención de cambiar el estado.
 */
export const eventAttendances = pgTable(
  "event_attendances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_event_attendances_post_id").on(table.postId),
    unique("event_attendances_one_per_person").on(table.postId, table.userId),
  ],
);

/**
 * El recorrido de una publicación. Espejo de la migración `0043_2026_08_16`.
 *
 * **1:1 impuesto por la forma**: la clave primaria es el `post_id`, así que dos recorridos para la
 * misma publicación no son un caso a resolver más tarde, son un imposible.
 *
 * Vive aparte de `posts` por **tamaño**: una ruta de 2.000 puntos son ~32 KB, el valor más grande
 * del esquema, y `posts` es la tabla que leen el feed, la búsqueda, el sitemap, la tienda y el bot.
 *
 * `path` es `geography(LINESTRING,4326)`, igual que `branches.location`, para que el día que se
 * pregunte "¿qué rutas pasan cerca?" sirvan las mismas funciones que ya se usan. Drizzle no tiene
 * tipo para geografía, así que se declara como texto: **se lee y se escribe con SQL explícito**
 * (`ST_AsGeoJSON` / `ST_GeogFromText`), nunca por esta columna directamente.
 */
export const postRoutes = pgTable("post_routes", {
  postId: text("post_id")
    .primaryKey()
    .references(() => posts.id, { onDelete: "cascade" }),
  path: text("path"),
  /** Medidos sobre el archivo COMPLETO, antes de reducir los puntos para dibujar. */
  lengthMeters: integer("length_meters").notNull(),
  /** Cuántos puntos traía el original: dice cuánto se redujo sin reabrir el archivo. */
  sourcePoints: integer("source_points").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
