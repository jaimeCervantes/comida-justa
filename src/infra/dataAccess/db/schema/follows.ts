import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { sellers } from "./sellers";

/**
 * Quién sigue a quién. Espejo de la tabla que administra Alembic (`0031`); aquí solo se lee y
 * se escribe, nunca se genera con `drizzle-kit`.
 *
 * **Una fila apunta a una tienda o a una persona, nunca a las dos ni a ninguna.** Lo garantiza el
 * `CHECK` de `num_nonnulls(seller_id, followed_id) = 1` en la base; el dominio lo dice antes con un
 * motivo entendible (`src/domain/follow/follow.ts`).
 *
 * Los dos únicos son **parciales**, y tienen que serlo: la columna del otro destino va nula, y en
 * Postgres dos nulos no chocan, así que un único sobre las tres columnas dejaría pasar repetidos.
 * Son los que convierten seguir en un `ON CONFLICT DO NOTHING` y hacen que un doble clic no cuente
 * dos veces.
 */
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sellerId: uuid("seller_id").references(() => sellers.id, {
      onDelete: "cascade",
    }),
    followedId: text("followed_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("uq_follows_follower_seller")
      .on(table.followerId, table.sellerId)
      .where(sql`${table.sellerId} IS NOT NULL`),
    uniqueIndex("uq_follows_follower_user")
      .on(table.followerId, table.followedId)
      .where(sql`${table.followedId} IS NOT NULL`),
    /* El contador se lee por el destino —"cuántos siguen a esta tienda"—, así que los únicos de
       arriba, que empiezan por quien sigue, no le sirven. */
    index("ix_follows_seller").on(table.sellerId),
    index("ix_follows_followed").on(table.followedId),
  ],
);
