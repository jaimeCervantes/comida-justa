import { sql } from "drizzle-orm";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { MappedStore } from "~/domain/entities/seller/map";
import { db } from "~/infra/dataAccess/db/connection";

interface NearbyStoreRow {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  meters: number;
  [key: string]: unknown;
}

/**
 * Las tiendas que se pueden situar en un mapa, de la más cercana a la más lejana.
 *
 * Tres condiciones, y cada una descarta algo que no se puede pintar: sin `slug` no hay a dónde
 * enlazar el pin, sin sucursal no hay dónde ponerlo, y sin nada publicado el pin manda a un
 * catálogo vacío. `DISTINCT ON` deja una fila por tienda —la de su sucursal más cercana— porque en
 * el mapa una tienda es un pin, no uno por local.
 *
 * No filtra por radio: el mapa se encuadra solo con lo que haya, y si todo queda lejos eso también
 * es una respuesta —la misma que da el listado en vez de una página en blanco—.
 */
export async function listStoresToMap(
  near: Coordinates,
  limit: number,
): Promise<MappedStore[]> {
  const raw = await db.execute(sql`
    SELECT DISTINCT ON (s.id)
      s.slug,
      s.name,
      ST_Y(b.location::geometry) AS latitude,
      ST_X(b.location::geometry) AS longitude,
      ST_Distance(
        b.location,
        ST_SetSRID(ST_MakePoint(${near.longitude}, ${near.latitude}), 4326)::geography
      ) AS meters
    FROM sellers s
    JOIN branches b ON b.seller_id = s.id
    WHERE s.slug IS NOT NULL
      AND EXISTS (SELECT 1 FROM posts p WHERE p.seller_id = s.id)
    ORDER BY s.id, meters ASC
  `);

  return (raw.rows as unknown as NearbyStoreRow[])
    .map((row) => ({
      handle: row.slug,
      name: row.name,
      coordinates: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
      meters: Number(row.meters),
    }))
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit);
}
