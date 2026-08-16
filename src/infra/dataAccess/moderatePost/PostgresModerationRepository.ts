import { sql } from "drizzle-orm";
import {
  type PostReport,
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
  author_id: string;
  author_name: string | null;
  created_at: Date;
  moderation_reviewed_at: Date | null;
  report_count: number;
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
  p.user_id AS author_id,
  u.name AS author_name,
  p.created_at,
  p.moderation_reviewed_at,
  (SELECT COUNT(*)::int FROM post_reports r WHERE r.post_id = p.id) AS report_count`;

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
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: new Date(row.created_at),
    reviewedAt: row.moderation_reviewed_at
      ? new Date(row.moderation_reviewed_at)
      : null,
    reportCount: Number(row.report_count ?? 0),
  };
}

export class PostgresModerationRepository implements IModerationRepository {
  /**
   * La bandeja: lo que no está publicado **y** lo publicado que alguien denunció.
   *
   * Las dos cosas piden lo mismo —que una persona decida— así que van en la misma lista. Lo
   * denunciado no está oculto: sigue en el sitio mientras espera, que es la decisión entera del
   * slice 3.
   *
   * Ordena primero por número de denuncias: cinco personas avisando de lo mismo es la señal más
   * fuerte que produce este sistema, y enterrarla bajo lo que el clasificador dejó pendiente sería
   * desperdiciarla. Después, por cuándo entró a la bandeja —no por cuándo se publicó, porque una
   * publicación de hace un mes puede ser denunciada hoy y su fecha de creación la mandaría al final.
   */
  async findPendingReview(): Promise<ModeratedPost[]> {
    const raw = await db.execute(sql`
      SELECT ${PANEL_COLUMNS}
      ${PANEL_JOINS}
      WHERE p.moderation_status <> 'published'
         OR EXISTS (SELECT 1 FROM post_reports r WHERE r.post_id = p.id)
      ORDER BY report_count DESC,
               p.moderation_reviewed_at DESC NULLS LAST,
               p.created_at DESC
    `);

    return (raw.rows as unknown as ModerationRow[]).map(toModeratedPost);
  }

  /**
   * Guarda la denuncia, o dice que ya estaba.
   *
   * `ON CONFLICT DO NOTHING` contra el `UNIQUE(post_id, user_id)`: dejar que la base resuelva la
   * duplicación evita la carrera de comprobar-y-luego-insertar, en la que dos pulsaciones
   * simultáneas de la misma persona pasan las dos la comprobación. `rowCount` distingue los casos.
   */
  async saveReport(report: PostReport): Promise<boolean> {
    const result = await db.execute(sql`
      INSERT INTO post_reports (post_id, user_id, reason)
      VALUES (${report.postId}, ${report.reporterId}, ${report.reason})
      ON CONFLICT ON CONSTRAINT post_reports_one_per_person DO NOTHING
    `);

    return (result.rowCount ?? 0) > 0;
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

    /* Decidir cierra las denuncias abiertas, y por eso se borran.
       Sin esto, una publicación denunciada por error se quedaría en la bandeja para siempre: el
       admin la aprobaría, seguiría teniendo su denuncia, y volvería a aparecer en la lista al
       recargar. Aprobar significa "esto está bien", que es exactamente la respuesta al aviso.
       Al rechazar salen igual, porque a partir de ahí quien la sostiene en la bandeja es su estado. */
    await db.execute(
      sql`DELETE FROM post_reports WHERE post_id = ${update.postId}`,
    );
  }
}
