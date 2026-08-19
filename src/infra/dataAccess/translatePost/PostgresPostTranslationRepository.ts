import { and, eq, sql } from "drizzle-orm";
import type { PostTranslation } from "~/domain/entities/post/translations";
import { db } from "~/infra/dataAccess/db/connection";
import { postTranslations } from "~/infra/dataAccess/db/schema/posts";
import type IPostTranslationRepository from "~/use_cases/translatePost/ports/IPostTranslationRepository";
import type { PostTranslationRow } from "~/use_cases/translatePost/ports/IPostTranslationRepository";

export default class PostgresPostTranslationRepository
  implements IPostTranslationRepository
{
  async findTranslation(
    postId: string,
    locale: string,
  ): Promise<PostTranslation | null> {
    const rows = await db
      .select({
        locale: postTranslations.locale,
        title: postTranslations.title,
        slug: postTranslations.slug,
        content: postTranslations.content,
      })
      .from(postTranslations)
      .where(
        and(
          eq(postTranslations.postId, postId),
          eq(postTranslations.locale, locale),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async hasTranslation(postId: string, locale: string): Promise<boolean> {
    const rows = await db
      .select({ id: postTranslations.id })
      .from(postTranslations)
      .where(
        and(
          eq(postTranslations.postId, postId),
          eq(postTranslations.locale, locale),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }

  /**
   * `post_translations` no tiene índice único sobre `slug` —ver la nota en `docs/features/content/002-2026-08-01-i18n.md`—
   * así que la colisión se resuelve contando, igual que hace `PostgresPostRepository` al publicar.
   */
  async createUniqueSlug(slug: string): Promise<string> {
    const base = slug || "post";
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(postTranslations)
      .where(eq(postTranslations.slug, base));

    const count = Number(rows[0]?.count ?? 0);

    return count > 0 ? `${base}-${count}` : base;
  }

  /**
   * Inserta solo si no hay ya una fila de ese post en ese idioma.
   *
   * El `WHERE NOT EXISTS` va **dentro del INSERT** y no como una comprobación previa a propósito:
   * la base no tiene `UNIQUE(post_id, locale)`, así que un `SELECT` seguido de un `INSERT` deja una
   * ventana en la que dos corridas del backfill —o un backfill y una publicación— duplican la fila.
   * Aquí la comprobación y la escritura son la misma sentencia.
   */
  async saveTranslation(row: PostTranslationRow): Promise<boolean> {
    const inserted = await db.execute(sql`
      insert into post_translations (post_id, locale, title, slug, content)
      select ${row.postId}, ${row.locale}, ${row.title}, ${row.slug}, ${row.content}
      where not exists (
        select 1 from post_translations
        where post_id = ${row.postId} and locale = ${row.locale}
      )
      returning id
    `);

    return (inserted.rows?.length ?? 0) > 0;
  }

  async findPostsMissingLocale(
    sourceLocale: string,
    targetLocale: string,
    limit: number,
  ): Promise<PostTranslationRow[]> {
    const target = sql`(
      select 1 from post_translations t
      where t.post_id = ${postTranslations.postId} and t.locale = ${targetLocale}
    )`;

    return db
      .select({
        postId: postTranslations.postId,
        locale: postTranslations.locale,
        title: postTranslations.title,
        slug: postTranslations.slug,
        content: postTranslations.content,
      })
      .from(postTranslations)
      .where(
        and(
          eq(postTranslations.locale, sourceLocale),
          sql`not exists ${target}`,
        ),
      )
      .limit(limit);
  }
}
