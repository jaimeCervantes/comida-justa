import { describe, expect, it } from "vitest";
import {
  LEGACY_PRODUCT_ORIGIN,
  legacyCategory,
  legacyLabelToKey,
  legacySubCategory,
  legacyWhatsapp,
} from "./legacyCatalog";

describe("legacy catalog mapping", () => {
  /**
   * La taxonomía se mudó a la tabla `categories`, así que resolver una etiqueta heredada exige
   * leer la base y ya no puede ser síncrono. Estas funciones conservan su firma para que
   * `migrateProductsToPosts.ts` siga compilando sin tocarlo (la tabla `products` quedó fuera de
   * alcance), pero lanzan: devolver `null` migraría los productos sin categoría **y en silencio**,
   * que es justo el modo de fallo que la tabla vino a eliminar.
   */
  describe.each([
    ["legacyCategory", legacyCategory],
    ["legacySubCategory", legacySubCategory],
  ])("%s", (_name, resolve) => {
    it("throws with instructions instead of silently dropping the category", () => {
      expect(() => resolve("Alimentación")).toThrowError(
        /migrateProductsToPosts\.ts está desactualizado/,
      );
    });

    it("names what to use instead", () => {
      expect(() => resolve("Jugos")).toThrowError(/resolveKeyLenient/);
    });
  });

  // Sigue en uso: normaliza el texto libre de `products`, que no es lo mismo que
  // `normalizeCategoryKey` (esa conserva espacios para coincidir con `category_normalize` en SQL).
  it("strips accents, casing and punctuation to build a legacy key", () => {
    expect(legacyLabelToKey("Panadería")).toBe("panaderia");
    expect(legacyLabelToKey("Sub-categoría")).toBe("subcategoria");
    expect(legacyLabelToKey("  ")).toBeNull();
    expect(legacyLabelToKey(null)).toBeNull();
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
