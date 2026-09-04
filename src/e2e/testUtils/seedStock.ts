import { sql } from "drizzle-orm";
import { availabilityForStock } from "~/domain/entities/post/stock";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Pone una publicación ya sembrada a llevar inventario, con el número que pida el escenario.
 *
 * Existe para que un `Given` sea un `Given`. Antes el estado de partida ("un producto con 3
 * existencias") se montaba guardando por la interfaz y luego el escenario guardaba otra vez, y esas
 * dos escrituras compiten: la primera revalida la ruta y React reinicia el formulario en mitad de
 * la segunda, así que la prueba fallaba por una carrera propia y no por el comportamiento.
 *
 * Escribe las **dos** columnas juntas, igual que el repositorio, con la misma función del dominio:
 * un estado de partida en el que `stock_quantity` y `is_available` no concuerdan no existe en
 * producción y no debe existir aquí.
 */
export async function seedStock(slug: string, quantity: number): Promise<void> {
  await db.execute(sql`
    UPDATE posts
    SET stock_quantity = ${quantity},
        is_available   = ${availabilityForStock(quantity)}
    WHERE id = (
      SELECT post_id FROM post_translations WHERE slug = ${slug} LIMIT 1
    )
  `);
}
