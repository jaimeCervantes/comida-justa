import { describe, it, expect } from "vitest";
import {
  POST_CATEGORIES,
  POST_SUB_CATEGORIES,
  isValidCategory,
  isValidSubCategory,
  resolveCategory,
  resolveSubCategory,
} from "./category";

describe("category allowlist", () => {
  it("accepts only the exact keys of the allowlist", () => {
    for (const key of POST_CATEGORIES) {
      expect(isValidCategory(key)).toBe(true);
    }
    for (const key of POST_SUB_CATEGORIES) {
      expect(isValidSubCategory(key)).toBe(true);
    }
  });

  // Escenario "Only allowlist keys are accepted" (@slice-1 @component)
  describe.each([
    ["Alimentación", "label sent instead of the key"],
    ["electronica", "not in the allowlist"],
    ["ALIMENTACION", "allowlist keys are lower-case"],
    ["", "empty string"],
  ])("resolveCategory(%j)", (sent, reason) => {
    it(`stores null — ${reason}`, () => {
      expect(resolveCategory(sent)).toBeNull();
    });
  });

  it("stores the key when it is an exact allowlist match", () => {
    expect(resolveCategory("alimentacion")).toBe("alimentacion");
  });

  it("treats null and undefined as unset", () => {
    expect(resolveCategory(null)).toBeNull();
    expect(resolveCategory(undefined)).toBeNull();
    expect(resolveSubCategory(null)).toBeNull();
    expect(resolveSubCategory(undefined)).toBeNull();
  });

  describe.each([
    ["jugos", "jugos"],
    ["panaderia", "panaderia"],
    ["Jugos", null],
    ["postres", null],
  ])("resolveSubCategory(%j)", (sent, expected) => {
    it(`resolves to ${JSON.stringify(expected)}`, () => {
      expect(resolveSubCategory(sent)).toBe(expected);
    });
  });

  it("rejects non-string values", () => {
    expect(isValidCategory(42)).toBe(false);
    expect(isValidSubCategory({})).toBe(false);
    expect(isValidSubCategory(null)).toBe(false);
  });
});
