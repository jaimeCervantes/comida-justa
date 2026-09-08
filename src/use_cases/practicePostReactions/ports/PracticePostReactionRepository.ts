import type { PracticePostReactionPost } from "~/domain/practicePostReactions/practicePostReaction";

export interface PracticePostReactionRepository {
  findPostById(postId: string): Promise<PracticePostReactionPost | null>;
  support(userId: string, postId: string): Promise<void>;
  withdraw(userId: string, postId: string): Promise<void>;
  count(postId: string): Promise<number>;
  hasReacted(userId: string | null, postId: string): Promise<boolean>;
}
