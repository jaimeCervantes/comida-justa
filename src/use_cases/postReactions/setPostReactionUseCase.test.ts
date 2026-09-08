import { describe, expect, it, vi } from "vitest";
import type { PostReactionRepository } from "./ports/PostReactionRepository";
import SetPostReactionUseCase from "./setPostReactionUseCase";

describe("SetPostReactionUseCase", () => {
  it("guarda una reacción de apoyo una sola vez y devuelve el conteo", async () => {
    const repository = fakeReactions({ reacted: true, count: 1 });

    const result = await new SetPostReactionUseCase(repository).execute({
      userId: "luis",
      postId: "post-1",
      intent: "support",
    });

    expect(repository.support).toHaveBeenCalledWith("luis", "post-1");
    expect(repository.withdraw).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, reacted: true, reactions: 1 });
  });

  it("retira la reacción de la misma persona", async () => {
    const repository = fakeReactions({ reacted: false, count: 0 });

    const result = await new SetPostReactionUseCase(repository).execute({
      userId: "luis",
      postId: "post-1",
      intent: "withdraw",
    });

    expect(repository.withdraw).toHaveBeenCalledWith("luis", "post-1");
    expect(repository.support).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, reacted: false, reactions: 0 });
  });

  it("también reacciona sobre publicaciones que no son prácticas", async () => {
    const repository = fakeReactions({ postKind: "producto" });

    const result = await new SetPostReactionUseCase(repository).execute({
      userId: "luis",
      postId: "post-1",
      intent: "support",
    });

    expect(repository.support).toHaveBeenCalledWith("luis", "post-1");
    expect(repository.withdraw).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, reacted: false, reactions: 0 });
  });
});

function fakeReactions({
  postKind = "practica",
  reacted = false,
  count = 0,
}: {
  postKind?: string;
  reacted?: boolean;
  count?: number;
} = {}): PostReactionRepository {
  return {
    findPostById: vi.fn().mockResolvedValue({ id: "post-1", kind: postKind }),
    support: vi.fn().mockResolvedValue(undefined),
    withdraw: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(count),
    hasReacted: vi.fn().mockResolvedValue(reacted),
  };
}
