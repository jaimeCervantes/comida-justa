import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import type IOrphanPostRepository from "~/use_cases/becomeSeller/ports/IOrphanPostRepository";

/**
 * Adopta lo que su dueño publicó antes de tener tienda.
 *
 * El `WHERE` lleva las dos condiciones a propósito: **suya** (`user_id`) y **suelta**
 * (`seller_id IS NULL`). La segunda es la que impide que abrir una tienda le robe publicaciones a
 * otra —no debería poder pasar, pero un `UPDATE` sobre publicaciones ajenas es de los errores que
 * no se pueden deshacer sin un respaldo—.
 */
export class PostgresOrphanPostRepository implements IOrphanPostRepository {
  async adoptOrphansOf(userId: string, sellerId: string): Promise<number> {
    const result = await db.execute(sql`
      UPDATE posts
      SET seller_id = ${sellerId}::uuid
      WHERE user_id = ${userId}
        AND seller_id IS NULL
    `);

    return result.rowCount ?? 0;
  }
}
