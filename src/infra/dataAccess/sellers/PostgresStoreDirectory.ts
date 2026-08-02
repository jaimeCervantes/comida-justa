import { sql } from "drizzle-orm";
import {
  type DirectoryKind,
  type DirectoryPage,
  onlyProducers,
} from "~/domain/entities/seller/directory";
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
 * El filtro de productores es un `EXISTS` sobre `posts`, no una columna del vendedor: quién produce
 * lo dice lo que publica. Así una tienda entra al directorio de productores el día que publica su
 * primer producto propio, sin que nadie tenga que marcarla a mano.
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
          WHERE p.seller_id = s.id AND p.origin = 'productor_local'
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
