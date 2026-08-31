import { describe, expect, it, vi } from "vitest";
import ModerationProviderError from "~/domain/errors/ModerationProviderError";
import type IContentModerationService from "~/use_cases/common/ports/IContentModerationService";
import type { ModerationVerdict } from "~/use_cases/common/ports/IContentModerationService";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";
import type {
  CommentModerationUpdate,
  ModeratedComment,
} from "./ports/ICommentModerationRepository";
import ReviewCommentContentUseCase from "./reviewCommentContentUseCase";

const COMENTARIO: ModeratedComment = {
  id: "comment-dona",
  content: "¿Dónde la consigo?",
  postId: "post-dona",
  postSlug: "dona-chocolate-keto",
  postTitle: "Dona Chocolate Keto",
  status: "published",
  reason: null,
  authorId: "user-hazlo-sano",
  authorName: "Hazlo Sano",
  createdAt: new Date("2026-08-16T10:00:00Z"),
  reviewedAt: null,
  reportCount: 0,
};

function build(
  verdict: ModerationVerdict | Error,
  comment: ModeratedComment | null = COMENTARIO,
) {
  const applied: CommentModerationUpdate[] = [];

  const service: IContentModerationService = {
    review: vi.fn(async () => {
      if (verdict instanceof Error) throw verdict;
      return verdict;
    }),
  };

  const repository: ICommentModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => comment),
    applyDecision: vi.fn(async (update: CommentModerationUpdate) => {
      applied.push(update);
    }),
    saveReport: vi.fn(async () => true),
  };

  return {
    useCase: new ReviewCommentContentUseCase(service, repository),
    applied,
    service,
  };
}

const input = { commentId: COMENTARIO.id, content: COMENTARIO.content };

describe("ReviewCommentContentUseCase", () => {
  it("lo aceptado se queda publicado", async () => {
    const { useCase, applied } = build({ decision: "accepted" });

    const result = await useCase.execute(input);

    expect(result.status).toBe("published");
    expect(result.reason).toBeNull();
    expect(applied[0]).toEqual({
      commentId: COMENTARIO.id,
      status: "published",
      reason: null,
    });
  });

  it("lo rechazado se baja con su motivo", async () => {
    const { useCase, applied } = build({
      decision: "rejected",
      reason: "offensive",
    });

    const result = await useCase.execute(input);

    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("offensive");
    expect(applied[0]).toEqual({
      commentId: COMENTARIO.id,
      status: "rejected",
      reason: "offensive",
    });
  });

  /* El comentario no tiene título; se manda vacío y el clasificador juzga solo con contenido. */
  it("manda el contenido con el título vacío", async () => {
    const { useCase, service } = build({ decision: "accepted" });

    await useCase.execute(input);

    expect(service.review).toHaveBeenCalledWith({
      title: "",
      content: COMENTARIO.content,
    });
  });

  describe("cuando el clasificador no puede juzgar", () => {
    it("queda en revisión en vez de en vivo a ciegas", async () => {
      const { useCase, applied } = build(
        new ModerationProviderError("Gemini is unreachable."),
      );

      const result = await useCase.execute(input);

      expect(result.status).toBe("in_review");
      expect(applied[0]).toEqual({
        commentId: COMENTARIO.id,
        status: "in_review",
        reason: null,
      });
    });

    it("no lanza: comentar no puede romperse porque Google tuvo un mal día", async () => {
      const { useCase } = build(new Error("boom"));

      await expect(useCase.execute(input)).resolves.toBeTruthy();
    });

    it("devuelve el error para que quede en el registro", async () => {
      const { useCase } = build(new ModerationProviderError("timeout"));

      expect((await useCase.execute(input)).error).toBeInstanceOf(
        ModerationProviderError,
      );
    });
  });

  it("un comentario que ya no existe no escribe nada", async () => {
    const { useCase, applied, service } = build({ decision: "accepted" }, null);

    const result = await useCase.execute(input);

    expect(applied).toEqual([]);
    expect(service.review).not.toHaveBeenCalled();
    expect(result.status).toBe("in_review");
  });
});
