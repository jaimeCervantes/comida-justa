import {
  buildWeeklyLeagueRanking,
  createUtcLeagueWeek,
  evaluateLeagueEligibility,
  type LeagueRankingEntry,
  MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS,
} from "~/domain/habits/habitLeague";
import type { HabitLeagueRepository } from "./ports/HabitLeagueRepository";

export type HabitLeagueState = {
  activeOptIns: number;
  threshold: number;
  eligible: boolean;
  ranking: LeagueRankingEntry[];
  viewerAlias: string | null;
  viewerOptedIn: boolean;
};

export default class HabitLeagueUseCase {
  constructor(private readonly repository: HabitLeagueRepository) {}

  async getState(
    viewerId: string | null,
    now: Date = new Date(),
  ): Promise<HabitLeagueState> {
    const week = createUtcLeagueWeek(now);
    const [participants, viewer] = await Promise.all([
      this.repository.readWeeklyParticipants(week.start, week.end),
      viewerId
        ? this.repository.readViewer(viewerId)
        : Promise.resolve({ alias: null, optedIn: false }),
    ]);
    const eligible =
      evaluateLeagueEligibility(participants.length) === "eligible";
    return {
      activeOptIns: participants.length,
      threshold: MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS,
      eligible,
      ranking: eligible ? buildWeeklyLeagueRanking(participants) : [],
      viewerAlias: viewer.alias,
      viewerOptedIn: viewer.optedIn,
    };
  }

  async setOptIn(userId: string, enabled: boolean): Promise<boolean> {
    const viewer = await this.repository.readViewer(userId);
    if (enabled && !viewer.alias) return false;
    await this.repository.setOptIn(userId, enabled);
    return true;
  }
}
