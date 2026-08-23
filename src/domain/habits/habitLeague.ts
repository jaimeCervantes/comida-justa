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

/*
 * La semana de la liga **ya no se calcula aquí**. Vivía en `createUtcLeagueWeek`, que anclaba el
 * lunes en UTC: para alguien en México esa semana cerraba a las 18:00 del domingo, seis horas antes
 * que la de la práctica. Dos semanas distintas en el mismo producto significan que el jardín y la
 * clasificación pueden contar días distintos como «esta semana».
 *
 * Ahora la define `currentCommunityWeek` en `habitChallenge.ts`, y la liga la usa igual que la
 * práctica. Lo que queda aquí son las reglas que sí son de la liga: cuánta gente hace falta y cómo
 * se ordena.
 */

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
