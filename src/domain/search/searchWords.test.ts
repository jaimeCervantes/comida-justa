import { describe, expect, it } from "vitest";
import { MAX_SEARCH_WORDS, searchWords } from "./searchWords";

/** Corrida de escritorio del slice 10 de `difusionEnGrupos.feature`. */
describe("lo escrito se compara sin acentos, ñ, ü ni mayúsculas", () => {
  it.each([
    { escribo: "Piña  colada", palabras: ["pina", "colada"] },
    { escribo: "JALAPEÑO", palabras: ["jalapeno"] },
    { escribo: "güera", palabras: ["guera"] },
    { escribo: "100% natural", palabras: ["100%", "natural"] },
    { escribo: "   ", palabras: [] },
  ])("«$escribo»", ({ escribo, palabras }) => {
    expect(searchWords(escribo)).toEqual(palabras);
  });

  it("una palabra repetida cuenta una vez", () => {
    expect(searchWords("pan Pan PÁN")).toEqual(["pan"]);
  });

  it("se queda con las primeras palabras: más no afinan, solo encarecen", () => {
    const many = Array.from({ length: 12 }, (_, index) => `p${index}`).join(
      " ",
    );

    expect(searchWords(many)).toHaveLength(MAX_SEARCH_WORDS);
  });

  it("lo que no es texto no busca nada", () => {
    expect(searchWords(42 as never)).toEqual([]);
  });
});
