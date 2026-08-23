import { describe, expect, it } from "vitest";
import { currentCommunityWeek, openCommunityWeek } from "./habitChallenge";
import {
  buildWeeklyLeagueRanking,
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

  it.each([
    [
      "2026-08-20T18:00:00Z",
      "2026-08-17",
      "2026-08-24",
      "un jueves cualquiera",
    ],
    [
      "2026-08-24T00:30:00Z",
      "2026-08-17",
      "2026-08-24",
      "en UTC ya es lunes, en México sigue siendo domingo",
    ],
    [
      "2026-08-24T06:30:00Z",
      "2026-08-24",
      "2026-08-31",
      "pasada la medianoche mexicana sí abre la nueva",
    ],
  ])(
    "resets on the community Monday, not on UTC's: %s → [%s, %s) — %s",
    (instant, startDate, endDate) => {
      expect(currentCommunityWeek(new Date(instant))).toEqual({
        startDate,
        endDate,
      });
    },
  );

  /**
   * La razón de ser del slice: había dos semanas. La de la liga anclaba el lunes en UTC y la de la
   * práctica en México, así que discrepaban seis horas cada domingo por la tarde. Esta prueba se
   * cae si alguien vuelve a separarlas.
   */
  it("closes on the same day the practice window closes", () => {
    const mondayNoonInMexico = new Date("2026-08-17T18:00:00Z");

    expect(currentCommunityWeek(mondayNoonInMexico).endDate).toBe(
      openCommunityWeek(mondayNoonInMexico, "America/Mexico_City").endDate,
    );
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
