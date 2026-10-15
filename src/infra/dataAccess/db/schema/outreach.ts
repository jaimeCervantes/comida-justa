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
/**
 * Los pies compartidos: el bloque de contacto que va al final de cada texto que lo lleva. Espejo de
 * la migración `0062_2026_10_13`. Un registro propio y no un ajuste global: cada texto elige el suyo.
 */
export const outreachFooters = pgTable("outreach_footers", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Nombre interno («Hazlo Sano»). Nunca se publica: sirve para elegirlo. */
  name: text("name").notNull(),
  /** Lo que se pega al final, tal cual se escribió. */
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** Lo escribe la web al guardar: la base no tiene trigger. */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const outreachTexts = pgTable(
  "outreach_texts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Nombre interno («Masa madre»). Nunca se publica. */
    name: text("name").notNull(),
    /** Lo que va antes de la lista de precios, tal cual se escribió: la primera versión. */
    opening: text("opening").notNull().default(""),
    /** Lo que va después de la lista. */
    closing: text("closing").notNull().default(""),
    /** El pie que lleva (`0062`). Borrar el pie lo deja en nulo, no borra el texto. */
    footerId: uuid("footer_id").references(() => outreachFooters.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Lo escribe la web al guardar: la base no tiene trigger. */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ix_outreach_texts_footer_id").on(table.footerId)],
);

/**
 * Las otras versiones de lo que va antes de la lista (`0062`); la primera sigue en
 * `outreach_texts.opening`. A qué grupo le toca cuál lo decide la web, por día y por grupo: aquí no
 * se guarda ningún turno.
 */
export const outreachTextVersions = pgTable(
  "outreach_text_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outreachTextId: uuid("outreach_text_id")
      .notNull()
      .references(() => outreachTexts.id, { onDelete: "cascade" }),
    opening: text("opening").notNull(),
    /** Orden de las versiones: la 2, la 3… */
    position: integer("position").notNull(),
  },
  (table) => [
    index("ix_outreach_text_versions_text_id").on(table.outreachTextId),
  ],
);

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
 *
 * Es la memoria de cada grupo —su turno, el tope del día y la pausa—, así que borrar un texto deja
 * aquí sus fechas con `outreachTextId` nulo (migración `0063`): si se las llevara, los grupos donde
 * se publicó volverían a ofrecerse como nunca publicados. Borrar un grupo sí se lleva las suyas.
 */
export const outreachPublications = pgTable(
  "outreach_publications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    outreachTextId: uuid("outreach_text_id").references(
      () => outreachTexts.id,
      { onDelete: "set null" },
    ),
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
