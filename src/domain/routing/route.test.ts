import { describe, expect, it } from "vitest";
import { routeMinutes } from "./route";

describe("routeMinutes", () => {
  it.each([
    [0, 1, "nunca «0 min»"],
    [59, 1, "menos de un minuto sigue siendo uno"],
    [540, 9, "nueve minutos exactos"],
    [541, 10, "hacia arriba: mejor llegar antes"],
  ])("%d s → %d min (%s)", (seconds, expected) => {
    expect(routeMinutes({ durationSeconds: seconds })).toBe(expected);
  });
});
