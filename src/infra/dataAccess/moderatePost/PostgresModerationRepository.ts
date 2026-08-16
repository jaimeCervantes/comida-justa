import { sql } from "drizzle-orm";
import {
  resolveModerationReason,
  resolveModerationStatus,
} from "~/domain/entities/post/moderation";
import { db } from "~/infra/dataAccess/db/connection";
import type IModerationRepository from "~/use_cases/moderatePost/ports/IModerationRepository";
import type {
  ModeratedPost,
  ModerationUpdate,
} from "~/use_cases/moderatePost/ports/IModerationRepository";

interface ModerationRow {
  id: string;
  slug: string | null;
  title: string | null;
  kind: string | null;
  moderation_status: string | null;
  moderation_reason: string | null;
  author_name: string | null;
  created_at: Date;
  moderation_reviewed_at: Date | null;
}

/**
 * El título y el slug salen de `post_translations` en **español**, que es el idioma en el que se
 * escribe toda publicación (`PUBLISH_LOCALE`). El panel es una herramienta interna: enseñar la
 * versión original es más útil que traducirla, porque es la que se juzgó.
 */
const PANEL_COLUMNS = sql`
  p.id,
  t.slug,
  t.title,
  p.kind,
  p.moderation_status,
  p.moderation_reason,
  u.name AS author_name,
  p.created_at,
  p.moderation_reviewed_at`;

const PANEL_JOINS = sql`
  FROM posts p
  LEFT JOIN LATERAL (
    SELECT title, slug
    FROM post_translations
    WHERE post_id = p.id
    ORDER BY (locale = 'es') DESC
    LIMIT 1
  ) t ON TRUE
  LEFT JOIN users u ON u.id = p.user_id`;

function toModeratedPost(row: ModerationRow): ModeratedPost {
  return {
    id: row.id,
    slug: row.slug ?? "",
    title: row.title ?? "",
    kind: row.kind ?? "anuncio",
    status: resolveModerationStatus(row.moderation_status),
    reason: resolveModerationReason(row.moderation_reason),
    authorName: row.author_name,
    createdAt: new Date(row.created_at),
    reviewedAt: row.moderation_reviewed_at
      ? new Date(row.moderation_reviewed_at)
      : null,
  };
}

export class PostgresModerationRepository implements IModerationRepository {
  /**
   * La bandeja: todo lo que no está publicado.
   *
   * Ordena por `moderation_reviewed_at` y no por `created_at` porque lo que interesa es **cuándo
   * entró a la bandeja**, no cuándo se publicó. En cuanto existan las denuncias, una publicación de
   * hace un mes puede entrar hoy, y ordenarla por su fecha de creación la mandaría al final.
   */
  async findPendingReview(): Promise<ModeratedPost[]> {
    const raw = await db.execute(sql`
      SELECT ${PANEL_COLUMNS}
      ${PANEL_JOINS}
      WHERE p.moderation_status <> 'published'
      ORDER BY p.moderation_reviewed_at DESC NULLS LAST, p.created_at DESC
    `);

    return (raw.rows as unknown as ModerationRow[]).map(toModeratedPost);
  }

  async findById(postId: string): Promise<ModeratedPost | null> {
    const raw = await db.execute(sql`
      SELECT ${PANEL_COLUMNS}
      ${PANEL_JOINS}
      WHERE p.id = ${postId}
      LIMIT 1
    `);

    const row = (raw.rows as unknown as ModerationRow[])[0];

    return row ? toModeratedPost(row) : null;
  }

  /**
   * Escribe la decisión, y de paso el interruptor del chatbot cuando toca.
   *
   * `leave` no escribe `is_available`: en un anuncio esa columna no significa nada, y ponerle un
   * valor sería inventarse un dato. Va todo en un solo `UPDATE` para que no exista un instante en
   * el que la publicación esté bajada pero el bot la siga ofreciendo.
   */
  async applyDecision(update: ModerationUpdate): Promise<void> {
    const availability =
      update.chatbot === "leave"
        ? sql``
        : sql`, is_available = ${update.chatbot === "restore"}`;

    await db.execute(sql`
      UPDATE posts
      SET moderation_status = ${update.status},
          moderation_reason = ${update.reason},
          moderation_reviewed_at = now()
          ${availability}
      WHERE id = ${update.postId}
    `);
  }
}
