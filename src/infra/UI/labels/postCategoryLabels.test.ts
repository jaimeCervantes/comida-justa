import { describe, it, expect } from "vitest";
import {
  categoryLabel,
  subCategoryLabel,
  categoryOptions,
  subCategoryOptions,
} from "./postCategoryLabels";
import { POST_SUB_CATEGORIES } from "~/domain/entities/post/category";

describe("category labels", () => {
  // Escenario "The label follows the visitor's locale, never the database" (@slice-1)
  describe.each([
    ["jugos", "es", "Jugos"],
    ["jugos", "en", "Juices"],
    ["panaderia", "es", "Panadería"],
    ["panaderia", "en", "Bakery"],
    // La repisa de cacahuate, tahini y garbanzo: en inglés es "Spreads", no una traducción literal.
    ["untables", "es", "Untables"],
    ["untables", "en", "Spreads"],
  ] as const)("subCategoryLabel(%j, %j)", (key, locale, expected) => {
    it(`is "${expected}"`, () => {
      expect(subCategoryLabel(key, locale)).toBe(expected);
    });
  });

  it("labels the category in both locales", () => {
    expect(categoryLabel("alimentacion", "es")).toBe("Alimentación");
    expect(categoryLabel("alimentacion", "en")).toBe("Food");
  });

  it("falls back to Spanish for an unknown or missing locale", () => {
    expect(subCategoryLabel("bebidas", "fr")).toBe("Bebidas");
    expect(subCategoryLabel("bebidas")).toBe("Bebidas");
  });

  it("has no label for an unset category", () => {
    expect(categoryLabel(null)).toBeNull();
    expect(subCategoryLabel(undefined)).toBeNull();
  });

  it("offers every allowlist key as an option, in canonical order", () => {
    expect(subCategoryOptions("es").map((o) => o.value)).toEqual([
      ...POST_SUB_CATEGORIES,
    ]);
    expect(categoryOptions("en")).toEqual([
      { value: "alimentacion", label: "Food" },
    ]);
  });
});
