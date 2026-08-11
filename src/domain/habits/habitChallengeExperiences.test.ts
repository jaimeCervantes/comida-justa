import { describe, expect, it } from "vitest";
import {
  findHabitChallengeExperience,
  HABIT_CHALLENGE_EXPERIENCES,
} from "./habitChallengeExperiences";

describe("habit challenge experiences", () => {
  it("defines Nutrition as a closed experience distinct from Sleep", () => {
    expect(findHabitChallengeExperience("alimentacion")).toMatchObject({
      challengeKey: "nutrition-one-plant-v1",
      pillar: "nutrition",
      path: "/habitos/alimentacion",
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
      path: "/habitos/movimiento",
      theme: "movement",
      minimumFields: ["cueCompleted", "minimumCompleted"],
    });
  });

  it("defines Mind and Spirit without a recipient-response field", () => {
    expect(findHabitChallengeExperience("mente-espiritu")).toMatchObject({
      challengeKey: "mind-one-connection-v1",
      pillar: "mind",
      path: "/habitos/mente-espiritu",
      theme: "mind",
      minimumFields: ["cueCompleted", "minimumCompleted"],
    });
  });
});
