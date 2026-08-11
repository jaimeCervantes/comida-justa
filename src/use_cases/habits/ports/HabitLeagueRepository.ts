import type { LeagueParticipantActivity } from "~/domain/habits/habitLeague";

export interface HabitLeagueRepository {
  readWeeklyParticipants(
    start: Date,
    end: Date,
  ): Promise<LeagueParticipantActivity[]>;
  readViewer(
    userId: string,
  ): Promise<{ alias: string | null; optedIn: boolean }>;
  setOptIn(userId: string, enabled: boolean): Promise<void>;
}
