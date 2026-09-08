import { and, count, eq } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { postReactions, posts } from "~/infra/dataAccess/db/schema/posts";
import type { PostReactionRepository } from "~/use_cases/postReactions/ports/PostReactionRepository";

export class PostgresPostReactionRepository implements PostReactionRepository {
  async findPostById(postId: string) {
    const [row] = await db
      .select({ id: posts.id, kind: posts.kind })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return row ?? null;
  }

  async support(userId: string, postId: string): Promise<void> {
    await db
      .insert(postReactions)
      .values({ userId, postId })
      .onConflictDoNothing();
  }

  async withdraw(userId: string, postId: string): Promise<void> {
    await db
      .delete(postReactions)
      .where(
        and(eq(postReactions.userId, userId), eq(postReactions.postId, postId)),
      );
  }

  async count(postId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(postReactions)
      .where(eq(postReactions.postId, postId));

    return Number(row?.total ?? 0);
  }

  async hasReacted(userId: string | null, postId: string): Promise<boolean> {
    if (!userId) return false;

    const rows = await db
      .select({ userId: postReactions.userId })
      .from(postReactions)
      .where(
        and(eq(postReactions.userId, userId), eq(postReactions.postId, postId)),
      )
      .limit(1);

    return rows.length > 0;
  }
}

let instance: PostgresPostReactionRepository | null = null;

export function createPostReactionRepository(): PostgresPostReactionRepository {
  if (instance) return instance;
  instance = new PostgresPostReactionRepository();
  return instance;
}
