import { describe, expect, it } from "vitest";
import {
  findHabitChallengeExperience,
  HABIT_CHALLENGE_EXPERIENCES,
} from "./habitChallengeExperiences";

describe("habit challenge experiences", () => {
  it("keeps Sleep inside its pillar instead of a separate Habits route", () => {
    expect(findHabitChallengeExperience("sueno")).toMatchObject({
      challengeKey: "sleep-evening-to-morning-v1",
      pillar: "sleep",
      path: "/pilares/sueno",
      theme: "sleep",
    });
  });

  it("defines Nutrition as a closed experience distinct from Sleep", () => {
    expect(findHabitChallengeExperience("alimentacion")).toMatchObject({
      challengeKey: "nutrition-one-plant-v1",
      pillar: "nutrition",
      path: "/pilares/alimentacion",
      theme: "nutrition",
      minimumFields: ["cueCompleted", "minimumCompleted"],
    });
    expect(HABIT_CHALLENGE_EXPERIENCES.nutrition).not.toEqual(
      HABIT_CHALLENGE_EXPERIENCES.sleep,
    );
  });

  it("resolves only known challenge keys", () => {
    expect(findHabitChallengeExperience("nutrition-one-plant-v1")?.slug).toBe(
      "alimentacion",
    );
    expect(findHabitChallengeExperience("invented-challenge-v1")).toBeNull();
  });

  it("defines Movement with the shared two-field check-in", () => {
    expect(findHabitChallengeExperience("movimiento")).toMatchObject({
      challengeKey: "movement-two-minutes-v1",
      pillar: "movement",
      path: "/pilares/movimiento",
      theme: "movement",
      minimumFields: ["cueCompleted", "minimumCompleted"],
    });
  });

  it("defines Mind and Spirit without a recipient-response field", () => {
    expect(findHabitChallengeExperience("mente-espiritu")).toMatchObject({
      challengeKey: "mind-one-connection-v1",
      pillar: "mind",
      path: "/pilares/mente-espiritu",
      theme: "mind",
      minimumFields: ["cueCompleted", "minimumCompleted"],
    });
  });
});

/**
 * El mapeo pilar → raíz del catálogo, como corrida de escritorio.
 *
 * Es la tabla que decide qué se le ofrece de la zona a quien acaba de leer un ritual. Una errata
 * aquí no revienta nada: devuelve cero filas, y eso se ve **exactamente igual** que "todavía no hay
 * nadie registrado cerca", que es hoy el estado legítimo de tres de los cuatro pilares. Por eso se
 * afirma fila por fila en vez de confiar en que la página se vea bien.
 */
describe("la categoría del catálogo de cada pilar", () => {
  it.each([
    ["sleep", "sueno_y_descanso"],
    ["nutrition", "alimentacion"],
    ["movement", "movimiento_y_ejercicio"],
    ["mind", "mente_y_espiritu"],
  ] as const)("%s ofrece lo publicado en %s", (experience, categoryKey) => {
    expect(HABIT_CHALLENGE_EXPERIENCES[experience].categoryKey).toBe(
      categoryKey,
    );
  });

  it("no le da la misma categoría a dos pilares", () => {
    const keys = Object.values(HABIT_CHALLENGE_EXPERIENCES).map(
      (experience) => experience.categoryKey,
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});
