import { describe, expect, it } from "vitest";
import { foldForSearch } from "~/domain/search/listPage";
import { FOLD_FROM, FOLD_TO } from "./sqlFold";

/**
 * Lo escrito se dobla en el dominio (`foldForSearch`) y el título en la base (`sqlFold`). Si no
 * dan lo mismo, «pina» deja de encontrar «piña» sin que falle nada más.
 */
describe("sqlFold dobla igual que el dominio", () => {
  it("las dos cadenas miden lo mismo", () => {
    expect([...FOLD_FROM]).toHaveLength([...FOLD_TO].length);
  });

  it.each([...FOLD_FROM].map((letter, index) => [letter, [...FOLD_TO][index]]))(
    "«%s» se vuelve «%s»",
    (letter, plain) => {
      expect(foldForSearch(letter)).toBe(plain);
    },
  );
});
