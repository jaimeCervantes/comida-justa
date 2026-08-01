import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Borra una tienda de prueba y lo que colgaba de ella.
 *
 * Las publicaciones y las sucursales van primero: ambas tienen un FK a `sellers`, así que borrar la
 * tienda con algo colgando falla. Se barren por `seller_id` y no por el prefijo del slug porque lo
 * publicado desde la UI lleva el título que le dio el escenario, y basta con que la tienda sea de
 * prueba para que su catálogo y sus sucursales también lo sean.
 */
export async function deleteTestSellerByHandle(handle: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM posts
    WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${handle})
  `);

  await db.execute(sql`
    DELETE FROM branches
    WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${handle})
  `);

  await db.execute(sql`DELETE FROM sellers WHERE slug = ${handle}`);
}
