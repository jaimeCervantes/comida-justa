import type { PostReactionPost } from "~/domain/postReactions/postReaction";

export interface PostReactionRepository {
  findPostById(postId: string): Promise<PostReactionPost | null>;
  support(userId: string, postId: string): Promise<void>;
  withdraw(userId: string, postId: string): Promise<void>;
  count(postId: string): Promise<number>;
  hasReacted(userId: string | null, postId: string): Promise<boolean>;
}
