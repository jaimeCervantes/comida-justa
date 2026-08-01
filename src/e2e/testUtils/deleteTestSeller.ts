import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Borra una tienda de prueba y lo que colgaba de ella.
 *
 * Las publicaciones van primero: `posts.seller_id` es un FK a `sellers`, así que borrar la tienda
 * con catálogo vivo falla. Se barren por `seller_id` y no por el prefijo del slug porque lo
 * publicado desde la UI lleva el título que le dio el escenario, y basta con que la tienda sea de
 * prueba para que su catálogo también lo sea.
 */
export async function deleteTestSellerByHandle(handle: string): Promise<void> {
  await db.execute(sql`
    DELETE FROM posts
    WHERE seller_id IN (SELECT id FROM sellers WHERE slug = ${handle})
  `);

  await db.execute(sql`DELETE FROM sellers WHERE slug = ${handle}`);
}
