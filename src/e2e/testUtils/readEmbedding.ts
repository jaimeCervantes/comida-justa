import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Estado de indexación de una traducción, leído sin pasar por la UI: el vector no se ve en
 * ninguna pantalla, así que la única forma de comprobarlo es preguntarle a la base.
 */
export type EmbeddingSnapshot = {
  postId: string;
  dimensions: number | null;
};

export async function readEmbeddingBySlug(
  slug: string,
): Promise<EmbeddingSnapshot | null> {
  const result = await db.execute(sql`
    SELECT
      t.post_id,
      CASE WHEN t.embedding IS NULL THEN NULL ELSE vector_dims(t.embedding) END AS dimensions
    FROM post_translations t
    WHERE t.slug = ${slug}
    LIMIT 1
  `);

  const rows = result.rows as unknown as Array<{
    post_id: string;
    dimensions: number | null;
  }>;

  if (rows.length === 0) return null;

  return {
    postId: rows[0].post_id,
    dimensions: rows[0].dimensions === null ? null : Number(rows[0].dimensions),
  };
}

/**
 * Le pregunta a la MISMA función SQL que consume el chatbot (`search_posts_semantic`, migración
 * 0025) si encuentra la publicación usando su propio vector como consulta. Es la prueba de que
 * lo publicado en el sitio ya es recomendable: no basta con que la columna tenga 768 números.
 */
export async function chatbotFindsPostBySlug(slug: string): Promise<boolean> {
  const result = await db.execute(sql`
    WITH self AS (
      SELECT post_id, embedding
      FROM post_translations
      WHERE slug = ${slug} AND embedding IS NOT NULL
      LIMIT 1
    )
    SELECT s.post_id
    FROM self self_row
    JOIN LATERAL search_posts_semantic(self_row.embedding, 'es', 'es', NULL, 50) s ON TRUE
    WHERE s.post_id = self_row.post_id
  `);

  return result.rows.length > 0;
}

/** Deja una traducción sin vector para reproducir "el proveedor estaba caído al publicar". */
export async function clearEmbeddingBySlug(slug: string): Promise<void> {
  await db.execute(sql`
    UPDATE post_translations SET embedding = NULL WHERE slug = ${slug}
  `);
}
