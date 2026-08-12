import { describe, expect, it } from "vitest";
import {
  applyCelebrationReactionIntent,
  buildCommunityGarden,
  canPublishHabitCelebration,
} from "./habitCommunity";

describe("habit community", () => {
  it("maps shared repetitions to four pillar colors without people or positions", () => {
    expect(
      buildCommunityGarden([
        { challengeKey: "sleep-evening-to-morning-v1", repetitions: 4 },
        { challengeKey: "nutrition-one-plant-v1", repetitions: 3 },
        { challengeKey: "movement-two-minutes-v1", repetitions: 2 },
        { challengeKey: "mind-one-connection-v1", repetitions: 1 },
      ]),
    ).toEqual({ sleep: 4, nutrition: 3, movement: 2, mind: 1, total: 10 });
  });

  it("ignores unknown challenge definitions instead of assigning a false color", () => {
    expect(
      buildCommunityGarden([{ challengeKey: "unknown-v1", repetitions: 99 }]),
    ).toEqual({ sleep: 0, nutrition: 0, movement: 0, mind: 0, total: 0 });
  });

  it.each([
    [false, "celebrate", true],
    [true, "celebrate", true],
    [true, "withdraw", false],
    [false, "withdraw", false],
  ] as const)(
    "applies current=%s intent=%s idempotently as %s",
    (current, intent, expected) => {
      expect(applyCelebrationReactionIntent(current, intent)).toBe(expected);
    },
  );

  it.each([
    [0, "first_cycle", false],
    [1, "first_cycle", true],
    [4, "first_cycle", true],
    [4, "challenge_completed", false],
    [5, "challenge_completed", true],
  ] as const)(
    "allows %i persisted repetitions for milestone %s as %s",
    (completedRepetitions, milestone, expected) => {
      expect(canPublishHabitCelebration(completedRepetitions, milestone)).toBe(
        expected,
      );
    },
  );
});
