import { sql } from "drizzle-orm";
import {
  resolveCategory,
  resolveSubCategory,
} from "~/domain/entities/post/category";
import type { PostEmbeddingSource } from "~/domain/entities/post/embedding";
import { db } from "~/infra/dataAccess/db/connection";
import {
  categoryLabel,
  subCategoryLabel,
} from "~/infra/UI/labels/postCategoryLabels";
import type IPostEmbeddingRepository from "~/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository";
import type { TranslationRef } from "~/use_cases/indexPostEmbedding/ports/IPostEmbeddingRepository";

type SourceRow = {
  title: string | null;
  content: string | null;
  category: string | null;
  sub_category: string | null;
  tags: unknown;
  price: string | null;
};

/**
 * Resuelve la clave guardada a la etiqueta que leyó el modelo cuando indexó el catálogo del
 * chatbot ("alimentacion" → "Alimentación"). Si la clave quedó fuera de la allowlist se manda
 * tal cual: es mejor una palabra rara en el texto que perder la señal de categoría.
 */
function labelFor(
  key: string | null,
  resolve: (raw: string | null) => string | null,
): string | null {
  if (!key) return null;
  const resolved = resolve(key);
  return resolved ?? key;
}

export default class PostgresPostEmbeddingRepository
  implements IPostEmbeddingRepository
{
  async findEmbeddingSource(
    ref: TranslationRef,
  ): Promise<PostEmbeddingSource | null> {
    const raw = await db.execute(sql`
      SELECT t.title, t.content, t.tags, p.category, p.sub_category, p.price::text
      FROM post_translations t
      JOIN posts p ON p.id = t.post_id
      WHERE t.post_id = ${ref.postId} AND t.locale = ${ref.locale}
      LIMIT 1
    `);

    const row = raw.rows[0] as SourceRow | undefined;

    if (!row) return null;

    return {
      title: row.title ?? "",
      content: row.content,
      category: labelFor(row.category, (key) =>
        categoryLabel(resolveCategory(key), "es"),
      ),
      subCategory: labelFor(row.sub_category, (key) =>
        subCategoryLabel(resolveSubCategory(key), "es"),
      ),
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
