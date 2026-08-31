import type {
  ModerationReason,
  ModerationStatus,
} from "~/domain/entities/post/moderation";

/**
 * Un comentario esperando decisión, tal y como lo enseña el panel.
 *
 * Reusa el vocabulario de `~/domain/entities/post/moderation` (estados, motivos, la máquina de
 * decisión) en vez de duplicarlo: es el mismo clasificador, la misma lista cerrada de motivos y la
 * misma regla de "denunciar avisa, no oculta" que ya se construyó para publicaciones. Lo único que
 * cambia es la forma del dato.
 */
export interface ModeratedComment {
  id: string;
  content: string;
  postId: string;
  /** Para enlazar desde el panel a la ficha donde vive el comentario. */
  postSlug: string;
  postTitle: string;
  status: ModerationStatus;
  reason: ModerationReason | null;
  authorId: string;
  authorName: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  /** Cuántas **personas distintas** avisaron. Lo sostiene `UNIQUE(comment_id, user_id)`. */
  reportCount: number;
}

export interface CommentModerationUpdate {
  commentId: string;
  status: ModerationStatus;
  reason: ModerationReason | null;
}

export interface CommentReport {
  commentId: string;
  reporterId: string;
  reason: ModerationReason;
}

export default interface ICommentModerationRepository {
  /**
   * La bandeja del panel: lo que no está publicado **y** lo publicado que alguien denunció.
   */
  findPendingReview(): Promise<ModeratedComment[]>;
  findById(commentId: string): Promise<ModeratedComment | null>;
  applyDecision(update: CommentModerationUpdate): Promise<void>;
  /**
   * Guarda una denuncia. Devuelve `false` si esa persona ya había denunciado ese comentario —lo
   * impide el `UNIQUE`— y eso no es un error, es la respuesta.
   */
  saveReport(report: CommentReport): Promise<boolean>;
}
