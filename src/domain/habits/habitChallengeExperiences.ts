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

/**
 * La raíz del catálogo que le corresponde a cada pilar.
 *
 * No es una coincidencia afortunada: las cuatro raíces de `categories` **son** los cuatro pilares,
 * porque la taxonomía se diseñó con ellos. Escribirlas aquí como unión cerrada es lo que convierte
 * una errata en un fallo de `typecheck` en vez de en una sección vacía en producción — la clave no
 * la valida nadie más hasta que la base responde con cero filas, que es indistinguible de "todavía
 * no hay nadie".
 */
export type PillarCategoryKey =
  | "sueno_y_descanso"
  | "alimentacion"
  | "movimiento_y_ejercicio"
  | "mente_y_espiritu";

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
  /** Qué se le ofrece de la zona a quien acaba de leer este ritual. */
  categoryKey: PillarCategoryKey;
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
    categoryKey: "sueno_y_descanso",
  },
  nutrition: {
    experienceKey: "nutrition",
    slug: "alimentacion",
    challengeKey: "nutrition-one-plant-v1",
    pillar: "nutrition",
    path: "/pilares/alimentacion",
    theme: "nutrition",
    minimumFields: ["cueCompleted", "minimumCompleted"],
    categoryKey: "alimentacion",
  },
  movement: {
    experienceKey: "movement",
    slug: "movimiento",
    challengeKey: "movement-two-minutes-v1",
    pillar: "movement",
    path: "/pilares/movimiento",
    theme: "movement",
    minimumFields: ["cueCompleted", "minimumCompleted"],
    categoryKey: "movimiento_y_ejercicio",
  },
  mind: {
    experienceKey: "mind",
    slug: "mente-espiritu",
    challengeKey: "mind-one-connection-v1",
    pillar: "mind",
    path: "/pilares/mente-espiritu",
    theme: "mind",
    minimumFields: ["cueCompleted", "minimumCompleted"],
    categoryKey: "mente_y_espiritu",
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
