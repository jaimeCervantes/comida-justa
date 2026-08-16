import { describe, expect, it, vi } from "vitest";
import ModeratePostUseCase from "./moderatePostUseCase";
import type IModerationRepository from "./ports/IModerationRepository";
import type {
  ModeratedPost,
  ModerationUpdate,
} from "./ports/IModerationRepository";

const DONA: ModeratedPost = {
  id: "post-dona",
  slug: "dona-chocolate-keto",
  title: "Dona Chocolate Keto",
  kind: "producto",
  status: "published",
  reason: null,
  authorName: "Hazlo Sano",
  createdAt: new Date("2026-08-01T10:00:00Z"),
  reviewedAt: null,
};

const SUENO: ModeratedPost = {
  ...DONA,
  id: "post-sueno",
  slug: "funciones-del-buen-sueno-parte-1",
  title: "Funciones del Buen Sueño Parte 1",
  kind: "anuncio",
};

function repositoryWith(post: ModeratedPost | null) {
  const applied: ModerationUpdate[] = [];

  const repository: IModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => post),
    applyDecision: vi.fn(async (update: ModerationUpdate) => {
      applied.push(update);
    }),
  };

  return { repository, applied };
}

describe("ModeratePostUseCase", () => {
  let useCase: ModeratePostUseCase;

  describe("bajar una publicación", () => {
    it("guarda el estado y el motivo", async () => {
      const { repository, applied } = repositoryWith(DONA);
      useCase = new ModeratePostUseCase(repository);

      const result = await useCase.execute({
        postId: DONA.id,
        decision: { action: "reject", reason: "off_topic" },
      });

      expect(result).toEqual({ status: "rejected" });
      expect(applied[0]).toMatchObject({
        postId: DONA.id,
        status: "rejected",
        reason: "off_topic",
      });
    });

    /* El bot no conoce `moderation_status`: filtra por `is_available`, así que bajar un producto
       tiene que apagarle también ese interruptor o lo seguiría ofreciendo. */
    it("silencia el producto para el chatbot", async () => {
      const { repository, applied } = repositoryWith(DONA);
      useCase = new ModeratePostUseCase(repository);

      await useCase.execute({
        postId: DONA.id,
        decision: { action: "reject", reason: "spam" },
      });

      expect(applied[0].chatbot).toBe("silence");
    });

    it("en un anuncio no toca la disponibilidad, porque el bot nunca lo vio", async () => {
      const { repository, applied } = repositoryWith(SUENO);
      useCase = new ModeratePostUseCase(repository);

      await useCase.execute({
        postId: SUENO.id,
        decision: { action: "reject", reason: "off_topic" },
      });

      expect(applied[0].chatbot).toBe("leave");
    });
  });

  describe("restituir una publicación", () => {
    it("la vuelve a publicar y borra el motivo", async () => {
      const { repository, applied } = repositoryWith({
        ...DONA,
        status: "rejected",
        reason: "off_topic",
      });
      useCase = new ModeratePostUseCase(repository);

      const result = await useCase.execute({
        postId: DONA.id,
        decision: { action: "approve" },
      });

      expect(result).toEqual({ status: "published" });
      expect(applied[0]).toMatchObject({ status: "published", reason: null });
    });

    /* Se calcula con el estado nuevo: si se mirara el que traía, un producto restituido se
       quedaría silenciado para el bot y nadie entendería por qué. */
    it("vuelve a ofrecer el producto al chatbot", async () => {
      const { repository, applied } = repositoryWith({
        ...DONA,
        status: "rejected",
        reason: "spam",
      });
      useCase = new ModeratePostUseCase(repository);

      await useCase.execute({
        postId: DONA.id,
        decision: { action: "approve" },
      });

      expect(applied[0].chatbot).toBe("restore");
    });
  });

  it("una publicación que no existe no escribe nada", async () => {
    const { repository, applied } = repositoryWith(null);
    useCase = new ModeratePostUseCase(repository);

    const result = await useCase.execute({
      postId: "no-existe",
      decision: { action: "approve" },
    });

    expect(result.status).toBeUndefined();
    expect(result.errorMessage).toBeTruthy();
    expect(applied).toEqual([]);
  });

  it("la bandeja del panel delega en el repositorio", async () => {
    const { repository } = repositoryWith(DONA);
    useCase = new ModeratePostUseCase(repository);

    await useCase.pendingReview();

    expect(repository.findPendingReview).toHaveBeenCalledOnce();
  });
});
