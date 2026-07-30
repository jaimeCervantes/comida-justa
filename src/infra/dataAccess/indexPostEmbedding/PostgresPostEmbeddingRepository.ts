import { sql } from "drizzle-orm";
import type { PostEmbeddingSource } from "~/domain/entities/post/embedding";
import { db } from "~/infra/dataAccess/db/connection";
import type IPostEmbeddingRepository from "~/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository";
import type { TranslationRef } from "~/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository";

type SourceRow = {
  title: string | null;
  content: string | null;
  category_label: string | null;
  sub_category_label: string | null;
  tags: unknown;
  price: string | null;
};

export default class PostgresPostEmbeddingRepository
  implements IPostEmbeddingRepository
{
  /**
   * El vector vive **por traducción**, así que la categoría tiene que leerse en el idioma de esa
   * traducción: la fila `en` de un producto debe vectorizar "Bakery", no "Panadería". Antes el
   * idioma estaba fijo en `"es"`, lo que metía español en el texto de toda traducción.
   *
   * La etiqueta se resuelve en el propio SQL —no con la taxonomía cacheada— para no depender del
   * caché en un camino que corre también desde scripts, y sin una segunda ida a la base.
   *
   * `COALESCE` a tres niveles conserva la regla de siempre: sin traducción se usa la española, y
   * sin ninguna se manda la clave cruda. Es mejor una palabra rara en el texto que perder del todo
   * la señal de categoría.
   */
  async findEmbeddingSource(
    ref: TranslationRef,
  ): Promise<PostEmbeddingSource | null> {
    const raw = await db.execute(sql`
      SELECT t.title,
             t.content,
             t.tags,
             p.price::text,
             COALESCE(ct.label,  ct_es.label,  p.category)     AS category_label,
             COALESCE(cst.label, cst_es.label, p.sub_category) AS sub_category_label
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      LEFT JOIN category_translations ct
             ON ct.category_key = p.category AND ct.locale = t.locale
      LEFT JOIN category_translations ct_es
             ON ct_es.category_key = p.category AND ct_es.locale = 'es'
      LEFT JOIN category_translations cst
             ON cst.category_key = p.sub_category AND cst.locale = t.locale
      LEFT JOIN category_translations cst_es
             ON cst_es.category_key = p.sub_category AND cst_es.locale = 'es'
      WHERE t.post_id = ${ref.postId} AND t.locale = ${ref.locale}
      LIMIT 1
    `);

    const row = raw.rows[0] as SourceRow | undefined;

    if (!row) return null;

    return {
      title: row.title ?? "",
      content: row.content,
      category: row.category_label,
      subCategory: row.sub_category_label,
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      price: row.price === null ? null : Number(row.price),
    };
  }

  async saveEmbedding(ref: TranslationRef, embedding: number[]): Promise<void> {
    // pgvector acepta el literal `[a,b,c]`; se manda como parámetro, no interpolado.
    const literal = `[${embedding.join(",")}]`;

    await db.execute(sql`
      UPDATE post_translations
      SET embedding = ${literal}::vector
      WHERE post_id = ${ref.postId} AND locale = ${ref.locale}
    `);
  }

  async findPendingIndexing(limit: number): Promise<TranslationRef[]> {
    const raw = await db.execute(sql`
      SELECT t.post_id, t.locale
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      WHERE t.embedding IS NULL
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `);

    return (
      raw.rows as unknown as Array<{ post_id: string; locale: string }>
    ).map((row) => ({ postId: row.post_id, locale: row.locale }));
  }
}
