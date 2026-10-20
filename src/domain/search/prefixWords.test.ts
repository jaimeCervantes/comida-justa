import { describe, expect, it } from "vitest";
import { prefixWords } from "./prefixWords";
import { MAX_SEARCH_WORDS } from "./searchWords";

/** Corrida de escritorio del slice 1 de `palabrasAMedias.feature`. */
describe("lo escrito se parte en inicios de palabra", () => {
  it.each([
    { escribo: "prote", palabras: ["prote"] },
    { escribo: "Barra de PROT", palabras: ["barra", "de", "prot"] },
    { escribo: "piña", palabras: ["piña"] },
    { escribo: "proteína", palabras: ["proteína"] },
    { escribo: "green-clean", palabras: ["green", "clean"] },
    { escribo: "pan d", palabras: ["pan"] },
    { escribo: "100% natural", palabras: ["100", "natural"] },
    { escribo: "pan:* | !miel", palabras: ["pan", "miel"] },
    { escribo: "a", palabras: [] },
    { escribo: "   ", palabras: [] },
  ])("«$escribo»", ({ escribo, palabras }) => {
    expect(prefixWords(escribo)).toEqual(palabras);
  });

  it("una palabra repetida cuenta una vez", () => {
    expect(prefixWords("pan Pan")).toEqual(["pan"]);
  });

  it("se queda con las primeras palabras", () => {
    const many = Array.from({ length: 12 }, (_, index) => `pa${index}`).join(
      " ",
    );

    expect(prefixWords(many)).toHaveLength(MAX_SEARCH_WORDS);
  });

  it("lo que no es texto no busca nada", () => {
    expect(prefixWords(42 as never)).toEqual([]);
  });
});
