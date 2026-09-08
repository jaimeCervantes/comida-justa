import {
  type PracticePostReactionIntent,
  type PracticePostReactionRejection,
  rejectPracticePostReactionRequest,
} from "~/domain/practicePostReactions/practicePostReaction";
import type { PracticePostReactionRepository } from "./ports/PracticePostReactionRepository";

export type SetPracticePostReactionResult =
  | { ok: true; reacted: boolean; reactions: number }
  | { ok: false; reason: PracticePostReactionRejection };

export interface SetPracticePostReactionRequest {
  userId: string | null;
  postId: string;
  intent: string | null;
}

export default class SetPracticePostReactionUseCase {
  constructor(private readonly reactions: PracticePostReactionRepository) {}

  async execute({
    userId,
    postId,
    intent,
  }: SetPracticePostReactionRequest): Promise<SetPracticePostReactionResult> {
    const post = postId ? await this.reactions.findPostById(postId) : null;
    const rejection = rejectPracticePostReactionRequest({
      userId,
      post,
      intent,
    });

    if (rejection !== null) return { ok: false, reason: rejection };
    if (!userId || !post) return { ok: false, reason: "not-found" };

    if ((intent as PracticePostReactionIntent) === "support") {
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
