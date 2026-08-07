import { describe, expect, it } from "vitest";
import { buildSearchEvent, normalizeTerm } from "./searchEvent";

/** Slice 4 de `docs/features/busqueda-semantica.md`. */
describe("normalizeTerm", () => {
  /* Sin normalizar, el informe de términos más buscados sería una lista de variantes de escritura
     del mismo término en vez de una lista de lo que la gente busca. */
  it.each([
    ["Pan Integral", "pan integral"],
    ["  pan integral  ", "pan integral"],
    ["pan   integral", "pan integral"],
    ["PAN\tINTEGRAL", "pan integral"],
  ])("normaliza %j", (raw, expected) => {
    expect(normalizeTerm(raw)).toBe(expected);
  });

  it("recorta un pegado accidental en vez de guardarlo entero", () => {
    expect(normalizeTerm("a".repeat(500))).toHaveLength(120);
  });

  it("no inventa nada con una cadena vacía", () => {
    expect(normalizeTerm("   ")).toBe("");
  });
});

describe("buildSearchEvent", () => {
  it("marca la búsqueda que se fue con las manos vacías", () => {
    const event = buildSearchEvent({
      term: "reparar un camión",
      locale: "es",
      strategy: "none",
      resultCount: 0,
    });

    expect(event.emptyHanded).toBe(true);
  });

  it("no la marca cuando sí hubo resultados", () => {
    const event = buildSearchEvent({
      term: "Pan",
      locale: "es",
      strategy: "text",
      resultCount: 9,
    });

    expect(event).toEqual({
      term: "pan",
      locale: "es",
      strategy: "text",
      resultCount: 9,
      emptyHanded: false,
    });
  });

  /* Distinguir `semantic` de `text` es lo que permite saber cuánto se está gastando en embeddings:
     cada búsqueda `semantic` costó una llamada al proveedor. */
  it.each(["text", "semantic", "none"] as const)(
    "conserva la estrategia %s",
    (strategy) => {
      const event = buildSearchEvent({
        term: "x",
        locale: "en",
        strategy,
        resultCount: 1,
      });

      expect(event.strategy).toBe(strategy);
    },
  );
});
