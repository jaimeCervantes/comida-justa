import { describe, expect, it } from "vitest";
import { alsoServes, type PracticeCard, primaryPillarOf } from "./practiceCard";

function practice(pillars: PracticeCard["pillars"]): PracticeCard {
  return {
    key: "mind-slow-breathing",
    title: "Respiración pausada",
    summary: "Una sesión de respiración lenta sube el tono vagal.",
    cue: "Cuando notes que se te aprieta el pecho.",
    minimum: "Cuatro respiraciones lentas.",
    effortMinutes: 5,
    costLevel: 0,
    pillars,
    studyCount: 2,
    challengeKey: null,
  };
}

describe("los pilares de una práctica", () => {
  it("el primero es el suyo", () => {
    expect(primaryPillarOf(practice(["mindSpirit", "sleep"]))).toBe(
      "mindSpirit",
    );
  });

  it("los demás son los puentes que enseña la tarjeta", () => {
    expect(alsoServes(practice(["mindSpirit", "sleep"]))).toEqual(["sleep"]);
  });

  it("una práctica de un solo pilar no anuncia puentes", () => {
    expect(alsoServes(practice(["sleep"]))).toEqual([]);
  });
});
