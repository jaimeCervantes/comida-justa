import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export type PostRowSnapshot = {
  kind: string | null;
  is_available: boolean;
  category: string | null;
  sub_category: string | null;
  seller_id: string | null;
  external_url: string | null;
};

/**
 * Lee el estado guardado de una publicación para verificarlo campo por campo, sin pasar por la
 * UI. Lo usa la corrida de escritorio del `.feature` (tabla campo/valor).
 */
export async function readPostRowBySlug(
  slug: string,
): Promise<PostRowSnapshot | null> {
  const result = await db.execute(sql`
    SELECT p.kind, p.is_available, p.category, p.sub_category, p.seller_id, p.external_url
    FROM posts p
    JOIN post_translations pt ON pt.post_id = p.id
    WHERE pt.slug = ${slug}
    LIMIT 1
  `);

  const rows = result.rows as unknown as PostRowSnapshot[];

  return rows[0] ?? null;
}
