import { currentCommunityWeek } from "~/domain/habits/habitChallenge";
import {
  buildGardenContributions,
  evaluateLeagueEligibility,
  type GardenContributor,
  MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS,
} from "~/domain/habits/habitLeague";
import type { HabitLeagueRepository } from "./ports/HabitLeagueRepository";

/**
 * Quiénes hicieron crecer el jardín esta semana.
 *
 * `contributors` sustituye al `ranking` anterior: la misma gente, ordenada igual, sin puesto
 * proclamado. Sigue detrás del mismo umbral y del mismo consentimiento — aparecer con nombre en una
 * pantalla pública es una decisión, no un efecto secundario de practicar.
 */
export type HabitLeagueState = {
  activeOptIns: number;
  threshold: number;
  eligible: boolean;
  contributors: GardenContributor[];
  viewerAlias: string | null;
  viewerOptedIn: boolean;
};

export default class HabitLeagueUseCase {
  constructor(private readonly repository: HabitLeagueRepository) {}

  async getState(
    viewerId: string | null,
    now: Date = new Date(),
  ): Promise<HabitLeagueState> {
    const week = currentCommunityWeek(now);
    const [participants, viewer] = await Promise.all([
      this.repository.readWeeklyParticipants(week.startDate, week.endDate),
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
      contributors: eligible ? buildGardenContributions(participants) : [],
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
