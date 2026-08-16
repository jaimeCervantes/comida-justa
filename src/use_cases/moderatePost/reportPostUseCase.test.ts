import { describe, expect, it, vi } from "vitest";
import type { PostReport } from "~/domain/entities/post/moderation";
import type IModerationRepository from "./ports/IModerationRepository";
import type { ModeratedPost } from "./ports/IModerationRepository";
import ReportPostUseCase from "./reportPostUseCase";

const AUTOR = "user-hazlo-sano";
const VECINA = "user-vecina";

const DONA: ModeratedPost = {
  id: "post-dona",
  slug: "dona-chocolate-keto",
  title: "Dona Chocolate Keto",
  kind: "producto",
  status: "published",
  reason: null,
  authorId: AUTOR,
  authorName: "Hazlo Sano",
  createdAt: new Date("2026-08-16T10:00:00Z"),
  reviewedAt: null,
  reportCount: 0,
};

function build(post: ModeratedPost | null = DONA, created = true) {
  const saved: PostReport[] = [];
  const applied: unknown[] = [];

  const repository: IModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => post),
    applyDecision: vi.fn(async (update) => {
      applied.push(update);
    }),
    saveReport: vi.fn(async (report: PostReport) => {
      saved.push(report);
      return created;
    }),
  };

  return { useCase: new ReportPostUseCase(repository), saved, applied };
}

const denuncia = {
  postId: DONA.id,
  reporterId: VECINA,
  reason: "spam" as const,
};

describe("ReportPostUseCase", () => {
  it("guarda el aviso con su motivo", async () => {
    const { useCase, saved } = build();

    const result = await useCase.execute(denuncia);

    expect(result).toEqual({ reported: true, alreadyReported: false });
    expect(saved[0]).toEqual({
      postId: DONA.id,
      reporterId: VECINA,
      reason: "spam",
    });
  });

  /* La decisión entera del slice: denunciar AVISA, no oculta. Si mandara a `in_review`, cualquiera
     podría vaciar el catálogo denunciando una publicación tras otra. */
  it("NO cambia el estado de la publicación", async () => {
    const { useCase, applied } = build();

    await useCase.execute(denuncia);

    expect(applied).toEqual([]);
  });

  /* Volver a pulsar no es un error: quien lo hace quiere saber que su aviso ya está, no leer que
     algo salió mal. La duplicación la impide la base con su UNIQUE. */
  it("denunciar dos veces contesta que ya estaba, sin fallar", async () => {
    const { useCase } = build(DONA, false);

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

    /* Lo que ya está bajado o esperando no necesita que nadie avise: ya está en el panel. */
    it.each(["rejected", "in_review"] as const)(
      "sobre una publicación %s",
      async (status) => {
        const { useCase, saved } = build({ ...DONA, status });

        const result = await useCase.execute(denuncia);

        expect(result).toEqual({ reported: false, refusal: "not-allowed" });
        expect(saved).toEqual([]);
      },
    );

    it("sobre una publicación que no existe", async () => {
      const { useCase, saved } = build(null);

      expect(await useCase.execute(denuncia)).toEqual({
        reported: false,
        refusal: "not-found",
      });
      expect(saved).toEqual([]);
    });
  });
});
