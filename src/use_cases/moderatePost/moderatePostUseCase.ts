import { PostNotFoundError } from "~/domain/entities/post/errors";
import {
  applyModerationDecision,
  chatbotVisibilityFor,
  type ModerationDecision,
  type ModerationStatus,
} from "~/domain/entities/post/moderation";
import type IModerationRepository from "./ports/IModerationRepository";
import type { ModeratedPost } from "./ports/IModerationRepository";

export interface ModeratePostInput {
  postId: string;
  decision: ModerationDecision;
}

export type ModeratePostResult =
  | { status: ModerationStatus; errorMessage?: undefined }
  | { status?: undefined; errorMessage: string };

/**
 * Aprueba o baja una publicación desde el panel.
 *
 * Es el interruptor que hasta ahora no existía: quitar algo de la vista significaba entrar a la
 * base a mano. El caso de uso no sabe quién es admin —eso lo resuelve `src/app/` con `isAdmin`,
 * que lee una variable de entorno y no un rol de la base— y aquí solo vive la regla de qué queda
 * guardado tras cada decisión.
 */
export default class ModeratePostUseCase {
  constructor(private readonly repository: IModerationRepository) {}

  async execute({
    postId,
    decision,
  }: ModeratePostInput): Promise<ModeratePostResult> {
    const post = await this.repository.findById(postId);

    if (!post) {
      return { errorMessage: new PostNotFoundError().message };
    }

    const moderation = applyModerationDecision(decision);

    await this.repository.applyDecision({
      postId,
      status: moderation.status,
      reason: moderation.reason,
      /* Se calcula con el estado NUEVO, no con el que traía: aprobar un producto tiene que volver
         a encenderle `is_available`, o el bot seguiría sin ofrecerlo después de restituirlo y
         nadie entendería por qué. */
      chatbot: chatbotVisibilityFor({
        kind: post.kind,
        moderationStatus: moderation.status,
      }),
    });

    return { status: moderation.status };
  }

  /** La bandeja del panel: todo lo que espera decisión. */
  async pendingReview(): Promise<ModeratedPost[]> {
    return this.repository.findPendingReview();
  }
}
