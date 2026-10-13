import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { posts } from "./posts";

/**
 * Textos de difusión: lo que se pega en un grupo de Facebook. Espejo de la migración
 * `0060_2026_10_13` de `hazlo-sano-bot`; se edita a mano y nunca se genera desde aquí.
 *
 * **Solo lo que está aquí se publica.** La descripción del producto en el sitio no se usa, aunque
 * hoy la de los panes empiece igual. Ver `docs/features/commerce/030-2026-10-04-difusion-en-grupos.md`.
 */
export const outreachTexts = pgTable("outreach_texts", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Nombre interno («Masa madre»). Nunca se publica. */
  name: text("name").notNull(),
  /** Lo que va antes de la lista de precios, tal cual se escribió. */
  opening: text("opening").notNull().default(""),
  /** Lo que va después de la lista. */
  closing: text("closing").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Lo escribe la web al guardar: la base no tiene trigger. */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Qué productos lleva cada texto, con qué etiqueta, emoji y orden.
 *
 * **No guarda precios ni existencias**: la lista se arma con lo que dice `posts` cada vez que se
 * abre, para que ningún texto anuncie un precio viejo ni algo agotado.
 */
export const outreachTextItems = pgTable(
  "outreach_text_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outreachTextId: uuid("outreach_text_id")
      .notNull()
      .references(() => outreachTexts.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    /** Lo que se lee en el renglón: «Natural», no «Pan de Masa Madre Natural». */
    label: text("label").notNull(),
    emoji: text("emoji"),
    /** Orden en que se agregaron: decide el orden de las etiquetas dentro de un renglón. */
    position: integer("position").notNull(),
  },
  (table) => [
    index("ix_outreach_text_items_post_id").on(table.postId),
    unique("outreach_text_items_one_per_text").on(
      table.outreachTextId,
      table.postId,
    ),
  ],
);

/**
 * Los grupos donde se difunde. Espejo de la migración `0061_2026_10_13` de `hazlo-sano-bot`.
 *
 * `format` es `post` (grupo normal) o `listing` (compraventa): la lista vive en
 * `src/domain/outreach/channelFormats.ts` y la base no lleva `CHECK`, como `posts.kind`.
 */
export const outreachChannels = pgTable("outreach_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  format: text("format").notNull(),
  /** Cada cuántos días acepta una publicación de la misma persona. 0 = sin límite. */
  minDaysBetween: integer("min_days_between").notNull().default(7),
  /** Las reglas del grupo, tal cual las escribió quien publica. */
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Lo escribe la web al guardar: la base no tiene trigger. */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Dónde quedó publicado cada texto, y cuándo. Lo marca la persona después de publicar; nada lo
 * escribe solo. `postId` es el pan vendido suelto en un grupo de compraventa; nulo, la línea entera.
 */
export const outreachPublications = pgTable(
  "outreach_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outreachTextId: uuid("outreach_text_id")
      .notNull()
      .references(() => outreachTexts.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => outreachChannels.id, { onDelete: "cascade" }),
    postId: text("post_id").references(() => posts.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    /* En la base es `(channel_id, published_at DESC)`; Drizzle solo espeja su existencia. */
    index("ix_outreach_publications_channel_published").on(
      table.channelId,
      table.publishedAt,
    ),
    index("ix_outreach_publications_text_id").on(table.outreachTextId),
    index("ix_outreach_publications_post_id").on(table.postId),
  ],
);
