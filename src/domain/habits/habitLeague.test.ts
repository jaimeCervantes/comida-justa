import { describe, expect, it } from "vitest";
import { currentCommunityWeek, openCommunityWeek } from "./habitChallenge";
import {
  buildGardenContributions,
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

  /**
   * La tabla del jardín ordena por aporte y **no reparte puestos**: no hay `rank`, no hay corona y
   * no hay premio. Quien quiera saber su posición la lee del orden.
   */
  it("orders by contribution, then by sustained weeks, then by alias", () => {
    expect(
      buildGardenContributions([
        {
          alias: "sol",
          weeklyRepetitions: 3,
          practiceDates: ["2026-08-10"],
        },
        {
          alias: "ana",
          weeklyRepetitions: 7,
          practiceDates: ["2026-08-10", "2026-08-17", "2026-08-24"],
        },
        {
          alias: "luz",
          weeklyRepetitions: 3,
          practiceDates: ["2026-08-10", "2026-08-17"],
        },
      ]),
    ).toEqual([
      { alias: "ana", contributions: 7, sustainedWeeks: 3 },
      { alias: "luz", contributions: 3, sustainedWeeks: 2 },
      { alias: "sol", contributions: 3, sustainedWeeks: 1 },
    ]);
  });

  it("desempata por alias cuando el aporte y las semanas coinciden", () => {
    // Sin este orden estable, dos personas iguales se intercambiaban de sitio en cada recarga.
    const [first, second] = buildGardenContributions([
      { alias: "zoe", weeklyRepetitions: 4, practiceDates: ["2026-08-10"] },
      { alias: "abril", weeklyRepetitions: 4, practiceDates: ["2026-08-10"] },
    ]);

    expect([first.alias, second.alias]).toEqual(["abril", "zoe"]);
  });

  /**
   * El cambio que hace que la tabla sirva: antes se contaban **días distintos**, con techo 7, y
   * veinte personas empataban para siempre. Ahora se cuentan aportes, y el único tope lo pone la
   * base: un pilar aporta una vez al día.
   */
  it("cuenta aportes y no días, para que la tabla tenga con qué moverse", () => {
    const [ana, luz] = buildGardenContributions([
      {
        alias: "ana",
        weeklyRepetitions: 12,
        practiceDates: ["2026-08-10", "2026-08-11", "2026-08-12"],
      },
      {
        alias: "luz",
        weeklyRepetitions: 3,
        practiceDates: ["2026-08-10", "2026-08-11", "2026-08-12"],
      },
    ]);

    // Practicaron los mismos tres días; ana practicó más pilares cada uno de ellos.
    expect(ana.contributions).toBeGreaterThan(luz.contributions);
    expect(ana.sustainedWeeks).toBe(luz.sustainedWeeks);
  });

  /**
   * Faltar una semana no borra nada. `countSustainedWeeks` lo dice en su propio docblock: una racha
   * castigaría justo a quien regresó, que es lo contrario de todo lo demás de esta práctica.
   */
  it("un hueco de semanas no baja las semanas sostenidas", () => {
    const [entry] = buildGardenContributions([
      {
        alias: "ana",
        weeklyRepetitions: 1,
        // Dos semanas seguidas, un mes de hueco, y la de vuelta.
        practiceDates: ["2026-08-10", "2026-08-17", "2026-09-21"],
      },
    ]);

    expect(entry.sustainedWeeks).toBe(3);
  });
});
