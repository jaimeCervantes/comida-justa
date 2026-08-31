import { describe, expect, it, vi } from "vitest";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";
import type {
  CommentReport,
  ModeratedComment,
} from "./ports/ICommentModerationRepository";
import ReportCommentUseCase from "./reportCommentUseCase";

const AUTOR = "user-hazlo-sano";
const VECINA = "user-vecina";

const COMENTARIO: ModeratedComment = {
  id: "comment-dona",
  content: "¿Dónde la consigo?",
  postId: "post-dona",
  postSlug: "dona-chocolate-keto",
  postTitle: "Dona Chocolate Keto",
  status: "published",
  reason: null,
  authorId: AUTOR,
  authorName: "Hazlo Sano",
  createdAt: new Date("2026-08-16T10:00:00Z"),
  reviewedAt: null,
  reportCount: 0,
};

function build(comment: ModeratedComment | null = COMENTARIO, created = true) {
  const saved: CommentReport[] = [];
  const applied: unknown[] = [];

  const repository: ICommentModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => comment),
    applyDecision: vi.fn(async (update) => {
      applied.push(update);
    }),
    saveReport: vi.fn(async (report: CommentReport) => {
      saved.push(report);
      return created;
    }),
  };

  return { useCase: new ReportCommentUseCase(repository), saved, applied };
}

const denuncia = {
  commentId: COMENTARIO.id,
  reporterId: VECINA,
  reason: "spam" as const,
};

describe("ReportCommentUseCase", () => {
  it("guarda el aviso con su motivo", async () => {
    const { useCase, saved } = build();

    const result = await useCase.execute(denuncia);

    expect(result).toEqual({ reported: true, alreadyReported: false });
    expect(saved[0]).toEqual({
      commentId: COMENTARIO.id,
      reporterId: VECINA,
      reason: "spam",
    });
  });

  it("NO cambia el estado del comentario", async () => {
    const { useCase, applied } = build();

    await useCase.execute(denuncia);

    expect(applied).toEqual([]);
  });

  it("denunciar dos veces contesta que ya estaba, sin fallar", async () => {
    const { useCase } = build(COMENTARIO, false);

    expect(await useCase.execute(denuncia)).toEqual({
      reported: true,
      alreadyReported: true,
    });
  });

  describe("a quién se le niega", () => {
    it("a su propio autor", async () => {
      const { useCase, saved } = build();

      const result = await useCase.execute({
        ...denuncia,
        reporterId: AUTOR,
      });

      expect(result).toEqual({ reported: false, refusal: "not-allowed" });
      expect(saved).toEqual([]);
    });

    it("a quien no tiene sesión", async () => {
      const { useCase, saved } = build();

      const result = await useCase.execute({ ...denuncia, reporterId: "" });

      expect(result).toEqual({ reported: false, refusal: "not-allowed" });
      expect(saved).toEqual([]);
    });

    it.each(["rejected", "in_review"] as const)(
      "sobre un comentario %s",
      async (status) => {
        const { useCase, saved } = build({ ...COMENTARIO, status });

        const result = await useCase.execute(denuncia);

        expect(result).toEqual({ reported: false, refusal: "not-allowed" });
        expect(saved).toEqual([]);
      },
    );

    it("sobre un comentario que no existe", async () => {
      const { useCase, saved } = build(null);

      expect(await useCase.execute(denuncia)).toEqual({
        reported: false,
        refusal: "not-found",
      });
      expect(saved).toEqual([]);
    });
  });
});
