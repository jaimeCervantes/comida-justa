import { describe, expect, it } from "vitest";
import {
  buildPeriodHabitProgress,
  createLocalChallengePeriod,
  evaluateCycleDate,
  evaluateHabitCheckIn,
  firstCycleProgress,
  isPublicCelebration,
  recognizeCycleCompletion,
  SLEEP_CHALLENGE_KEY,
} from "./habitChallenge";

describe("the rules every habit ritual shares", () => {
  it("uses a versioned key so changing the ritual does not rewrite old progress", () => {
    expect(SLEEP_CHALLENGE_KEY).toBe("sleep-evening-to-morning-v1");
  });

  it.each([
    { cueCompleted: true, minimumCompleted: true, expected: "completed" },
    { cueCompleted: true, minimumCompleted: false, expected: "incomplete" },
    { cueCompleted: false, minimumCompleted: true, expected: "incomplete" },
    { cueCompleted: false, minimumCompleted: false, expected: "incomplete" },
  ] as const)(
    "returns $expected for cue=$cueCompleted and minimum=$minimumCompleted",
    ({ cueCompleted, minimumCompleted, expected }) => {
      expect(evaluateHabitCheckIn({ cueCompleted, minimumCompleted })).toBe(
        expected,
      );
    },
  );

  it("turns the first completed cycle into one sprout and ten XP", () => {
    expect(firstCycleProgress(true)).toEqual({
      level: "sprout",
      xp: 10,
      badge: "first-step",
    });
  });

  it("keeps an attempt without a cycle as a seed with no invented reward", () => {
    expect(firstCycleProgress(false)).toEqual({
      level: "seed",
      xp: 0,
      badge: null,
    });
  });

  it.each([
    ["absent", false],
    ["active", true],
    ["withdrawn", false],
  ] as const)("projects celebration %s as public=%s", (status, expected) => {
    expect(isPublicCelebration(status)).toBe(expected);
  });

  it("creates seven local calendar days under the [start, end) contract", () => {
    expect(
      createLocalChallengePeriod(
        new Date("2026-08-11T04:30:00Z"),
        "America/Mexico_City",
      ),
    ).toEqual({
      startDate: "2026-08-10",
      endDate: "2026-08-17",
      timezone: "America/Mexico_City",
    });
  });

  it.each([
    ["2026-08-05", "outside-period"],
    ["2026-08-06", "available"],
    ["2026-08-09", "available"],
    ["2026-08-10", "available"],
    ["2026-08-11", "future"],
    ["2026-08-13", "outside-period"],
  ] as const)("evaluates morning date %s as %s", (cycleDate, expected) => {
    expect(
      evaluateCycleDate({
        cycleDate,
        period: {
          startDate: "2026-08-06",
          endDate: "2026-08-13",
          timezone: "America/Mexico_City",
        },
        now: new Date("2026-08-10T14:00:00Z"),
      }),
    ).toBe(expected);
  });

  it("recognizes a return after one empty local day without resetting progress", () => {
    expect(
      recognizeCycleCompletion(
        ["2026-08-06", "2026-08-07"],
        "2026-08-09",
        true,
      ),
    ).toBe("comeback");
  });

  it("caps XP at ten per distinct cycle and succeeds at five of seven", () => {
    expect(
      buildPeriodHabitProgress({
        completedDates: [
          "2026-08-06",
          "2026-08-07",
          "2026-08-09",
          "2026-08-10",
          "2026-08-11",
        ],
        period: {
          startDate: "2026-08-06",
          endDate: "2026-08-13",
          timezone: "America/Mexico_City",
        },
      }),
    ).toEqual({
      level: "harvest",
      xp: 50,
      badge: "harvest",
      completedCycles: 5,
      targetCycles: 5,
      totalDays: 7,
      completedDates: [
        "2026-08-06",
        "2026-08-07",
        "2026-08-09",
        "2026-08-10",
        "2026-08-11",
      ],
      period: {
        startDate: "2026-08-06",
        endDate: "2026-08-13",
        timezone: "America/Mexico_City",
      },
      succeeded: true,
    });
  });
});
