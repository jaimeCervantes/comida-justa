import { describe, expect, it } from "vitest";
import {
  buildWeeklyLeagueRanking,
  createUtcLeagueWeek,
  evaluateLeagueEligibility,
} from "./habitLeague";

describe("weekly habit league", () => {
  it.each([
    [0, "conditioned"],
    [9, "conditioned"],
    [10, "eligible"],
    [11, "eligible"],
  ] as const)("evaluates %s weekly active opt-ins as %s", (count, expected) => {
    expect(evaluateLeagueEligibility(count)).toBe(expected);
  });

  it("uses a weekly [Monday UTC, next Monday UTC) reset", () => {
    expect(createUtcLeagueWeek(new Date("2026-08-13T16:30:00Z"))).toEqual({
      start: new Date("2026-08-10T00:00:00Z"),
      end: new Date("2026-08-17T00:00:00Z"),
    });
  });

  it("caps consistency at one point per date and shares ties", () => {
    expect(
      buildWeeklyLeagueRanking([
        {
          alias: "ana",
          activeDates: ["2026-08-10", "2026-08-10", "2026-08-11"],
        },
        { alias: "luz", activeDates: ["2026-08-10", "2026-08-12"] },
        { alias: "sol", activeDates: ["2026-08-10"] },
      ]),
    ).toEqual([
      { alias: "ana", score: 2, rank: 1 },
      { alias: "luz", score: 2, rank: 1 },
      { alias: "sol", score: 1, rank: 2 },
    ]);
  });
});
