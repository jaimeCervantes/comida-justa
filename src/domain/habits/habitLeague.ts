export const MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS = 10;

export type LeagueEligibility = "conditioned" | "eligible";
export type LeagueParticipantActivity = {
  alias: string;
  activeDates: string[];
};
export type LeagueRankingEntry = {
  alias: string;
  score: number;
  rank: number;
};

export function evaluateLeagueEligibility(
  activeOptIns: number,
): LeagueEligibility {
  return activeOptIns >= MINIMUM_WEEKLY_LEAGUE_PARTICIPANTS
    ? "eligible"
    : "conditioned";
}

export function createUtcLeagueWeek(now: Date): { start: Date; end: Date } {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export function buildWeeklyLeagueRanking(
  participants: LeagueParticipantActivity[],
): LeagueRankingEntry[] {
  const scored = participants
    .map(({ alias, activeDates }) => ({
      alias,
      score: new Set(activeDates).size,
    }))
    .sort(
      (left, right) =>
        right.score - left.score || left.alias.localeCompare(right.alias),
    );
  let rank = 0;
  let previousScore: number | null = null;
  return scored.map((entry) => {
    if (entry.score !== previousScore) rank += 1;
    previousScore = entry.score;
    return { ...entry, rank };
  });
}
