import { describe, expect, it } from "vitest";
import type { CycleRecognition } from "./habitChallenge";
import { publishesRitualPractice } from "./ritualPost";

describe("publicar la práctica de un ritual", () => {
  it.each<[CycleRecognition, boolean]>([
    ["first", true],
    ["repeat", true],
    ["comeback", true],
    ["final", true],
    ["duplicate", false],
  ])("con reconocimiento %s publica: %s", (recognition, publishes) => {
    expect(publishesRitualPractice(recognition)).toBe(publishes);
  });
});
