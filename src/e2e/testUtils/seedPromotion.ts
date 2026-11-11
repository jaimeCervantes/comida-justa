import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Pone una promoción vigente —sin fecha de fin— a una publicación ya sembrada.
 *
 * El filtro «En promoción» solo cuenta lo que tiene piezas registradas (`onSaleWhere`), así que
 * quien siembre una promoción tiene que sembrar también su existencia con `seedStock`.
 */
export async function seedPromotion(
  slug: string,
  salePrice: number,
): Promise<void> {
  await db.execute(sql`
    UPDATE posts
    SET sale_price = ${salePrice}, sale_ends_at = NULL
    WHERE id = (
      SELECT post_id FROM post_translations WHERE slug = ${slug} LIMIT 1
    )
  `);
}
