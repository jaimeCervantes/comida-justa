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
