import { and, eq, isNull, sql } from "drizzle-orm";
import type { LocalDate } from "~/domain/habits/habitChallenge";
import type { LeagueParticipantActivity } from "~/domain/habits/habitLeague";
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
  ): Promise<LeagueParticipantActivity[]> {
    /*
     * Dos lecturas de la misma tabla, y el rango sólo acota una. Los **aportes** son de la semana
     * pedida; las **fechas** son todas, porque las semanas sostenidas son históricas y se calculan
     * en el dominio: quien decide qué es una semana es `communityWeekStart`, anclado en
     * `America/Mexico_City`, y un `date_trunc('week', …)` aquí sería una segunda definición de
     * semana en el producto. Ya hubo que arreglar exactamente eso una vez.
     *
     * `COUNT(*)` y no `COUNT(DISTINCT cycle_date)`: el aporte es la repetición, y el único tope lo
     * pone `uq_habit_repetitions_local_cycle` — un pilar aporta una vez al día.
     */
    const result = await db.execute(sql`
      SELECT u.username AS alias,
             COUNT(*) FILTER (
               WHERE r.cycle_date >= ${start}::date AND r.cycle_date < ${end}::date
             )::int AS weekly_repetitions,
             array_agg(DISTINCT r.cycle_date::text ORDER BY r.cycle_date::text) AS practice_dates
      FROM habit_league_opt_ins o
      JOIN users u ON u.id = o.user_id
      JOIN habit_repetitions r ON r.user_id = o.user_id
      WHERE o.withdrawn_at IS NULL
        AND u.username IS NOT NULL
      GROUP BY u.id, u.username
    `);
    return result.rows.map((row) => ({
      alias: String(row.alias),
      weeklyRepetitions: Number(row.weekly_repetitions),
      practiceDates: row.practice_dates as LocalDate[],
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
