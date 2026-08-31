import {
  applyModerationDecision,
  type ModerationDecision,
  type ModerationStatus,
} from "~/domain/entities/post/moderation";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";
import type { ModeratedComment } from "./ports/ICommentModerationRepository";

export interface ModerateCommentInput {
  commentId: string;
  decision: ModerationDecision;
}

export type ModerateCommentResult =
  | { status: ModerationStatus; errorMessage?: undefined }
  | { status?: undefined; errorMessage: string };

/**
 * Aprueba o baja un comentario desde el panel. Mismo interruptor que `ModeratePostUseCase`, sin el
 * paso del chatbot: un comentario no tiene `is_available` que apagar.
 */
export default class ModerateCommentUseCase {
  constructor(private readonly repository: ICommentModerationRepository) {}

  async execute({
    commentId,
    decision,
  }: ModerateCommentInput): Promise<ModerateCommentResult> {
    const comment = await this.repository.findById(commentId);

    if (!comment) {
      return { errorMessage: `No existe el comentario ${commentId}.` };
    }

    const moderation = applyModerationDecision(decision);

    await this.repository.applyDecision({
      commentId,
      status: moderation.status,
      reason: moderation.reason,
    });

    return { status: moderation.status };
  }

  /** La bandeja del panel: todo lo que espera decisión. */
  async pendingReview(): Promise<ModeratedComment[]> {
    return this.repository.findPendingReview();
  }
}
