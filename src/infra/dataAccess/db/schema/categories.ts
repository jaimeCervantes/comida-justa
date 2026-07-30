import {
  pgTable,
  pgView,
  text,
  boolean,
  integer,
  smallint,
  timestamp,
  index,
  uniqueIndex,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/**
 * Espejo del esquema que administra Alembic en el backend Python
 * (`0026_2026-07-28_centralize_catalog_taxonomy.py`, ver `docs/database.md`).
 * Nunca correr `drizzle-kit generate/migrate` contra esta BD: se edita a mano después de que la
 * migración de Alembic quedó aplicada.
 *
 * Categorías y sub-categorías viven en la misma tabla: `parent_key` en `null` es una raíz. La
 * profundidad máxima de dos niveles la impone un trigger, no un CHECK — un CHECK no puede
 * consultar otra fila.
 */
export const categories = pgTable(
  "categories",
  {
    key: text("key").primaryKey(),
    parentKey: text("parent_key").references((): AnyPgColumn => categories.key, {
      onUpdate: "cascade",
      onDelete: "restrict",
    }),
    level: smallint("level").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    /** Orden canónico del selector; no es alfabético. */
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("ix_categories_parent").on(table.parentKey)],
);

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryKey: text("category_key")
      .notNull()
      .references(() => categories.key, { onUpdate: "cascade", onDelete: "cascade" }),
    locale: text("locale").notNull(),
    label: text("label").notNull(),
    /**
     * Columna generada (`category_normalize(label)`). Es lo que permite que `?q=panadería`
     * encuentre "Panadería": se compara texto normalizado contra texto normalizado.
     */
    labelNormalized: text("label_normalized"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.categoryKey, table.locale] }),
    index("ix_category_translations_locale").on(table.locale),
    index("ix_category_translations_label_norm").on(table.labelNormalized),
  ],
);

/** Sinónimos de búsqueda (`pan`, `bread`, `zumo`), no deuda heredada. */
export const categoryAliases = pgTable(
  "category_aliases",
  {
    alias: text("alias").primaryKey(),
    aliasNormalized: text("alias_normalized"),
    categoryKey: text("category_key")
      .notNull()
      .references(() => categories.key, { onUpdate: "cascade", onDelete: "cascade" }),
    /** Por qué existe este alias; se lee en el psql, no en el git blame. */
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("ux_category_aliases_normalized").on(table.aliasNormalized),
    index("ix_category_aliases_category").on(table.categoryKey),
  ],
);

/**
 * El contrato de lectura que comparten los tres repositorios: 7 claves × 2 locales = 14 filas.
 * Cabe entera en memoria, y por eso se cachea completa en vez de unirse en cada consulta.
 */
export const categoryLabels = pgView("category_labels", {
  key: text("key").notNull(),
  parentKey: text("parent_key"),
  level: smallint("level").notNull(),
  isActive: boolean("is_active").notNull(),
  sortOrder: integer("sort_order").notNull(),
  locale: text("locale").notNull(),
  label: text("label").notNull(),
  labelNormalized: text("label_normalized"),
}).existing();
