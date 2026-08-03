import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * A qué distancia está la tienda que publicó esto, en **metros**.
 *
 * `MIN` porque una tienda puede tener varias sucursales y lo que le importa a quien compra es la
 * más cercana, no el domicilio fiscal. `null` cuando la publicación no cuelga de ninguna tienda o
 * cuando su tienda todavía no dio ubicación: no se inventa una distancia para rellenar el hueco.
 *
 * `ST_Distance` sobre `geography` devuelve metros sin conversiones, que es justo por lo que
 * `branches.location` se guardó así.
 */
export async function distanceToSellerMeters(
  slug: string,
  visitor: Coordinates,
): Promise<number | null> {
  const result = await db.execute(sql`
    SELECT MIN(
      ST_Distance(
        b.location,
        ST_SetSRID(
          ST_MakePoint(${visitor.longitude}, ${visitor.latitude}),
          4326
        )::geography
      )
    ) AS meters
    FROM post_translations t
    JOIN posts p ON p.id = t.post_id
    JOIN branches b ON b.seller_id = p.seller_id
    WHERE t.slug = ${slug}
  `);

  const meters = (result.rows[0] as { meters: string | null } | undefined)
    ?.meters;

  return meters === null || meters === undefined ? null : Number(meters);
}
