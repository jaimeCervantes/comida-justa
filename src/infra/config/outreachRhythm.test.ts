import { afterEach, describe, expect, it, vi } from "vitest";
import { readOutreachRhythm } from "./outreachRhythm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readOutreachRhythm", () => {
  it("lee las dos variables del entorno", () => {
    expect(
      readOutreachRhythm({
        OUTREACH_DAILY_LIMIT: "15",
        OUTREACH_PAUSE_MINUTES: "5",
      }),
    ).toEqual({ dailyLimit: 15, pauseMinutes: 5 });
  });

  it("sin variables quedan 10 y 10", () => {
    expect(readOutreachRhythm({})).toEqual({
      dailyLimit: 10,
      pauseMinutes: 10,
    });
  });

  // Una errata como «10m» no puede pasar en silencio, ni repetirse en cada visita.
  it("avisa una sola vez en el registro lo que no pudo usar", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const env = { OUTREACH_PAUSE_MINUTES: "10m" };

    expect(readOutreachRhythm(env)).toEqual({
      dailyLimit: 10,
      pauseMinutes: 10,
    });
    readOutreachRhythm(env);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain("pauseMinutes");
  });
});
