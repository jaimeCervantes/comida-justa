import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Cambia el precio de una publicación ya sembrada, como lo haría su dueño al editarla.
 *
 * Existe para el escenario que promete que un precio nuevo llega solo al texto de difusión: lo
 * que se prueba es la lectura, no el formulario de edición, que ya tiene sus propias pruebas.
 */
export async function seedPrice(slug: string, price: number): Promise<void> {
  await db.execute(sql`
    UPDATE posts
    SET price = ${price}
    WHERE id = (
      SELECT post_id FROM post_translations WHERE slug = ${slug} LIMIT 1
    )
  `);
}
