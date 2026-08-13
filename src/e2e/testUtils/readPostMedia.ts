import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export interface StoredMediaFile {
  sortOrder: number;
  type: string;
  url: string;
}

/**
 * What actually landed in `post_media`, in `sort_order`.
 *
 * The assertion goes to the database and not only to the page because the order **is** the feature:
 * `sort_order` 0 is the cover that the listing card, the cart and the WhatsApp bot all read with
 * `ORDER BY sort_order LIMIT 1`. A gallery that looks right while the rows are shuffled would still
 * show the wrong cover everywhere else.
 *
 * It lives here and not inside a spec because two of them ask the same question from opposite ends:
 * `multimediaMultiple.spec.ts` checks what publishing wrote, `editarMedia.spec.ts` what editing
 * rewrote. The second one is the reason the query cannot stay private to the first.
 */
export async function readPostMediaBySlug(
  slug: string,
): Promise<StoredMediaFile[]> {
  const result = await db.execute(sql`
    SELECT m.sort_order, m.type, m.url
    FROM post_media m
    JOIN post_translations t ON t.post_id = m.post_id
    WHERE t.slug = ${slug}
    ORDER BY m.sort_order
  `);

  return (
    result.rows as unknown as Array<{
      sort_order: number;
      type: string;
      url: string;
    }>
  ).map((row) => ({
    sortOrder: Number(row.sort_order),
    type: row.type,
    url: row.url,
  }));
}

/**
 * The file name a stored URL points at (`.../seed-2.jpg?alt=media` → `seed-2.jpg`).
 *
 * Reordering can only be asserted if the files are told apart, and the name is the one part of a
 * seeded URL that says which file this is. Comparing whole URLs would work too, but the failure
 * message would be three lines of Cloud Storage noise where one word is all that differs.
 */
export function mediaFileName(url: string): string {
  return url.split("/").pop()?.split("?")[0] ?? "";
}
