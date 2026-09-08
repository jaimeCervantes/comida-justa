import { describe, expect, it } from "vitest";
import {
  categoryKeyForPracticePillar,
  practiceEvidenceSlug,
} from "./practicePost";

describe("practice posts", () => {
  it.each([
    ["sleep", "sueno_y_descanso"],
    ["nutrition", "alimentacion"],
    ["movement", "movimiento_y_ejercicio"],
    ["mindSpirit", "mente_y_espiritu"],
  ] as const)("uses the %s pillar as the post category", (pillar, category) => {
    expect(categoryKeyForPracticePillar(pillar)).toBe(category);
  });

  it("builds a slug that can repeat the same practice during the day", () => {
    expect(
      practiceEvidenceSlug(
        "sleep-sunset-light",
        new Date("2026-09-06T18:32:41.000Z"),
      ),
    ).toBe("practica-sleep-sunset-light-20260906183241");
  });
});
