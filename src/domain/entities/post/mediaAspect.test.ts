import { describe, expect, it } from "vitest";
import { hasKnownAspect, mediaAspectRatio } from "./mediaAspect";

describe("mediaAspectRatio", () => {
  /* Los tamaños son los reales de la base, medidos el 2026-08-08: nueve verticales a 0.75, una a
     0.67 y cinco apaisadas a 1.33. */
  it.each([
    [1200, 1600, 0.75],
    [1536, 2048, 0.75],
    [810, 1080, 0.75],
    [774, 1161, 0.666],
    [1600, 1200, 1.333],
    [1195, 896, 1.333],
  ])("%ix%i da una proporción de %f", (width, height, expected) => {
    expect(mediaAspectRatio({ width, height })).toBeCloseTo(expected, 2);
  });

  /* Una sola dimensión no da proporción, y usarla a medias inventaría la que falta: justo la
     mentira que esta entrega viene a quitar. */
  it.each([
    [1200, null],
    [null, 1600],
    [null, null],
    [1200, undefined],
    [undefined, 1600],
  ])("no afirma nada con %j x %j", (width, height) => {
    expect(mediaAspectRatio({ width, height })).toBeNull();
  });

  // El CHECK de la migración lo impide en la base, pero esto también lo pintan fixtures.
  it.each([
    [0, 1600],
    [1200, 0],
    [-100, 1600],
  ])("descarta %i x %i, que daría una división por cero", (width, height) => {
    expect(mediaAspectRatio({ width, height })).toBeNull();
  });
});

describe("hasKnownAspect", () => {
  it("es cierto solo cuando se pueden afirmar las dos", () => {
    expect(hasKnownAspect({ width: 1200, height: 1600 })).toBe(true);
    expect(hasKnownAspect({ width: 1200 })).toBe(false);
    expect(hasKnownAspect({})).toBe(false);
  });
});
