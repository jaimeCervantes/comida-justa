import { sql } from "drizzle-orm";
import type { PostKind } from "~/domain/entities/post/kind";
import { db } from "~/infra/dataAccess/db/connection";
import { PUBLISHED_POSTS } from "~/infra/dataAccess/db/publishedPosts";
import { sqlFold } from "~/infra/dataAccess/db/sqlFold";
import { containsAllWords } from "~/infra/dataAccess/db/titleWords";
import type IOutreachProductFinder from "~/use_cases/outreach/ports/IOutreachProductFinder";
import type { TitleLocales } from "~/use_cases/outreach/ports/IOutreachTextRepository";
import type { OutreachProductMatch } from "~/use_cases/outreach/searchOutreachProductsUseCase";

interface MatchRow {
  id: string;
  title: string;
  price: string | null;
  photo_url: string | null;
  total_count: number;
}

/**
 * Los productos cuyo título contiene todas las palabras, en cualquier orden y aunque sea a medias.
 *
 * El título que **casa** puede ser de cualquier idioma —quien teclea «masa madre» lo espera aunque
 * mire el panel en inglés—, y el que se **enseña** es el del idioma pedido. El orden sale del que
 * casó: primero los que empiezan con la primera palabra, luego los más cortos —los más parecidos a
 * lo escrito— y luego alfabético, con el `id` al final para que dos páginas nunca repitan ni
 * pierdan un renglón.
 */
export default class PostgresOutreachProductFinder
  implements IOutreachProductFinder
{
  async findByWords(
    words: readonly string[],
    page: number,
    pageSize: number,
    { locale, fallbackLocale }: TitleLocales,
    kinds: readonly PostKind[],
  ): Promise<{ matches: OutreachProductMatch[]; total: number }> {
    if (words.length === 0 || kinds.length === 0) {
      return { matches: [], total: 0 };
    }

    const offset = Math.max(0, (page - 1) * pageSize);
    const kindList = sql.join(
      kinds.map((kind) => sql`${kind}`),
      sql`, `,
    );

    const raw = await db.execute(sql`
      SELECT
        p.id,
        shown.title,
        p.price::text AS price,
        (
          SELECT pm.url FROM post_media pm
          WHERE pm.post_id = p.id AND pm.type = 'image'
          ORDER BY pm.sort_order
          LIMIT 1
        ) AS photo_url,
        COUNT(*) OVER()::int AS total_count
      FROM posts p
      JOIN LATERAL (
        SELECT ${sqlFold(sql`t.title`)} AS title
        FROM post_translations t
        WHERE t.post_id = p.id AND ${containsAllWords(sql`t.title`, words)}
        ORDER BY (t.locale = ${locale}) DESC, length(t.title)
        LIMIT 1
      ) matched ON TRUE
      JOIN LATERAL (
        SELECT t.title
        FROM post_translations t
        WHERE t.post_id = p.id
        ORDER BY (t.locale = ${locale}) DESC, (t.locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) shown ON TRUE
      WHERE p.kind IN (${kindList}) AND ${PUBLISHED_POSTS}
      ORDER BY
        (strpos(matched.title, ${words[0]}) = 1) DESC,
        length(matched.title),
        matched.title,
        p.id
      LIMIT ${pageSize} OFFSET ${offset}
    `);

    const rows = raw.rows as unknown as MatchRow[];

    return {
      matches: rows.map((row) => ({
        postId: row.id,
        title: row.title,
        price: row.price === null ? null : Number(row.price),
        photoUrl: row.photo_url,
      })),
      total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    };
  }
}
