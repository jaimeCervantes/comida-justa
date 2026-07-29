import { desc, eq, sql } from "drizzle-orm";
import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import { comments } from "~/infra/dataAccess/db/schema/comments";
import type { Comment, PostUser } from "~/infra/types/Posts";

export class PostgresCommentRepository {
  async addComment(
    postId: string,
    content: string,
    user: PostUser,
  ): Promise<
    { successMessage: string; comment: Comment } | { errorMessage: string }
  > {
    const commentId = crypto.randomUUID();

    try {
      await db.insert(comments).values({
        id: commentId,
        postId,
        userId: user.id,
        content,
        createdAt: new Date(),
      });

      return {
        successMessage: "Comentario agregado exitosamente",
        comment: {
          id: commentId,
          postId,
          content,
          createdAt: new Date().toISOString(),
          user,
        },
      };
    } catch {
      return { errorMessage: "Ocurrió un error al agregar el comentario" };
    }
  }

  async getComments(
    postId: string,
    page: number = 1,
    pageSize: number = COMMENTS_PAGE_SIZE,
  ): Promise<{ comments: Comment[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const [rows, countResult] = await Promise.all([
      db
        .select({
          id: comments.id,
          postId: comments.postId,
          content: comments.content,
          createdAt: comments.createdAt,
          userId: comments.userId,
          userName: users.name,
          userEmail: users.email,
          userImage: users.image,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(comments)
        .where(eq(comments.postId, postId)),
    ]);

    const total = Number(countResult[0].count);

    const commentList: Comment[] = rows.map((row) => ({
      id: row.id,
      postId: row.postId,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.userId,
        name: row.userName ?? undefined,
        email: row.userEmail ?? undefined,
        image: row.userImage ?? undefined,
      },
    }));

    return { comments: commentList, total };
  }
}
