import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import { habitLeagueOptIns } from "~/infra/dataAccess/db/schema/habits";
import type { HabitLeagueRepository } from "~/use_cases/habits/ports/HabitLeagueRepository";

export default class PostgresHabitLeagueRepository
  implements HabitLeagueRepository
{
  /**
   * Filtra por `cycle_date`, el día que se practicó.
   *
   * Filtraba por `completed_at` —el instante en que se escribió la fila— mientras puntuaba por
   * `cycle_date`. Son dos cosas distintas en cuanto alguien recupera un día: quien registra el
   * domingo su martes quedaba fuera de la semana del martes, y quien registra el lunes su domingo
   * entraba en la semana nueva arrastrando una fecha de la anterior. La columna que decide de qué
   * semana es una repetición tiene que ser la misma que la clasifica.
   */
  async readWeeklyParticipants(
    start: string,
    end: string,
  ): Promise<Array<{ alias: string; activeDates: string[] }>> {
    const result = await db.execute(sql`
      SELECT u.username AS alias,
             array_agg(DISTINCT r.cycle_date::text ORDER BY r.cycle_date::text) AS active_dates
      FROM habit_league_opt_ins o
      JOIN users u ON u.id = o.user_id
      JOIN habit_repetitions r ON r.user_id = o.user_id
      WHERE o.withdrawn_at IS NULL
        AND u.username IS NOT NULL
        AND r.cycle_date >= ${start}::date
        AND r.cycle_date < ${end}::date
      GROUP BY u.id, u.username
    `);
    return result.rows.map((row) => ({
      alias: String(row.alias),
      activeDates: row.active_dates as string[],
    }));
  }

  async readViewer(
    userId: string,
  ): Promise<{ alias: string | null; optedIn: boolean }> {
    const [row] = await db
      .select({ alias: users.username, optInUserId: habitLeagueOptIns.userId })
      .from(users)
      .leftJoin(
        habitLeagueOptIns,
        and(
          eq(habitLeagueOptIns.userId, users.id),
          isNull(habitLeagueOptIns.withdrawnAt),
        ),
      )
      .where(eq(users.id, userId))
      .limit(1);
    return { alias: row?.alias ?? null, optedIn: Boolean(row?.optInUserId) };
  }

  async setOptIn(userId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      await db
        .insert(habitLeagueOptIns)
        .values({ userId })
        .onConflictDoUpdate({
          target: habitLeagueOptIns.userId,
          set: { optedInAt: new Date(), withdrawnAt: null },
        });
      return;
    }
    await db
      .update(habitLeagueOptIns)
      .set({ withdrawnAt: new Date() })
      .where(
        and(
          eq(habitLeagueOptIns.userId, userId),
          isNull(habitLeagueOptIns.withdrawnAt),
        ),
      );
  }
}

let instance: PostgresHabitLeagueRepository | null = null;

export function createHabitLeagueRepository(): PostgresHabitLeagueRepository {
  if (!instance) instance = new PostgresHabitLeagueRepository();
  return instance;
}
