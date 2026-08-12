import type {
  CuratedChallengeSlug,
  CuratedHabitPillar,
} from "./curatedChallenges";

export type HabitChallengeExperienceKey =
  | "sleep"
  | "nutrition"
  | "movement"
  | "mind";
export type HabitChallengeTheme = HabitChallengeExperienceKey;
export type HabitMinimumField = "cueCompleted" | "minimumCompleted";

export type HabitChallengeExperience = {
  experienceKey: HabitChallengeExperienceKey;
  slug: CuratedChallengeSlug;
  challengeKey:
    | "sleep-evening-to-morning-v1"
    | "nutrition-one-plant-v1"
    | "movement-two-minutes-v1"
    | "mind-one-connection-v1";
  pillar: CuratedHabitPillar;
  path:
    | "/pilares/sueno"
    | "/pilares/alimentacion"
    | "/pilares/movimiento"
    | "/pilares/mente-espiritu";
  theme: HabitChallengeTheme;
  minimumFields: readonly [HabitMinimumField, HabitMinimumField];
};

export const HABIT_CHALLENGE_EXPERIENCES = {
  sleep: {
    experienceKey: "sleep",
    slug: "sueno",
    challengeKey: "sleep-evening-to-morning-v1",
    pillar: "sleep",
    path: "/pilares/sueno",
    theme: "sleep",
    minimumFields: ["cueCompleted", "minimumCompleted"],
  },
  nutrition: {
    experienceKey: "nutrition",
    slug: "alimentacion",
    challengeKey: "nutrition-one-plant-v1",
    pillar: "nutrition",
    path: "/pilares/alimentacion",
    theme: "nutrition",
    minimumFields: ["cueCompleted", "minimumCompleted"],
  },
  movement: {
    experienceKey: "movement",
    slug: "movimiento",
    challengeKey: "movement-two-minutes-v1",
    pillar: "movement",
    path: "/pilares/movimiento",
    theme: "movement",
    minimumFields: ["cueCompleted", "minimumCompleted"],
  },
  mind: {
    experienceKey: "mind",
    slug: "mente-espiritu",
    challengeKey: "mind-one-connection-v1",
    pillar: "mind",
    path: "/pilares/mente-espiritu",
    theme: "mind",
    minimumFields: ["cueCompleted", "minimumCompleted"],
  },
} as const satisfies Record<
  HabitChallengeExperienceKey,
  HabitChallengeExperience
>;

export function findHabitChallengeExperience(
  candidate: string,
): HabitChallengeExperience | null {
  return (
    Object.values(HABIT_CHALLENGE_EXPERIENCES).find(
      ({ experienceKey, slug, challengeKey }) =>
        candidate === experienceKey ||
        candidate === slug ||
        candidate === challengeKey,
    ) ?? null
  );
}
