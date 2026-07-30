import { describe, it, expect } from "vitest";
import { validateNewCategory } from "./newCategory";
import { makeTaxonomy } from "./__fixtures__/categoryTaxonomy";

const taxonomy = makeTaxonomy();

const valid = {
  key: "conservas",
  parentKey: "alimentacion",
  labels: { es: "Conservas", en: "Preserves" },
};

/**
 * Lo que se puede dar de alta desde `/admin/catalogo`.
 *
 * La base ya rechaza lo imposible —el CHECK del formato, el trigger de profundidad, el FK del
 * padre—, pero un error de base llega al usuario como un 500 sin explicación. Esto lo nombra antes,
 * en el idioma del problema.
 */
describe("validateNewCategory", () => {
  it("accepts a well-formed sub-category", () => {
    expect(validateNewCategory(taxonomy, valid)).toEqual({});
  });

  describe("the key", () => {
    describe.each([
      ["", "vacía"],
      ["   ", "solo espacios"],
    ])("%j", (key, reason) => {
      it(`is required — ${reason}`, () => {
        expect(validateNewCategory(taxonomy, { ...valid, key }).key).toBeDefined();
      });
    });

    // El CHECK de la base es `^[a-z0-9]+(_[a-z0-9]+)*$`; se dice aquí en castellano.
    describe.each([
      ["Conservas", "mayúsculas"],
      ["conservas caseras", "espacios"],
      ["conservas-caseras", "guion medio"],
      ["conservás", "acento"],
      ["_conservas", "empieza con guion bajo"],
      ["conservas_", "termina con guion bajo"],
    ])("%j", (key, reason) => {
      it(`is rejected — ${reason}`, () => {
        expect(validateNewCategory(taxonomy, { ...valid, key }).key).toBeDefined();
      });
    });

    it("accepts a compound key with an underscore", () => {
      expect(
        validateNewCategory(taxonomy, { ...valid, key: "conservas_caseras" }).key,
      ).toBeUndefined();
    });

    // Renombrar una clave existente cascadea a las publicaciones; crear una repetida no debe
    // parecerse a eso ni por accidente.
    it("rejects a key the catalog already has", () => {
      expect(validateNewCategory(taxonomy, { ...valid, key: "jugos" }).key).toMatch(
        /ya existe/i,
      );
    });

    it("rejects it even if the existing one is inactive", () => {
      const withInactive = makeTaxonomy({
        nodes: taxonomy.nodes.size
          ? [...taxonomy.nodes.values()].map((node) =>
              node.key === "jugos" ? { ...node, isActive: false } : node,
            )
          : [],
      });

      expect(
        validateNewCategory(withInactive, { ...valid, key: "jugos" }).key,
      ).toBeDefined();
    });
  });

  describe("the parent", () => {
    it("must exist in the catalog", () => {
      expect(
        validateNewCategory(taxonomy, { ...valid, parentKey: "ferreteria" }).parentKey,
      ).toBeDefined();
    });

    // El catálogo es de dos niveles: colgar de una hoja lo rompería, y el trigger lo rechazaría.
    it("cannot be a sub-category", () => {
      expect(
        validateNewCategory(taxonomy, { ...valid, parentKey: "jugos" }).parentKey,
      ).toMatch(/dos niveles/i);
    });

    it("may be absent, which creates a root category", () => {
      expect(
        validateNewCategory(taxonomy, { ...valid, parentKey: null }).parentKey,
      ).toBeUndefined();
    });
  });

  describe("the labels", () => {
    it("requires Spanish, which is what the site falls back to", () => {
      const errors = validateNewCategory(taxonomy, {
        ...valid,
        labels: { es: "", en: "Preserves" },
      });

      expect(errors.labelEs).toBeDefined();
    });

    // Sin inglés la etiqueta cae al español, que es peor que no tenerla pero no es un error.
    it("does not require English", () => {
      const errors = validateNewCategory(taxonomy, {
        ...valid,
        labels: { es: "Conservas", en: "" },
      });

      expect(errors).toEqual({});
    });

    it("rejects a Spanish label made only of whitespace", () => {
      expect(
        validateNewCategory(taxonomy, { ...valid, labels: { es: "   ", en: "" } })
          .labelEs,
      ).toBeDefined();
    });
  });

  it("reports every problem at once, so the form is not fixed one error at a time", () => {
    const errors = validateNewCategory(taxonomy, {
      key: "MAL",
      parentKey: "jugos",
      labels: { es: "", en: "" },
    });

    expect(Object.keys(errors).sort()).toEqual(["key", "labelEs", "parentKey"]);
  });
});
