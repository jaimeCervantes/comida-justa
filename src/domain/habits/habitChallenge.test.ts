import { describe, expect, it } from "vitest";
import {
  buildPeriodHabitProgress,
  countSustainedWeeks,
  evaluateCycleDate,
  evaluateHabitCheckIn,
  firstCycleProgress,
  type HabitChallengePeriod,
  isPeriodClosed,
  isPublicCelebration,
  listPeriodDates,
  openCommunityWeek,
  periodTarget,
  recognizeCycleCompletion,
  resolveOpenPeriod,
  SLEEP_CHALLENGE_KEY,
} from "./habitChallenge";

const inMexico = (
  startDate: string,
  endDate: string,
): HabitChallengePeriod => ({
  startDate,
  endDate,
  timezone: "America/Mexico_City",
});

/** Mediodía en México, para que la fecha local nunca dependa del huso del CI. */
const noonInMexico = (localDate: string): Date =>
  new Date(`${localDate}T18:00:00Z`);

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

  it("opens the window on the day someone joins and closes it on the community Monday", () => {
    expect(
      openCommunityWeek(
        new Date("2026-08-11T04:30:00Z"),
        "America/Mexico_City",
      ),
    ).toEqual(inMexico("2026-08-10", "2026-08-17"));
  });

  it.each([
    ["2026-08-17", "2026-08-24", "el lunes recién empezado abre siete días"],
    ["2026-08-20", "2026-08-24", "el jueves solo alcanza a los que quedan"],
    ["2026-08-23", "2026-08-24", "el domingo es el último día, no el cierre"],
    ["2026-08-24", "2026-08-31", "el lunes siguiente vuelve a abrir siete"],
  ])(
    "closes the window joined on %s at the Monday %s: %s",
    (joinedOn, endDate) => {
      expect(
        openCommunityWeek(noonInMexico(joinedOn), "America/Mexico_City"),
      ).toEqual(inMexico(joinedOn, endDate));
    },
  );

  it("gives someone whose Monday arrived before Mexico's a full week of their own", () => {
    expect(
      openCommunityWeek(new Date("2026-08-24T02:00:00Z"), "Asia/Tokyo"),
    ).toEqual({
      startDate: "2026-08-24",
      endDate: "2026-08-31",
      timezone: "Asia/Tokyo",
    });
  });

  it.each([
    ["2026-08-20", false, "a media semana la ventana sigue abierta"],
    ["2026-08-23", false, "el domingo todavía cuenta"],
    ["2026-08-24", true, "el fin es exclusivo: el lunes ya cerró"],
  ])("reads the window [17, 24) on %s as closed=%s", (today, expected) => {
    expect(
      isPeriodClosed(inMexico("2026-08-17", "2026-08-24"), noonInMexico(today)),
    ).toBe(expected);
  });

  it.each([
    {
      stored: null,
      today: "2026-08-23",
      expected: inMexico("2026-08-23", "2026-08-24"),
      reason: "primera vez: entro a lo que queda de la semana en curso",
    },
    {
      stored: inMexico("2026-08-11", "2026-08-18"),
      today: "2026-08-23",
      expected: inMexico("2026-08-23", "2026-08-24"),
      reason: "la semana guardada ya cerró",
    },
    {
      stored: inMexico("2026-08-17", "2026-08-24"),
      today: "2026-08-20",
      expected: inMexico("2026-08-17", "2026-08-24"),
      reason: "a media semana no se reinicia: no es el botón de borrar",
    },
    {
      stored: inMexico("2026-08-17", "2026-08-24"),
      today: "2026-08-24",
      expected: inMexico("2026-08-24", "2026-08-31"),
      reason: "el lunes siguiente sí abre una nueva",
    },
  ])(
    "resolves the window to practise with: $reason",
    ({ stored, today, expected }) => {
      expect(
        resolveOpenPeriod({
          stored,
          now: noonInMexico(today),
          timezone: "America/Mexico_City",
        }),
      ).toEqual(expected);
    },
  );

  it.each([
    ["2026-08-17", "2026-08-24", 7, 5, "la semana entera perdona dos días"],
    ["2026-08-19", "2026-08-24", 5, 4, "cinco días conservan un margen"],
    ["2026-08-20", "2026-08-24", 4, 3, "cuatro días no piden perfección"],
    ["2026-08-22", "2026-08-24", 2, 1, "dos días piden uno"],
    ["2026-08-23", "2026-08-24", 1, 1, "un día pide uno, nunca cero"],
  ])(
    "asks for %s→%s (%i days) a target of %i: %s",
    (startDate, endDate, days, target) => {
      const period = inMexico(startDate, endDate);
      expect(listPeriodDates(period)).toHaveLength(days);
      expect(periodTarget(period)).toBe(target);
    },
  );

  it.each([
    { dates: [], weeks: 0, reason: "sin práctica no hay semana" },
    {
      dates: ["2026-08-18", "2026-08-20"],
      weeks: 1,
      reason: "dos días de la misma semana son una",
    },
    {
      dates: ["2026-08-11", "2026-08-18"],
      weeks: 2,
      reason: "semanas consecutivas",
    },
    {
      dates: ["2026-08-11", "2026-08-25"],
      weeks: 2,
      reason: "un hueco no borra la anterior: no es una racha",
    },
    {
      dates: ["2026-08-16", "2026-08-17"],
      weeks: 2,
      reason: "domingo y lunes caen en semanas distintas",
    },
  ])("counts sustained weeks: $reason", ({ dates, weeks }) => {
    expect(countSustainedWeeks(dates)).toBe(weeks);
  });

  it("never lets a gap take a sustained week away", () => {
    const withoutGap = countSustainedWeeks(["2026-08-11", "2026-08-18"]);
    const withGap = countSustainedWeeks([
      "2026-08-11",
      "2026-08-18",
      "2026-09-08",
    ]);

    expect(withGap).toBeGreaterThan(withoutGap);
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

  /**
   * Afirma lo que dice su nombre y no la forma entera del objeto.
   *
   * Era un `toEqual` exhaustivo y se rompió tres veces seguidas —`repetitions`, `sustainedWeeks` y
   * antes `targetCycles`—, siempre por un campo **añadido** y ninguna por un fallo. Un objeto que
   * crece no es una regresión, y una prueba que hay que editar cada vez que crece cuesta más de lo
   * que protege. Cada campo nuevo trae su propia prueba, que es donde se afirma lo suyo.
   */
  it("caps XP at ten per distinct cycle and succeeds at five of seven", () => {
    const cycles = [
      "2026-08-06",
      "2026-08-07",
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
    ];

    expect(
      buildPeriodHabitProgress({
        completedDates: [...cycles, "2026-08-11"],
        period: inMexico("2026-08-06", "2026-08-13"),
      }),
    ).toMatchObject({
      xp: 50,
      completedCycles: 5,
      targetCycles: 5,
      completedDates: cycles,
      succeeded: true,
      level: "harvest",
      badge: "harvest",
    });
  });

  it.each([
    {
      period: inMexico("2026-08-10", "2026-08-17"),
      completedCycles: 2,
      completedDates: ["2026-08-11", "2026-08-12"],
      reason: "solo el 11 y el 12 caen en esa semana",
    },
    {
      period: inMexico("2026-08-17", "2026-08-24"),
      completedCycles: 2,
      completedDates: ["2026-08-18", "2026-08-20"],
      reason: "solo el 18 y el 20 caen en la vigente",
    },
  ])(
    "counts the target within the window and the points across the history: $reason",
    ({ period, completedCycles, completedDates }) => {
      const progress = buildPeriodHabitProgress({
        completedDates: [
          "2026-08-11",
          "2026-08-12",
          "2026-08-18",
          "2026-08-20",
        ],
        period,
      });

      expect(progress).toMatchObject({
        completedCycles,
        completedDates,
        succeeded: false,
        xp: 40,
        level: "root",
        badge: "first-step",
      });
    },
  );

  it("does not let a finished week make the next one succeed on arrival", () => {
    const lastWeek = [
      "2026-08-17",
      "2026-08-18",
      "2026-08-19",
      "2026-08-20",
      "2026-08-21",
    ];

    expect(
      buildPeriodHabitProgress({
        completedDates: lastWeek,
        period: inMexico("2026-08-24", "2026-08-31"),
      }),
    ).toMatchObject({
      completedCycles: 0,
      targetCycles: 5,
      succeeded: false,
      xp: 50,
      level: "harvest",
    });
  });
});
