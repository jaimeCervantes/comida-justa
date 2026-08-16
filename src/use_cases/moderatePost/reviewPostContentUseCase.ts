import {
  chatbotVisibilityFor,
  type ModerationReason,
  type ModerationStatus,
} from "~/domain/entities/post/moderation";
import type IContentModerationService from "~/use_cases/common/ports/IContentModerationService";
import type IModerationRepository from "./ports/IModerationRepository";

export interface ReviewPostContentInput {
  postId: string;
  title: string;
  content: string;
}

export type ReviewPostContentResult = {
  status: ModerationStatus;
  reason: ModerationReason | null;
  /**
   * Si vale la pena gastar en indexar y traducir.
   *
   * Solo lo publicado: pagarle a Gemini por vectorizar y traducir algo que acaba de bajarse es
   * dinero tirado, y el vector además la dejaría encontrable por el chatbot.
   */
  worthIndexing: boolean;
  /** Por qué no se pudo juzgar, cuando quedó en revisión. */
  error?: unknown;
};

/**
 * Revisa una publicación ya guardada y le escribe su estado.
 *
 * Corre **después** de responderle a quien publicó, así que su trabajo no es impedir nada: es
 * bajar lo que no cumpla. La publicación estuvo en vivo unos segundos y eso es el costo aceptado
 * del modelo (ver `docs/features/filtro-al-publicar.md`).
 *
 * **No lanza nunca.** Si el clasificador falla, la publicación queda `in_review` —visible solo para
 * su autor y el admin— y aparece en el panel. Es la diferencia que justificó revisar después en vez
 * de antes: con un veto bloqueante había que elegir entre dejar pasar sin revisar o dejar el sitio
 * sin poder publicar; aquí no hay que elegir.
 */
export default class ReviewPostContentUseCase {
  constructor(
    private readonly moderationService: IContentModerationService,
    private readonly repository: IModerationRepository,
  ) {}

  async execute({
    postId,
    title,
    content,
  }: ReviewPostContentInput): Promise<ReviewPostContentResult> {
    const post = await this.repository.findById(postId);

    if (!post) {
      return {
        status: "in_review",
        reason: null,
        worthIndexing: false,
        error: new Error(`No existe la publicación ${postId}.`),
      };
    }

    let status: ModerationStatus;
    let reason: ModerationReason | null = null;
    let error: unknown;

    try {
      const verdict = await this.moderationService.review({ title, content });

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

    await this.repository.applyDecision({
      postId,
      status,
      reason,
      chatbot: chatbotVisibilityFor({
        kind: post.kind,
        moderationStatus: status,
      }),
    });

    return { status, reason, worthIndexing: status === "published", error };
  }
}
