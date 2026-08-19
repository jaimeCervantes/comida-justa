import { and, count, eq } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { eventAttendances, posts } from "~/infra/dataAccess/db/schema/posts";
import type IEventAttendanceRepository from "~/use_cases/eventAttendance/ports/IEventAttendanceRepository";

export class PostgresEventAttendanceRepository
  implements IEventAttendanceRepository
{
  async findPostById(postId: string) {
    const [row] = await db
      .select({ id: posts.id, kind: posts.kind, startsAt: posts.startsAt })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return row ?? null;
  }

  /**
   * `ON CONFLICT DO NOTHING` cierra el doble clic y dos pestañas al mismo tiempo. La app lee antes
   * para alternar, pero la base es quien impide que una carrera infle el contador.
   */
  async attend(userId: string, postId: string): Promise<void> {
    await db
      .insert(eventAttendances)
      .values({ userId, postId })
      .onConflictDoNothing();
  }

  async cancel(userId: string, postId: string): Promise<void> {
    await db
      .delete(eventAttendances)
      .where(
        and(
          eq(eventAttendances.userId, userId),
          eq(eventAttendances.postId, postId),
        ),
      );
  }

  async count(postId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(eventAttendances)
      .where(eq(eventAttendances.postId, postId));

    return Number(row?.total ?? 0);
  }

  async isAttending(userId: string | null, postId: string): Promise<boolean> {
    if (!userId) return false;

    const rows = await db
      .select({ id: eventAttendances.id })
      .from(eventAttendances)
      .where(
        and(
          eq(eventAttendances.userId, userId),
          eq(eventAttendances.postId, postId),
        ),
      )
      .limit(1);

    return rows.length > 0;
  }
}

let instance: PostgresEventAttendanceRepository | null = null;

export function createEventAttendanceRepository(): PostgresEventAttendanceRepository {
  if (instance) return instance;
  instance = new PostgresEventAttendanceRepository();
  return instance;
}
