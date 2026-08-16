import { describe, expect, it, vi } from "vitest";
import ModerationProviderError from "~/domain/errors/ModerationProviderError";
import type IContentModerationService from "~/use_cases/common/ports/IContentModerationService";
import type { ModerationVerdict } from "~/use_cases/common/ports/IContentModerationService";
import type IModerationRepository from "./ports/IModerationRepository";
import type {
  ModeratedPost,
  ModerationUpdate,
} from "./ports/IModerationRepository";
import ReviewPostContentUseCase from "./reviewPostContentUseCase";

const DONA: ModeratedPost = {
  id: "post-dona",
  slug: "dona-chocolate-keto",
  title: "Dona Chocolate Keto",
  kind: "producto",
  status: "published",
  reason: null,
  authorId: "user-hazlo-sano",
  authorName: "Hazlo Sano",
  createdAt: new Date("2026-08-16T10:00:00Z"),
  reviewedAt: null,
  reportCount: 0,
};

const SUENO: ModeratedPost = {
  ...DONA,
  id: "post-sueno",
  title: "Funciones del Buen Sueño Parte 1",
  kind: "anuncio",
};

function build(
  verdict: ModerationVerdict | Error,
  post: ModeratedPost | null = DONA,
) {
  const applied: ModerationUpdate[] = [];

  const service: IContentModerationService = {
    review: vi.fn(async () => {
      if (verdict instanceof Error) throw verdict;
      return verdict;
    }),
  };

  const repository: IModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => post),
    applyDecision: vi.fn(async (update: ModerationUpdate) => {
      applied.push(update);
    }),
    saveReport: vi.fn(async () => true),
  };

  return {
    useCase: new ReviewPostContentUseCase(service, repository),
    applied,
    service,
  };
}

const input = {
  postId: DONA.id,
  title: DONA.title,
  content: "Dona horneada sin azúcar añadida, endulzada con monk fruit.",
};

describe("ReviewPostContentUseCase", () => {
  it("lo aceptado se queda publicado y merece indexarse", async () => {
    const { useCase, applied } = build({ decision: "accepted" });

    const result = await useCase.execute(input);

    expect(result.status).toBe("published");
    expect(result.reason).toBeNull();
    expect(result.worthIndexing).toBe(true);
    expect(applied[0]).toMatchObject({ status: "published", reason: null });
  });

  it("lo rechazado se baja con su motivo", async () => {
    const { useCase, applied } = build({
      decision: "rejected",
      reason: "off_topic",
    });

    const result = await useCase.execute(input);

    expect(result.status).toBe("rejected");
    expect(result.reason).toBe("off_topic");
    expect(applied[0]).toMatchObject({
      status: "rejected",
      reason: "off_topic",
    });
  });

  /* Pagarle a Gemini por vectorizar y traducir algo que acaba de bajarse es dinero tirado, y el
     vector además la dejaría encontrable por el chatbot. */
  it("lo rechazado no merece indexarse", async () => {
    const { useCase } = build({ decision: "rejected", reason: "spam" });

    expect((await useCase.execute(input)).worthIndexing).toBe(false);
  });

  it("un producto rechazado se silencia también para el bot", async () => {
    const { useCase, applied } = build({
      decision: "rejected",
      reason: "health_claim",
    });

    await useCase.execute(input);

    expect(applied[0].chatbot).toBe("silence");
  });

  it("un anuncio rechazado no toca la disponibilidad", async () => {
    const { useCase, applied } = build(
      { decision: "rejected", reason: "off_topic" },
      SUENO,
    );

    await useCase.execute({ ...input, postId: SUENO.id });

    expect(applied[0].chatbot).toBe("leave");
  });

  describe("cuando el clasificador no puede juzgar", () => {
    /* Es la diferencia que justificó revisar después en vez de antes: no hay que elegir entre
       dejar pasar sin revisar y dejar el sitio sin poder publicar. */
    it("queda en revisión en vez de en vivo a ciegas", async () => {
      const { useCase, applied } = build(
        new ModerationProviderError("Gemini is unreachable."),
      );

      const result = await useCase.execute(input);

      expect(result.status).toBe("in_review");
      expect(result.worthIndexing).toBe(false);
      expect(applied[0]).toMatchObject({ status: "in_review", reason: null });
    });

    it("no lanza: publicar no puede romperse porque Google tuvo un mal día", async () => {
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

  /* Sin la publicación no hay `kind`, así que no se puede decidir qué hacer con `is_available`.
     Escribir a ciegas sería peor que no escribir. */
  it("una publicación que ya no existe no escribe nada", async () => {
    const { useCase, applied, service } = build({ decision: "accepted" }, null);

    const result = await useCase.execute(input);

    expect(applied).toEqual([]);
    expect(service.review).not.toHaveBeenCalled();
    expect(result.status).toBe("in_review");
    expect(result.worthIndexing).toBe(false);
  });
});
