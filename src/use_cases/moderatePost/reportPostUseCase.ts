import {
  canBeReportedBy,
  type ModerationReason,
} from "~/domain/entities/post/moderation";
import type IModerationRepository from "./ports/IModerationRepository";

export interface ReportPostInput {
  postId: string;
  reporterId: string;
  reason: ModerationReason;
}

export type ReportPostResult =
  | { reported: true; alreadyReported: boolean }
  | { reported: false; refusal: "not-allowed" | "not-found" };

/**
 * Registra que alguien de la comunidad avisó de una publicación.
 *
 * **No cambia el estado de la publicación**, y eso es la decisión entera de este slice: mandarla a
 * `in_review` convertiría el botón en un arma con la que cualquiera podría vaciar el catálogo. Lo
 * que cambia es que aparece en el panel con su cuenta, y decide una persona.
 *
 * Denunciar dos veces **no es un error**: la base lo impide con `UNIQUE(post_id, user_id)` y aquí
 * se contesta `alreadyReported`. Es información, no un fallo — quien vuelve a pulsar quiere saber
 * que su aviso ya está, no leer que algo salió mal.
 */
export default class ReportPostUseCase {
  constructor(private readonly repository: IModerationRepository) {}

  async execute({
    postId,
    reporterId,
    reason,
  }: ReportPostInput): Promise<ReportPostResult> {
    const post = await this.repository.findById(postId);

    if (!post) return { reported: false, refusal: "not-found" };

    /* El mismo gate que decide si el botón se pinta, comprobado otra vez aquí: la Server Action se
       puede invocar sin pasar por la pantalla. */
    if (
      !canBeReportedBy(
        { userId: post.authorId, moderationStatus: post.status },
        { id: reporterId },
      )
    ) {
      return { reported: false, refusal: "not-allowed" };
    }

    const created = await this.repository.saveReport({
      postId,
      reporterId,
      reason,
    });

    return { reported: true, alreadyReported: !created };
  }
}
