import {
  canBeReportedBy,
  type ModerationReason,
} from "~/domain/entities/post/moderation";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";

export interface ReportCommentInput {
  commentId: string;
  reporterId: string;
  reason: ModerationReason;
}

export type ReportCommentResult =
  | { reported: true; alreadyReported: boolean }
  | { reported: false; refusal: "not-allowed" | "not-found" };

/**
 * Registra que alguien de la comunidad avisó de un comentario.
 *
 * Mismo diseño que `ReportPostUseCase`: **no cambia el estado** del comentario, solo lo apunta en
 * la bandeja del panel con su cuenta. La razón es la misma —convertir el botón en un arma con la
 * que cualquiera podría vaciar un hilo denunciando comentario tras comentario.
 */
export default class ReportCommentUseCase {
  constructor(private readonly repository: ICommentModerationRepository) {}

  async execute({
    commentId,
    reporterId,
    reason,
  }: ReportCommentInput): Promise<ReportCommentResult> {
    const comment = await this.repository.findById(commentId);

    if (!comment) return { reported: false, refusal: "not-found" };

    /* El mismo gate que decide si el botón se pinta, comprobado otra vez aquí: la Server Action se
       puede invocar sin pasar por la pantalla. */
    if (
      !canBeReportedBy(
        {
          userId: comment.authorId,
          moderationStatus: comment.status,
          moderationReason: comment.reason,
        },
        { id: reporterId },
      )
    ) {
      return { reported: false, refusal: "not-allowed" };
    }

    const created = await this.repository.saveReport({
      commentId,
      reporterId,
      reason,
    });

    return { reported: true, alreadyReported: !created };
  }
}
