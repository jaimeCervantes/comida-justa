import { sql } from "drizzle-orm";
import {
  type DirectoryKind,
  type DirectoryPage,
  onlyProducers,
} from "~/domain/entities/seller/directory";
import {
  COMMUNITY_ANCHOR,
  SUSTAINABLE_RADIUS_METERS,
} from "~/domain/entities/seller/proximity";
import { db } from "~/infra/dataAccess/db/connection";

interface StoreRow {
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  publication_count: number;
  total_count: number;
}

/**
 * El directorio de tiendas, paginado.
 *
 * **Solo las que tienen `slug`**: sin dirección pública no hay a dónde enlazar, y las tiendas que
 * creó el chatbot nacieron sin ella.
 *
 * El filtro de productores tiene dos mitades que viven en sitios distintos a propósito:
 *
 * 1. **Quién produce** lo dice lo que publica (`EXISTS` sobre `posts`), no una columna del vendedor.
 *    Así una tienda entra el día que publica su primer producto propio, sin que nadie la marque.
 * 2. **Si eso es local** lo dice la distancia, no la declaración: su sucursal tiene que caer dentro
 *    del radio sostenible del ancla de la comunidad. `branches.location` es `geography`, así que
 *    `ST_DWithin` recibe metros y usa el índice espacial en vez de calcular fila por fila.
 *
 * Consecuencia buscada: una tienda **sin sucursal** no aparece aquí aunque publique como productor.
 * Sin ubicación no hay distancia que verificar, y esa es justo la razón para completar la tienda.
 */
export async function listStores(
  kind: DirectoryKind,
  page: number,
  pageSize: number,
): Promise<DirectoryPage> {
  const offset = (page - 1) * pageSize;
  const producerFilter = onlyProducers(kind)
    ? sql`AND EXISTS (
          SELECT 1 FROM posts p
          WHERE p.seller_id = s.id AND p.origin = 'productor'
        )
        AND EXISTS (
          SELECT 1 FROM branches b
          WHERE b.seller_id = s.id
            AND ST_DWithin(
              b.location,
              ST_SetSRID(
                ST_MakePoint(
                  ${COMMUNITY_ANCHOR.longitude},
                  ${COMMUNITY_ANCHOR.latitude}
                ),
                4326
              )::geography,
              ${SUSTAINABLE_RADIUS_METERS}
            )
        )`
    : sql``;

  const raw = await db.execute(sql`
    SELECT
      s.slug,
      s.name,
      s.description,
      s.logo_url,
      (SELECT COUNT(*) FROM posts p WHERE p.seller_id = s.id)::int AS publication_count,
      COUNT(*) OVER()::int AS total_count
    FROM sellers s
    WHERE s.slug IS NOT NULL
    ${producerFilter}
    ORDER BY s.name
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const rows = raw.rows as unknown as StoreRow[];
  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

  return {
    stores: rows.map((row) => ({
      handle: row.slug,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url,
      publicationCount: Number(row.publication_count),
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
