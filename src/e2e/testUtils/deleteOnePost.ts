import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Delete a post by its slug from PostgreSQL.
 * Cascades to post_translations, post_media, and comments.
 * @param postSlug the slug of the post to delete
 * @returns true if a post was deleted, false otherwise
 */
export async function deleteOnePostBySlug(postSlug: string) {
  const result = await db.execute(sql`
    DELETE FROM posts
    WHERE id = (
      SELECT post_id FROM post_translations WHERE slug = ${postSlug} LIMIT 1
    )
    RETURNING id
  `);

  return (result.rows as unknown as Array<{ id: string }>).length > 0;
}
