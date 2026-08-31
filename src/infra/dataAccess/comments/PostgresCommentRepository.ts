import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import { comments } from "~/infra/dataAccess/db/schema/comments";
import type { Comment, PostUser } from "~/infra/types/Posts";

/** Quién pide la lista, para decidir qué comentarios no publicados le tocan. */
export type CommentViewer = { id?: string; isAdmin?: boolean };

/**
 * Lo que ve un comentario que no está publicado es su propio autor y el admin —el mismo aviso que
 * ya existe para publicaciones, aplicado a comentarios—. `undefined` significa "sin filtro": lo ve
 * todo, que es el caso del admin.
 */
function visibilityFilter(viewer: CommentViewer | undefined) {
  if (viewer?.isAdmin) return undefined;
  if (viewer?.id) {
    return or(
      eq(comments.moderationStatus, "published"),
      eq(comments.userId, viewer.id),
    );
  }
  return eq(comments.moderationStatus, "published");
}

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
          /* Nace publicado, como una publicación: el clasificador lo revisa después, en segundo
             plano. Es el mismo valor por omisión de la columna. */
          moderationStatus: "published",
        },
      };
    } catch {
      return { errorMessage: "Ocurrió un error al agregar el comentario" };
    }
  }

  /**
   * Cuántos comentarios lleva escritos esa persona desde `since`.
   *
   * Es la mitad de datos del límite de frecuencia. **Se cuenta contra la base y no en memoria** a
   * propósito: un contador en el proceso se vacía en cada despliegue y no existe para el segundo
   * servidor, así que el tope valdría el doble con dos instancias y nada recién desplegado. La
   * consulta va por `(user_id, created_at)`, que es lo que ya indexa la tabla para leer un hilo.
   */
  async countRecentByUser(userId: string, since: Date): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`count(*)` })
      .from(comments)
      .where(and(eq(comments.userId, userId), gte(comments.createdAt, since)));

    return Number(row?.total ?? 0);
  }

  async getComments(
    postId: string,
    page: number = 1,
    pageSize: number = COMMENTS_PAGE_SIZE,
    viewer?: CommentViewer,
  ): Promise<{ comments: Comment[]; total: number }> {
    const offset = (page - 1) * pageSize;
    const visibility = visibilityFilter(viewer);
    const where = visibility
      ? and(eq(comments.postId, postId), visibility)
      : eq(comments.postId, postId);

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
          moderationStatus: comments.moderationStatus,
          moderationReason: comments.moderationReason,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(where)
        .orderBy(desc(comments.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.select({ count: sql<number>`count(*)` }).from(comments).where(where),
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
      moderationStatus: row.moderationStatus,
      moderationReason: row.moderationReason,
    }));

    return { comments: commentList, total };
  }
}
