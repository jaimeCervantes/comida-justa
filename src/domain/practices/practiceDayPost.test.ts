import { describe, expect, it } from "vitest";
import { practiceDaySlug, ritualPracticeKey } from "./practiceDayPost";

const BASE = {
  practiceKey: "sleep-mental-unload",
  cycleDate: "2026-09-07",
  userId: "44pZIIJ5w1vSYkDQ6gfb",
};

describe("el slug de una práctica del día", () => {
  it("lo forma con la práctica y el día, bajo el prefijo de práctica", () => {
    expect(practiceDaySlug(BASE)).toMatch(
      /^practica-sleep-mental-unload-2026-09-07-[a-z0-9]+$/,
    );
  });

  /* Es el mecanismo antiduplicado: mismo día y misma práctica, mismo slug. */
  it("repite el mismo slug para la misma práctica el mismo día", () => {
    expect(practiceDaySlug(BASE)).toBe(practiceDaySlug(BASE));
  });

  it.each([
    ["otro día", { cycleDate: "2026-09-08" }],
    ["otra práctica del mismo pilar", { practiceKey: "sleep-dark-room" }],
    ["otra persona", { userId: "150x3KyEVlKMihef8sjP" }],
  ])("y uno distinto para %s", (_caso, diferencia) => {
    expect(practiceDaySlug({ ...BASE, ...diferencia })).not.toBe(
      practiceDaySlug(BASE),
    );
  });

  /* El slug es una URL pública: el id de la cuenta no viaja en ella. */
  it("no lleva el id de la cuenta a la URL", () => {
    expect(practiceDaySlug(BASE)).not.toContain(BASE.userId);
  });

  it("el ritual de un pilar publica bajo su propia clave", () => {
    expect(ritualPracticeKey("mind-one-connection-v1")).toBe(
      "ritual-mind-one-connection-v1",
    );
    expect(
      practiceDaySlug({ ...BASE, practiceKey: ritualPracticeKey("mind-v1") }),
    ).toContain("practica-ritual-mind-v1-");
  });
});
