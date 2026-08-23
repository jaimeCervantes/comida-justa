export type HabitPillar = "sleep" | "nutrition" | "movement" | "mind";
export type CelebrationReactionIntent = "celebrate" | "withdraw";
export type HabitCelebrationMilestone = "first_cycle" | "challenge_completed";

/**
 * El jardín: lo cultivado por pilar, el total, y cuánta gente está practicando **esta semana**.
 *
 * Los canteros cuentan toda la historia y el pulso cuenta la semana en curso, a propósito. Un número
 * que solo crece deja de decir nada —nadie sabe si la comunidad sigue viva—, y uno que se reinicia
 * cada lunes borra lo cultivado. El jardín necesita las dos lecturas: lo que hay y lo que está
 * pasando.
 */
export type CommunityGarden = Record<HabitPillar, number> & {
  total: number;
  weeklyPractitioners: number;
};

const PILLAR_BY_CHALLENGE: Readonly<Record<string, HabitPillar>> = {
  "sleep-evening-to-morning-v1": "sleep",
  "nutrition-one-plant-v1": "nutrition",
  "movement-two-minutes-v1": "movement",
  "mind-one-connection-v1": "mind",
};

export function buildCommunityGarden(
  rows: Array<{ challengeKey: string; repetitions: number }>,
  weeklyPractitioners = 0,
): CommunityGarden {
  const garden: CommunityGarden = {
    sleep: 0,
    nutrition: 0,
    movement: 0,
    mind: 0,
    total: 0,
    weeklyPractitioners,
  };
  for (const row of rows) {
    const pillar = PILLAR_BY_CHALLENGE[row.challengeKey];
    if (!pillar) continue;
    garden[pillar] += row.repetitions;
    garden.total += row.repetitions;
  }
  return garden;
}

export function applyCelebrationReactionIntent(
  _current: boolean,
  intent: CelebrationReactionIntent,
): boolean {
  return intent === "celebrate";
}

export function canPublishHabitCelebration(
  completedRepetitions: number,
  milestone: HabitCelebrationMilestone,
): boolean {
  return completedRepetitions >= (milestone === "challenge_completed" ? 5 : 1);
}
