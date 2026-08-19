import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Espejo del esquema que administra Alembic en el backend Python (ver `docs/data/001-2026-06-19-database.md`).
 * Nunca correr `drizzle-kit generate/migrate` contra esta BD: se edita a mano después de que
 * la migración de Alembic quedó aplicada (aquí, `0027_2026-07-31`).
 *
 * La tabla nació para el chatbot, así que trae columnas que la web no administra
 * (`has_membership`, `has_paid_ads`, `category`): se declaran para que las lecturas sean
 * completas, no para escribirlas desde aquí.
 */
export const sellers = pgTable(
  "sellers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    /** La dirección pública: `/tienda/<slug>`. Nula en los vendedores que creó el bot. */
    slug: text("slug"),
    /** Taxonomía propia del chatbot (`'Food'`), ajena a la tabla `categories`. */
    category: text("category").notNull(),
    /** `UNIQUE` en la base: dos tiendas no pueden compartir teléfono. */
    phone: text("phone").notNull(),
    url: text("url"),
    logoUrl: text("logo_url"),
    description: text("description"),
    hasMembership: boolean("has_membership").notNull().default(false),
    hasPaidAds: boolean("has_paid_ads").notNull().default(false),
    /** La cuenta dueña de la tienda. Nula: un proveedor local puede existir sin cuenta. */
    userId: text("user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_sellers_slug").on(table.slug),
    index("ix_sellers_user_id").on(table.userId),
  ],
);
