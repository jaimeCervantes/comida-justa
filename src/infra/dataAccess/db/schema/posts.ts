import { pgTable, text, numeric, timestamp, integer, uuid, index } from "drizzle-orm/pg-core";

export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    price: numeric("price"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    contactWhatsapp: text("contact_whatsapp"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_posts_created_at").on(table.createdAt.desc())],
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
