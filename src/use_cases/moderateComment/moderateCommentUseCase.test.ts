import { describe, expect, it, vi } from "vitest";
import ModerateCommentUseCase from "./moderateCommentUseCase";
import type ICommentModerationRepository from "./ports/ICommentModerationRepository";
import type {
  CommentModerationUpdate,
  ModeratedComment,
} from "./ports/ICommentModerationRepository";

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
  createdAt: new Date("2026-08-01T10:00:00Z"),
  reviewedAt: null,
  reportCount: 0,
};

function repositoryWith(comment: ModeratedComment | null) {
  const applied: CommentModerationUpdate[] = [];

  const repository: ICommentModerationRepository = {
    findPendingReview: vi.fn(async () => []),
    findById: vi.fn(async () => comment),
    applyDecision: vi.fn(async (update: CommentModerationUpdate) => {
      applied.push(update);
    }),
    saveReport: vi.fn(async () => true),
  };

  return { repository, applied };
}

describe("ModerateCommentUseCase", () => {
  let useCase: ModerateCommentUseCase;

  it("baja un comentario y guarda su motivo", async () => {
    const { repository, applied } = repositoryWith(COMENTARIO);
    useCase = new ModerateCommentUseCase(repository);

    const result = await useCase.execute({
      commentId: COMENTARIO.id,
      decision: { action: "reject", reason: "offensive" },
    });

    expect(result).toEqual({ status: "rejected" });
    expect(applied[0]).toEqual({
      commentId: COMENTARIO.id,
      status: "rejected",
      reason: "offensive",
    });
  });

  it("restituye un comentario y borra el motivo", async () => {
    const { repository, applied } = repositoryWith({
      ...COMENTARIO,
      status: "rejected",
      reason: "offensive",
    });
    useCase = new ModerateCommentUseCase(repository);

    const result = await useCase.execute({
      commentId: COMENTARIO.id,
      decision: { action: "approve" },
    });

    expect(result).toEqual({ status: "published" });
    expect(applied[0]).toEqual({
      commentId: COMENTARIO.id,
      status: "published",
      reason: null,
    });
  });

  it("un comentario que no existe no escribe nada", async () => {
    const { repository, applied } = repositoryWith(null);
    useCase = new ModerateCommentUseCase(repository);

    const result = await useCase.execute({
      commentId: "no-existe",
      decision: { action: "approve" },
    });

    expect(result.status).toBeUndefined();
    expect(result.errorMessage).toBeTruthy();
    expect(applied).toEqual([]);
  });

  it("la bandeja del panel delega en el repositorio", async () => {
    const { repository } = repositoryWith(COMENTARIO);
    useCase = new ModerateCommentUseCase(repository);

    await useCase.pendingReview();

    expect(repository.findPendingReview).toHaveBeenCalledOnce();
  });
});
