import { sql } from "drizzle-orm";
import { SELLABLE_KINDS } from "~/domain/entities/post/kind";
import { db } from "~/infra/dataAccess/db/connection";
import { PUBLISHED_POSTS } from "~/infra/dataAccess/db/publishedPosts";
import type IOutreachProductCatalog from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import type { OutreachProductOption } from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import type { TitleLocales } from "~/use_cases/outreach/ports/IOutreachTextRepository";

interface OptionRow {
  id: string;
  title: string;
  price: string | null;
}

/**
 * Lo que se puede ligar a un texto: lo publicado que se vende, esté disponible hoy o no.
 *
 * Por título y no por fecha: el formulario lo recorre buscando un pan concreto, y en orden
 * alfabético «Pan de masa madre…» quedan juntos.
 */
export default class PostgresOutreachProductCatalog
  implements IOutreachProductCatalog
{
  async listProducts({
    locale,
    fallbackLocale,
  }: TitleLocales): Promise<OutreachProductOption[]> {
    const kinds = sql.join(
      SELLABLE_KINDS.map((kind) => sql`${kind}`),
      sql`, `,
    );

    const raw = await db.execute(sql`
      SELECT p.id, t.title, p.price::text AS price
      FROM posts p
      JOIN LATERAL (
        SELECT title
        FROM post_translations
        WHERE post_id = p.id
        ORDER BY (locale = ${locale}) DESC, (locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE p.kind IN (${kinds})
        AND ${PUBLISHED_POSTS}
      ORDER BY t.title ASC, p.id ASC
    `);

    return (raw.rows as unknown as OptionRow[]).map((row) => ({
      postId: row.id,
      title: row.title,
      price: row.price === null ? null : Number(row.price),
    }));
  }
}
