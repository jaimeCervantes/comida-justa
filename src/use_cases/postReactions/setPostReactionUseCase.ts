import {
  type PostReactionIntent,
  type PostReactionRejection,
  rejectPostReactionRequest,
} from "~/domain/postReactions/postReaction";
import type { PostReactionRepository } from "./ports/PostReactionRepository";

export type SetPostReactionResult =
  | { ok: true; reacted: boolean; reactions: number }
  | { ok: false; reason: PostReactionRejection };

export interface SetPostReactionRequest {
  userId: string | null;
  postId: string;
  intent: string | null;
}

export default class SetPostReactionUseCase {
  constructor(private readonly reactions: PostReactionRepository) {}

  async execute({
    userId,
    postId,
    intent,
  }: SetPostReactionRequest): Promise<SetPostReactionResult> {
    const post = postId ? await this.reactions.findPostById(postId) : null;
    const rejection = rejectPostReactionRequest({
      userId,
      post,
      intent,
    });

    if (rejection !== null) return { ok: false, reason: rejection };
    if (!userId || !post) return { ok: false, reason: "not-found" };

    if ((intent as PostReactionIntent) === "support") {
      await this.reactions.support(userId, post.id);
    } else {
      await this.reactions.withdraw(userId, post.id);
    }

    return {
      ok: true,
      reacted: await this.reactions.hasReacted(userId, post.id),
      reactions: await this.reactions.count(post.id),
    };
  }
}
