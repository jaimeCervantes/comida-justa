import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

export async function deleteCommentsByPostSlug(postSlug: string) {
  await db.execute(sql`
    DELETE FROM comments
    WHERE post_id = (
      SELECT post_id FROM post_translations WHERE slug = ${postSlug} LIMIT 1
    )
  `);
}
