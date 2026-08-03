import { describe, expect, it } from "vitest";
import {
  makeTaxonomy,
  makeTaxonomyWithInactive,
  SEEDED_TAXONOMY_SNAPSHOT,
} from "./__fixtures__/categoryTaxonomy";
import {
  categoryTree,
  isActiveKey,
  labelFor,
  navigableCategories,
  normalizeCategoryKey,
  optionsFor,
  resolveKeyLenient,
  resolveKeyStrict,
  subtreeKeys,
} from "./taxonomy";

const taxonomy = makeTaxonomy();

describe("normalizeCategoryKey", () => {
  // Espejo de la función SQL `category_normalize`. Si estas dos dejan de coincidir, la búsqueda
  // encuentra cosas distintas según quién resuelva.
  describe.each([
    ["Panadería", "panaderia"],
    ["  PAN  ", "pan"],
    ["Alimentación", "alimentacion"],
    ["jugos", "jugos"],
    ["", ""],
  ])("normalizeCategoryKey(%j)", (input, expected) => {
    it(`is ${JSON.stringify(expected)}`, () => {
      expect(normalizeCategoryKey(input)).toBe(expected);
    });
  });

  it("keeps inner spaces, because the SQL side keeps them too", () => {
    expect(normalizeCategoryKey("Frutas y Verduras")).toBe("frutas y verduras");
  });

  it("treats null and undefined as empty", () => {
    expect(normalizeCategoryKey(null)).toBe("");
    expect(normalizeCategoryKey(undefined)).toBe("");
  });
});

// Escenario "A key is resolved strictly when publishing, leniently when searching"
// (@slice-1 @component)
describe("resolveKeyStrict", () => {
  describe.each([
    ["jugos", "jugos", "exact active key"],
    ["Jugos", null, "label sent instead of the key"],
    ["JUGOS", null, "keys are lower-case"],
    ["panaderias", null, "not in the catalog"],
    ["", null, "empty string"],
  ])("resolveKeyStrict(%j)", (sent, expected, reason) => {
    it(`is ${JSON.stringify(expected)} — ${reason}`, () => {
      expect(resolveKeyStrict(taxonomy, sent)).toBe(expected);
    });
  });

  it("treats null and undefined as unset", () => {
    expect(resolveKeyStrict(taxonomy, null)).toBeNull();
    expect(resolveKeyStrict(taxonomy, undefined)).toBeNull();
  });

  it("rejects a key that exists but is inactive", () => {
    expect(
      resolveKeyStrict(makeTaxonomyWithInactive("jugos"), "jugos"),
    ).toBeNull();
  });
});

describe("resolveKeyLenient", () => {
  describe.each([
    ["Panadería", "panaderia", "label, accents normalised"],
    ["PAN", "panaderia", "alias, case normalised"],
    ["bread", "panaderia", "english alias"],
    ["zumo", "jugos", "regional synonym"],
    ["Juices", "jugos", "english label"],
    ["jugos", "jugos", "the key itself"],
    ["ferreteria", null, "matches nothing at all"],
    ["", null, "empty string"],
  ])("resolveKeyLenient(%j)", (sent, expected, reason) => {
    it(`is ${JSON.stringify(expected)} — ${reason}`, () => {
      expect(resolveKeyLenient(taxonomy, sent)).toBe(expected);
    });
  });

  // Agregar un sinónimo nunca debe cambiar el significado de algo que ya resolvía.
  it("prefers the key over an alias that points elsewhere", () => {
    const shadowed = makeTaxonomy({
      aliases: [{ aliasNormalized: "jugos", categoryKey: "bebidas" }],
    });

    expect(resolveKeyLenient(shadowed, "jugos")).toBe("jugos");
  });

  it("ignores an alias whose category is inactive", () => {
    expect(
      resolveKeyLenient(makeTaxonomyWithInactive("panaderia"), "bread"),
    ).toBeNull();
  });
});

// Escenario "The label follows the requested locale, with Spanish as the fallback"
// (@slice-1 @component)
describe("labelFor", () => {
  describe.each([
    ["jugos", "es", "Jugos"],
    ["jugos", "en", "Juices"],
    ["panaderia", "en", "Bakery"],
    ["untables", "en", "Spreads"],
    ["jugos", "fr", "Jugos"],
    ["tornillos", "es", null],
  ])("labelFor(%j, %j)", (key, locale, expected) => {
    it(`is ${JSON.stringify(expected)}`, () => {
      expect(labelFor(taxonomy, key, locale)).toBe(expected);
    });
  });

  it("falls back to Spanish when that locale has no translation", () => {
    const onlySpanish = makeTaxonomy({
      nodes: [
        {
          key: "conservas",
          parentKey: "alimentacion",
          level: 2,
          isActive: true,
          sortOrder: 70,
          labels: { es: "Conservas" },
        },
        ...SEEDED_TAXONOMY_SNAPSHOT.nodes,
      ],
    });

    expect(labelFor(onlySpanish, "conservas", "en")).toBe("Conservas");
  });

  it("has no label without a key", () => {
    expect(labelFor(taxonomy, null)).toBeNull();
    expect(labelFor(taxonomy, undefined, "en")).toBeNull();
  });
});

// Escenario "The selector options follow the catalog order, not the alphabet" (@slice-1 @component)
describe("optionsFor", () => {
  it("lists the sub-categories in catalog order, not alphabetically", () => {
    expect(
      optionsFor(taxonomy, "alimentacion", "es").map((o) => o.label),
    ).toEqual([
      "Jugos",
      "Platillos",
      "Bebidas",
      "Panadería",
      "Abarrotes",
      "Untables",
    ]);
  });

  it("translates the same options", () => {
    expect(
      optionsFor(taxonomy, "alimentacion", "en").map((o) => o.label),
    ).toEqual(["Juices", "Dishes", "Drinks", "Bakery", "Groceries", "Spreads"]);
  });

  it("lists the root categories when no parent is given", () => {
    expect(optionsFor(taxonomy, null, "es")).toEqual([
      { value: "alimentacion", label: "Alimentación" },
    ]);
  });

  it("leaves an inactive category out", () => {
    const values = optionsFor(
      makeTaxonomyWithInactive("bebidas"),
      "alimentacion",
      "es",
    ).map((o) => o.value);

    expect(values).not.toContain("bebidas");
    expect(values).toHaveLength(5);
  });

  it("is empty for a parent that has no children", () => {
    expect(optionsFor(taxonomy, "jugos", "es")).toEqual([]);
  });
});

describe("navigableCategories", () => {
  /* El menú ofrece las hojas y no la raíz: hoy `alimentacion` es la única, así que un nivel
     intermedio con un solo elemento sería un clic de más para llegar al mismo sitio. */
  it("offers the leaves, in the catalogue order", () => {
    expect(navigableCategories(taxonomy).map((o) => o.value)).toEqual([
      "jugos",
      "platillos",
      "bebidas",
      "panaderia",
      "abarrotes",
      "untables",
    ]);
  });

  it("does not offer the root itself", () => {
    expect(navigableCategories(taxonomy).map((o) => o.value)).not.toContain(
      "alimentacion",
    );
  });

  it("labels them in the requested language", () => {
    const jugos = navigableCategories(taxonomy, "en").find(
      (o) => o.value === "jugos",
    );

    expect(jugos?.label).toBe("Juices");
  });

  it("leaves out a de-activated category", () => {
    const values = navigableCategories(
      makeTaxonomyWithInactive("untables"),
    ).map((o) => o.value);

    expect(values).not.toContain("untables");
  });

  /* Que la forma se derive y no esté codificada: una raíz sin hijas se ofrece ella misma, así que
     añadir una segunda raíz al catálogo la hace aparecer en el menú sin tocar código. */
  it("offers a childless root on its own", () => {
    const withSecondRoot = makeTaxonomy({
      nodes: [
        ...SEEDED_TAXONOMY_SNAPSHOT.nodes,
        {
          key: "ferreteria",
          parentKey: null,
          level: 1,
          isActive: true,
          sortOrder: 20,
          labels: { es: "Ferretería", en: "Hardware" },
        },
      ],
    });

    expect(navigableCategories(withSecondRoot).map((o) => o.value)).toContain(
      "ferreteria",
    );
  });
});

describe("subtreeKeys", () => {
  it("brings the root together with its six children", () => {
    expect(subtreeKeys(taxonomy, "alimentacion")).toEqual([
      "alimentacion",
      "jugos",
      "platillos",
      "bebidas",
      "panaderia",
      "abarrotes",
      "untables",
    ]);
  });

  it("brings only itself for a leaf", () => {
    expect(subtreeKeys(taxonomy, "jugos")).toEqual(["jugos"]);
  });

  describe.each([["ferreteria"], [null], [undefined], [""]])(
    "subtreeKeys(%j)",
    (key) => {
      it("is empty", () => {
        expect(subtreeKeys(taxonomy, key)).toEqual([]);
      });
    },
  );
});

describe("createCategoryTaxonomy", () => {
  it("indexes every node by key", () => {
    expect(taxonomy.nodes.size).toBe(7);
    expect(taxonomy.nodes.get("panaderia")?.labels.en).toBe("Bakery");
  });

  // La base lo impide con un FK, pero el fallback se escribe a mano.
  it("drops an alias pointing at a key that does not exist", () => {
    const withOrphan = makeTaxonomy({
      aliases: [{ aliasNormalized: "tornillos", categoryKey: "ferreteria" }],
    });

    expect(withOrphan.aliasesByNormalized.size).toBe(0);
    expect(resolveKeyLenient(withOrphan, "tornillos")).toBeNull();
  });

  it("reports an unknown key as inactive", () => {
    expect(isActiveKey(taxonomy, "ferreteria")).toBe(false);
    expect(isActiveKey(taxonomy, null)).toBe(false);
  });
});

describe("categoryTree", () => {
  /* La otra forma de leer lo mismo que `navigableCategories`: con la jerarquía puesta, para un
     menú que se recorre por niveles en vez de enseñarlo todo de golpe. */
  it("gives the roots, each with its children in catalogue order", () => {
    const tree = categoryTree(taxonomy);

    expect(tree.map((branch) => branch.value)).toEqual(["alimentacion"]);
    expect(tree[0].children.map((child) => child.value)).toEqual([
      "jugos",
      "platillos",
      "bebidas",
      "panaderia",
      "abarrotes",
      "untables",
    ]);
  });

  it("labels roots and children in the requested language", () => {
    const [alimentacion] = categoryTree(taxonomy, "en");

    expect(alimentacion.label).toBe("Food");
    expect(alimentacion.children[0].label).toBe("Juices");
  });

  it("leaves out a de-activated child", () => {
    const [alimentacion] = categoryTree(makeTaxonomyWithInactive("untables"));

    expect(alimentacion.children.map((child) => child.value)).not.toContain(
      "untables",
    );
  });

  it("keeps a childless root, with an empty list", () => {
    const withSecondRoot = makeTaxonomy({
      nodes: [
        ...SEEDED_TAXONOMY_SNAPSHOT.nodes,
        {
          key: "ferreteria",
          parentKey: null,
          level: 1 as const,
          isActive: true,
          sortOrder: 20,
          labels: { es: "Ferretería" },
        },
      ],
    });

    const ferreteria = categoryTree(withSecondRoot).find(
      (branch) => branch.value === "ferreteria",
    );

    expect(ferreteria?.children).toEqual([]);
  });
});
