import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export type BranchSnapshot = {
  name: string;
  address: string;
  mapUrl: string;
  latitude: number;
  longitude: number;
};

/**
 * Las sucursales de una tienda leídas de la base: `location` es un punto de PostGIS que no se ve
 * en ninguna pantalla, así que comprobar que las coordenadas quedaron bien solo se puede aquí.
 */
export async function readBranchesByHandle(
  handle: string,
): Promise<BranchSnapshot[]> {
  const result = await db.execute(sql`
    SELECT
      b.name,
      b.address,
      b.map_url,
      ST_Y(b.location::geometry) AS latitude,
      ST_X(b.location::geometry) AS longitude
    FROM branches b
    JOIN sellers s ON s.id = b.seller_id
    WHERE s.slug = ${handle}
    ORDER BY b.name
  `);

  return (
    result.rows as unknown as Array<{
      name: string;
      address: string;
      map_url: string;
      latitude: number;
      longitude: number;
    }>
  ).map((row) => ({
    name: row.name,
    address: row.address,
    mapUrl: row.map_url,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }));
}

/**
 * Le pregunta a la MISMA función SQL del chatbot (`search_posts_semantic`, migración 0025) qué
 * recomendaría a un cliente parado en esas coordenadas, usando como consulta el vector de un
 * producto que ya está indexado.
 *
 * Es la única forma honesta de comprobar el radio: el filtro geográfico vive en SQL
 * (`ST_DWithin` sobre `branches.location`), no en código TypeScript que se pueda probar aparte.
 */
export async function chatbotFindsNearby(
  slug: string,
  latitude: number,
  longitude: number,
  radiusMeters: number,
): Promise<boolean> {
  const result = await db.execute(sql`
    WITH self AS (
      SELECT post_id, embedding
      FROM post_translations
      WHERE slug = ${slug} AND embedding IS NOT NULL
      LIMIT 1
    )
    SELECT s.post_id
    FROM self self_row
    JOIN LATERAL search_posts_semantic(
      self_row.embedding, 'es', 'es', NULL, 50,
      ${latitude}::double precision,
      ${longitude}::double precision,
      ${radiusMeters}::int
    ) s ON TRUE
    WHERE s.post_id = self_row.post_id
  `);

  return result.rows.length > 0;
}
