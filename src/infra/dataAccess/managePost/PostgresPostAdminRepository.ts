import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import type IPostAdminRepository from "~/use_cases/managePost/ports/IPostAdminRepository";
import type {
  EditablePost,
  PostContentUpdate,
} from "~/use_cases/managePost/ports/IPostAdminRepository";

interface EditableRow {
  id: string;
  owner_id: string;
  slug: string;
  locale: string;
  title: string;
  content: string;
  price: string | null;
  kind: string | null;
  origin: string | null;
  category: string | null;
  sub_category: string | null;
  is_available: boolean;
  [key: string]: unknown;
}

/**
 * Lecturas y escrituras de administración de una publicación.
 *
 * Va aparte del repositorio de creación porque responde otra pregunta: no "cómo nace una
 * publicación" sino "qué puede cambiar su dueño". En particular trae el `user_id` como `ownerId`,
 * que es lo que el caso de uso necesita para autorizar.
 */
export class PostgresPostAdminRepository implements IPostAdminRepository {
  async findBySlug(slug: string): Promise<EditablePost | null> {
    return this.findOne(sql`t.slug = ${slug}`);
  }

  async findById(postId: string): Promise<EditablePost | null> {
    return this.findOne(sql`p.id = ${postId}`);
  }

  async setAvailability(postId: string, isAvailable: boolean): Promise<void> {
    await db.execute(sql`
      UPDATE posts SET is_available = ${isAvailable} WHERE id = ${postId}
    `);
  }

  /**
   * El `slug` queda fuera del `UPDATE` a propósito: la dirección ya se compartió y moverla
   * dejaría muertos los enlaces repartidos.
   */
  async updateContent(update: PostContentUpdate): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.execute(sql`
        UPDATE posts
        SET price        = ${update.price},
            origin       = ${update.origin},
            category     = ${update.category},
            sub_category = ${update.subCategory}
        WHERE id = ${update.postId}
      `);

      await tx.execute(sql`
        UPDATE post_translations
        SET title   = ${update.title},
            content = ${update.content}
        WHERE post_id = ${update.postId} AND locale = ${update.locale}
      `);
    });
  }

  private async findOne(
    where: ReturnType<typeof sql>,
  ): Promise<EditablePost | null> {
    const result = await db.execute(sql`
      SELECT
        p.id,
        p.user_id AS owner_id,
        t.slug,
        t.locale,
        t.title,
        t.content,
        p.price::text,
        p.kind,
        p.origin,
        p.category,
        p.sub_category,
        p.is_available
      FROM posts p
      JOIN post_translations t ON t.post_id = p.id
      WHERE ${where}
      LIMIT 1
    `);

    const rows = result.rows as unknown as EditableRow[];

    if (rows.length === 0) return null;

    const row = rows[0];

    return {
      id: row.id,
      ownerId: row.owner_id,
      slug: row.slug,
      locale: row.locale,
      title: row.title,
      content: row.content,
      price: row.price === null ? null : Number(row.price),
      kind: row.kind ?? "anuncio",
      origin: row.origin,
      category: row.category,
      subCategory: row.sub_category,
      isAvailable: row.is_available,
    };
  }
}
