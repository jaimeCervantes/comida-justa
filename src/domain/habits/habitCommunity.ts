export type HabitPillar = "sleep" | "nutrition" | "movement" | "mind";
export type CelebrationReactionIntent = "celebrate" | "withdraw";
export type HabitCelebrationMilestone = "first_cycle" | "challenge_completed";

export type CommunityGarden = Record<HabitPillar, number> & { total: number };

const PILLAR_BY_CHALLENGE: Readonly<Record<string, HabitPillar>> = {
  "sleep-evening-to-morning-v1": "sleep",
  "nutrition-one-plant-v1": "nutrition",
  "movement-two-minutes-v1": "movement",
  "mind-one-connection-v1": "mind",
};

export function buildCommunityGarden(
  rows: Array<{ challengeKey: string; repetitions: number }>,
): CommunityGarden {
  const garden: CommunityGarden = {
    sleep: 0,
    nutrition: 0,
    movement: 0,
    mind: 0,
    total: 0,
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
