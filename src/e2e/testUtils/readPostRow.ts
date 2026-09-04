import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export type PostRowSnapshot = {
  id: string;
  kind: string | null;
  price: string | null;
  origin: string | null;
  is_available: boolean;
  stock_quantity: number | null;
  category: string | null;
  sub_category: string | null;
  seller_id: string | null;
  external_url: string | null;
  starts_at: Date | null;
  ends_at: Date | null;
  duration_minutes: number | null;
  contact_phone: string | null;
  moderation_status: string | null;
  moderation_reason: string | null;
};

/**
 * Lee el estado guardado de una publicación para verificarlo campo por campo, sin pasar por la
 * UI. Lo usa la corrida de escritorio del `.feature` (tabla campo/valor).
 */
export async function readPostRowBySlug(
  slug: string,
): Promise<PostRowSnapshot | null> {
  const result = await db.execute(sql`
    SELECT p.id, p.kind, p.price::text, p.origin, p.is_available, p.stock_quantity, p.category, p.sub_category, p.seller_id,
           p.external_url, p.starts_at, p.ends_at, p.duration_minutes,
           p.contact_phone, p.moderation_status, p.moderation_reason
    FROM posts p
    JOIN post_translations pt ON pt.post_id = p.id
    WHERE pt.slug = ${slug}
    LIMIT 1
  `);

  const rows = result.rows as unknown as PostRowSnapshot[];

  return rows[0] ?? null;
}
