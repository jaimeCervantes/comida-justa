import {
  pgTable,
  text,
  numeric,
  timestamp,
  integer,
  uuid,
  index,
  boolean,
  json,
  vector,
} from "drizzle-orm/pg-core";

/**
 * Espejo del esquema que administra Alembic en el backend Python (ver `docs/database.md`).
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
    sellerId: uuid("seller_id"),
    /** Enlace externo heredado del catálogo del bot (`products.product_url`). */
    externalUrl: text("external_url"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    contactWhatsapp: text("contact_whatsapp"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_posts_created_at").on(table.createdAt.desc()),
    index("ix_posts_category").on(table.category),
    index("ix_posts_seller_id").on(table.sellerId),
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
  },
  (table) => [index("idx_media_post_id").on(table.postId)],
);
