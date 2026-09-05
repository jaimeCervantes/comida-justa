import type { LocalDate } from "~/domain/habits/habitChallenge";
import type { LeagueParticipantActivity } from "~/domain/habits/habitLeague";

export interface HabitLeagueRepository {
  /**
   * Los límites son fechas locales y no instantes, porque lo que se filtra es `cycle_date`: el día
   * que alguien practicó, no el instante en que lo escribió. Con `Date` había que convertir en el
   * adaptador, y esa conversión es justo donde se colaba el desfase de husos.
   */
  /**
   * Devuelve, por cada persona que aceptó aparecer, sus aportes de la semana pedida **y todas** sus
   * fechas de práctica. Las segundas no se recortan a la semana: las semanas sostenidas son
   * históricas, y quien vuelve tras un mes tiene que seguir viéndolas.
   */
  readWeeklyParticipants(
    start: LocalDate,
    end: LocalDate,
  ): Promise<LeagueParticipantActivity[]>;
  readViewer(
    userId: string,
  ): Promise<{ alias: string | null; optedIn: boolean }>;
  setOptIn(userId: string, enabled: boolean): Promise<void>;
}
