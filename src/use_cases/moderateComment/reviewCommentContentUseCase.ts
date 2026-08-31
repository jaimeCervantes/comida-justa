import type {
  ModerationReason,
  ModerationStatus,
} from "~/domain/entities/post/moderation";
import type IContentModerationService from "~/use_cases/common/ports/IContentModerationService";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";

export interface ReviewCommentContentInput {
  commentId: string;
  content: string;
}

export type ReviewCommentContentResult = {
  status: ModerationStatus;
  reason: ModerationReason | null;
  /** Por qué no se pudo juzgar, cuando quedó en revisión. */
  error?: unknown;
};

/**
 * Revisa un comentario ya guardado y le escribe su estado. Mismo diseño que
 * `ReviewPostContentUseCase`: corre **después** de responder a quien comentó, así que su trabajo
 * no es impedir nada, es bajar lo que no cumpla.
 *
 * Un comentario no tiene título; se manda vacío al clasificador, que ya sabe juzgar solo con
 * contenido (título y contenido "juntos" es la regla para una publicación, no un requisito del
 * puerto).
 *
 * **No lanza nunca.** Si el clasificador falla, el comentario queda `in_review` —visible solo para
 * su autor y el admin— y aparece en el panel.
 */
export default class ReviewCommentContentUseCase {
  constructor(
    private readonly moderationService: IContentModerationService,
    private readonly repository: ICommentModerationRepository,
  ) {}

  async execute({
    commentId,
    content,
  }: ReviewCommentContentInput): Promise<ReviewCommentContentResult> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      return {
        status: "in_review",
        reason: null,
        error: new Error(`No existe el comentario ${commentId}.`),
      };
    }

    let status: ModerationStatus;
    let reason: ModerationReason | null = null;
    let error: unknown;

    try {
      const verdict = await this.moderationService.review({
        title: "",
        content,
      });

      if (verdict.decision === "accepted") {
        status = "published";
      } else {
        status = "rejected";
        reason = verdict.reason;
      }
    } catch (providerError) {
      status = "in_review";
      error = providerError;
    }

    await this.repository.applyDecision({ commentId, status, reason });

    return { status, reason, error };
  }
}
