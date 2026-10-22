import { describe, expect, it } from "vitest";
import {
  BRAND_MAX_LENGTH,
  brandKey,
  normalizeBrand,
  validateBrand,
} from "./brand";

describe("normalizeBrand", () => {
  it.each([
    ["Birdman", "Birdman"],
    ["  E2E   Apis ", "E2E Apis"],
    ["", null],
    ["   ", null],
    [undefined, null],
    [42, null],
  ])("%j → %j", (raw, expected) => {
    expect(normalizeBrand(raw)).toBe(expected);
  });
});

describe("validateBrand", () => {
  it("acepta no tener marca y una marca de largo normal", () => {
    expect(validateBrand(null)).toBeNull();
    expect(validateBrand("Amarosana")).toBeNull();
  });

  it(`rechaza una marca de más de ${BRAND_MAX_LENGTH} caracteres`, () => {
    expect(validateBrand("a".repeat(BRAND_MAX_LENGTH + 1))).toBe(
      "brand-too-long",
    );
  });
});

describe("brandKey", () => {
  it("compara sin distinguir mayúsculas", () => {
    expect(brandKey("Birdman")).toBe(brandKey("birdman"));
  });
});
