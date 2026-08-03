import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { MappedStore } from "~/domain/entities/seller/map";
import { db } from "~/infra/dataAccess/db/connection";

interface PostStoreRow {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  meters: number | null;
  [key: string]: unknown;
}

/**
 * La tienda situada detrás de una publicación, con su distancia si se puede calcular.
 *
 * Contesta las dos preguntas del detalle con **una sola consulta**: a qué distancia queda —lo que
 * dice la insignia— y dónde está —lo que pinta el mapa—. Antes eran dos, y la segunda habría
 * repetido el mismo `JOIN` para traer el mismo punto.
 *
 * `ORDER BY meters` con `NULLS LAST` deja la sucursal más cercana a quien mira; sin visitante el
 * orden da igual y se toma la primera, porque para situar la tienda cualquiera de sus locales
 * sirve. `null` cuando la publicación no cuelga de ninguna tienda o su tienda no dio ubicación:
 * ahí no hay ni distancia ni mapa que enseñar.
 */
export async function storeOfPost(
  slug: string,
  visitor: Coordinates | null,
): Promise<MappedStore | null> {
  const meters = visitor
    ? sql`ST_Distance(
        b.location,
        ST_SetSRID(
          ST_MakePoint(${visitor.longitude}, ${visitor.latitude}),
          4326
        )::geography
      )`
    : sql`NULL::double precision`;

  const raw = await db.execute(sql`
    SELECT
      s.slug,
      s.name,
      ST_Y(b.location::geometry) AS latitude,
      ST_X(b.location::geometry) AS longitude,
      ${meters} AS meters
    FROM post_translations t
    JOIN posts p ON p.id = t.post_id
    JOIN sellers s ON s.id = p.seller_id
    JOIN branches b ON b.seller_id = s.id
    WHERE t.slug = ${slug}
    ORDER BY meters ASC NULLS LAST
    LIMIT 1
  `);

  const row = (raw.rows as unknown as PostStoreRow[])[0];

  if (!row) return null;

  return {
    handle: row.slug,
    name: row.name,
    coordinates: {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    },
    meters: row.meters === null ? null : Number(row.meters),
  };
}
