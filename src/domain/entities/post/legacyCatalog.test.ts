import { describe, expect, it } from "vitest";
import {
  LEGACY_PRODUCT_ORIGIN,
  legacyCategory,
  legacyLabelToKey,
  legacySubCategory,
  legacyWhatsapp,
} from "./legacyCatalog";

describe("legacy catalog mapping", () => {
  // Escenario "Each legacy product becomes a publication, field by field" (@slice-2)
  describe.each([
    ["Jugo Verde", "Jugos", "jugos"],
    // "Comidas" ya no normaliza a una clave válida: la allowlist la renombró a `platillos`.
    // El alias es lo único que evita que re-migrar deje estos productos sin subcategoría.
    ["Pechuga de pollo asada", "Comidas", "platillos"],
    ["Agua de Avena con canela", "Bebidas", "bebidas"],
  ])("%s", (_name, legacyLabel, expectedKey) => {
    it(`maps sub-category "${legacyLabel}" to "${expectedKey}"`, () => {
      expect(legacySubCategory(legacyLabel)).toBe(expectedKey);
    });
  });

  it("maps the legacy category label to its allowlist key", () => {
    expect(legacyCategory("Alimentación")).toBe("alimentacion");
  });

  it("leaves the category unset when the label is not in the allowlist", () => {
    expect(legacyCategory("Electrónica")).toBeNull();
    expect(legacySubCategory("Postres")).toBeNull();
    expect(legacySubCategory(null)).toBeNull();
  });

  it("strips accents and casing to build the key", () => {
    expect(legacyLabelToKey("Panadería")).toBe("panaderia");
    expect(legacyLabelToKey("  ")).toBeNull();
  });

  describe.each([
    ["2781126948", "522781126948"],
    ["522781126948", "522781126948"],
    ["278 112 6948", "522781126948"],
    ["", null],
    [null, null],
  ])("legacyWhatsapp(%j)", (phone, expected) => {
    it(`is ${JSON.stringify(expected)}`, () => {
      expect(legacyWhatsapp(phone)).toBe(expected);
    });
  });

  it("marks every migrated product as sold by Hazlo Sano", () => {
    expect(LEGACY_PRODUCT_ORIGIN).toBe("hazlo_sano_propio");
  });
});
