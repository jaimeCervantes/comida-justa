import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Espejo de la tabla que crea la migración Alembic `0029_2026_08_08`.
 * Nunca correr `drizzle-kit generate/migrate` contra esta BD; ver `docs/database.md`.
 *
 * Qué se busca en el sitio y cuánta gente se va con las manos vacías. Sin `user_id` ni IP a
 * propósito: la pregunta es agregada y no necesita saber quién buscó.
 */
export const searches = pgTable("searches", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Ya normalizado y recortado a 120 por `normalizeTerm`; la base repite el límite. */
  term: varchar("term", { length: 120 }).notNull(),
  locale: text("locale").notNull(),
  /** `text` | `semantic` | `none`, con un CHECK en la base. */
  strategy: text("strategy").notNull(),
  resultCount: integer("result_count").notNull(),
  /**
   * Columna **generada** en la base (`result_count = 0`): es LA métrica, y derivarla allí impide
   * que dos adaptadores la calculen distinto. Nunca se escribe desde la app.
   */
  emptyHanded: boolean("empty_handed")
    .notNull()
    .generatedAlwaysAs(sql`result_count = 0`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
