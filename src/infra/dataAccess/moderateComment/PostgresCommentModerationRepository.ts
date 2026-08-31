import { sql } from "drizzle-orm";
import {
  resolveModerationReason,
  resolveModerationStatus,
} from "~/domain/entities/post/moderation";
import { db } from "~/infra/dataAccess/db/connection";
import type ICommentModerationRepository from "~/use_cases/moderateComment/ports/ICommentModerationRepository";
import type {
  CommentModerationUpdate,
  CommentReport,
  ModeratedComment,
} from "~/use_cases/moderateComment/ports/ICommentModerationRepository";

interface ModerationRow {
  id: string;
  content: string;
  post_id: string;
  post_slug: string | null;
  post_title: string | null;
  moderation_status: string | null;
  moderation_reason: string | null;
  author_id: string;
  author_name: string | null;
  created_at: Date;
  moderation_reviewed_at: Date | null;
  report_count: number;
}

/**
 * El título y el slug del post salen de `post_translations` en **español**
 * (`PUBLISH_LOCALE`), igual que `PostgresModerationRepository`: el panel es una herramienta
 * interna y enlaza a la versión que se escribió, no a la traducida.
 */
const PANEL_COLUMNS = sql`
  c.id,
  c.content,
  c.post_id,
  t.slug AS post_slug,
  t.title AS post_title,
  c.moderation_status,
  c.moderation_reason,
  c.user_id AS author_id,
  u.name AS author_name,
  c.created_at,
  c.moderation_reviewed_at,
  (SELECT COUNT(*)::int FROM comment_reports r WHERE r.comment_id = c.id) AS report_count`;

const PANEL_JOINS = sql`
  FROM comments c
  LEFT JOIN LATERAL (
    SELECT title, slug
    FROM post_translations
    WHERE post_id = c.post_id
    ORDER BY (locale = 'es') DESC
    LIMIT 1
  ) t ON TRUE
  LEFT JOIN users u ON u.id = c.user_id`;

function toModeratedComment(row: ModerationRow): ModeratedComment {
  return {
    id: row.id,
    content: row.content,
    postId: row.post_id,
    postSlug: row.post_slug ?? "",
    postTitle: row.post_title ?? "",
    status: resolveModerationStatus(row.moderation_status),
    reason: resolveModerationReason(row.moderation_reason),
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: new Date(row.created_at),
    reviewedAt: row.moderation_reviewed_at
      ? new Date(row.moderation_reviewed_at)
      : null,
    reportCount: Number(row.report_count ?? 0),
  };
}

export class PostgresCommentModerationRepository
  implements ICommentModerationRepository
{
  /** La bandeja: lo que no está publicado **y** lo publicado que alguien denunció. */
  async findPendingReview(): Promise<ModeratedComment[]> {
    const raw = await db.execute(sql`
      SELECT ${PANEL_COLUMNS}
      ${PANEL_JOINS}
      WHERE c.moderation_status <> 'published'
         OR EXISTS (SELECT 1 FROM comment_reports r WHERE r.comment_id = c.id)
      ORDER BY report_count DESC,
               c.moderation_reviewed_at DESC NULLS LAST,
               c.created_at DESC
    `);

    return (raw.rows as unknown as ModerationRow[]).map(toModeratedComment);
  }

  async findById(commentId: string): Promise<ModeratedComment | null> {
    const raw = await db.execute(sql`
      SELECT ${PANEL_COLUMNS}
      ${PANEL_JOINS}
      WHERE c.id = ${commentId}
      LIMIT 1
    `);

    const row = (raw.rows as unknown as ModerationRow[])[0];

    return row ? toModeratedComment(row) : null;
  }

  /**
   * Guarda la denuncia, o dice que ya estaba. `ON CONFLICT DO NOTHING` contra el
   * `UNIQUE(comment_id, user_id)`: la base resuelve la duplicación en vez de comprobar-y-luego-
   * insertar, que pierde la carrera cuando la misma persona pulsa dos veces seguidas.
   */
  async saveReport(report: CommentReport): Promise<boolean> {
    const result = await db.execute(sql`
      INSERT INTO comment_reports (comment_id, user_id, reason)
      VALUES (${report.commentId}, ${report.reporterId}, ${report.reason})
      ON CONFLICT ON CONSTRAINT comment_reports_one_per_person DO NOTHING
    `);

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Escribe la decisión. Decidir cierra las denuncias abiertas, igual que en
   * `PostgresModerationRepository`: sin esto, un comentario denunciado por error se quedaría en la
   * bandeja para siempre.
   */
  async applyDecision(update: CommentModerationUpdate): Promise<void> {
    await db.execute(sql`
      UPDATE comments
      SET moderation_status = ${update.status},
          moderation_reason = ${update.reason},
          moderation_reviewed_at = now()
      WHERE id = ${update.commentId}
    `);

    await db.execute(
      sql`DELETE FROM comment_reports WHERE comment_id = ${update.commentId}`,
    );
  }
}
