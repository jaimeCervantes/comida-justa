import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const select = vi.fn();

vi.mock("~/infra/dataAccess/db/connection", () => ({
  db: {
    select: (...args: unknown[]) => select(...args),
  },
}));

import { FALLBACK_CATEGORY_TAXONOMY } from "~/domain/entities/post/taxonomyFallback";
import PostgresCategoryTaxonomyRepository from "./PostgresCategoryTaxonomyRepository";

/** La vista devuelve un nodo repetido por cada idioma con etiqueta. */
const labelRow = (
  key: string,
  locale: string,
  label: string,
  overrides: Record<string, unknown> = {},
) => ({
  key,
  parentKey: key === "alimentacion" ? null : "alimentacion",
  level: key === "alimentacion" ? 1 : 2,
  isActive: true,
  sortOrder: 10,
  locale,
  label,
  ...overrides,
});

/** Encadena las dos consultas del repositorio: primero la vista, luego los alias. */
function givenQueries(labels: unknown, aliases: unknown): void {
  const resolve = (value: unknown) =>
    value instanceof Error ? Promise.reject(value) : Promise.resolve(value);

  select
    .mockReturnValueOnce({ from: () => resolve(labels) })
    .mockReturnValueOnce({ from: () => resolve(aliases) });
}

describe("PostgresCategoryTaxonomyRepository", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    select.mockReset();
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("folds one row per locale into a single node with its labels", async () => {
    givenQueries(
      [
        labelRow("alimentacion", "es", "Alimentación"),
        labelRow("alimentacion", "en", "Food"),
        labelRow("panaderia", "es", "Panadería", { sortOrder: 40 }),
        labelRow("panaderia", "en", "Bakery", { sortOrder: 40 }),
      ],
      [{ aliasNormalized: "pan", categoryKey: "panaderia" }],
    );

    const snapshot =
      await new PostgresCategoryTaxonomyRepository().loadSnapshot();

    expect(snapshot.nodes).toHaveLength(2);
    expect(snapshot.nodes[1]).toEqual({
      key: "panaderia",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 40,
      labels: { es: "Panadería", en: "Bakery" },
    });
    expect(snapshot.aliases).toEqual([
      { aliasNormalized: "pan", categoryKey: "panaderia" },
    ]);
  });

  // Agregar un locale en la base no debe romper un despliegue que todavía no lo conoce.
  it("ignores a locale the domain does not know", async () => {
    givenQueries(
      [
        labelRow("alimentacion", "es", "Alimentación"),
        labelRow("alimentacion", "pt", "Alimentação"),
      ],
      [],
    );

    const snapshot =
      await new PostgresCategoryTaxonomyRepository().loadSnapshot();

    expect(snapshot.nodes[0].labels).toEqual({ es: "Alimentación" });
  });

  it("drops an alias whose normalised column came back empty", async () => {
    givenQueries(
      [labelRow("alimentacion", "es", "Alimentación")],
      [
        { aliasNormalized: null, categoryKey: "alimentacion" },
        { aliasNormalized: "food", categoryKey: "alimentacion" },
      ],
    );

    const snapshot =
      await new PostgresCategoryTaxonomyRepository().loadSnapshot();

    expect(snapshot.aliases).toEqual([
      { aliasNormalized: "food", categoryKey: "alimentacion" },
    ]);
  });

  // Escenario "A taxonomy that cannot be read never takes the site down" (@slice-1 @component)
  describe.each([
    [
      "fails because the tables do not exist",
      new Error('relation "category_labels" does not exist'),
    ],
    ["fails because the database is down", new Error("ECONNREFUSED")],
    ["returns zero rows", []],
  ])("when the catalog query %s", (_label, labels) => {
    it("returns the 7 known keys and logs a warning", async () => {
      givenQueries(labels, []);

      const snapshot =
        await new PostgresCategoryTaxonomyRepository().loadSnapshot();

      expect(snapshot).toBe(FALLBACK_CATEGORY_TAXONOMY);
      expect(snapshot.nodes).toHaveLength(7);
      expect(warn).toHaveBeenCalledOnce();
    });
  });
});
