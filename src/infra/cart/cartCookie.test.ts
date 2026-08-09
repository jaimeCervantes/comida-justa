import { describe, expect, it } from "vitest";
import { MAX_LINES, MAX_QUANTITY } from "~/domain/cart/cartSelection";
import { parseCart, serializeCart } from "./cartCookie";

const jugoVerde = "f5258215-a56c-4c86-813e-89177f2860d2";
const sueroNatural = "4e256323-9965-5f82-a8d6-6fc2849e9c77";

describe("serializeCart", () => {
  it("escribe id y cantidad, nada más", () => {
    expect(
      serializeCart([
        { postId: jugoVerde, quantity: 2 },
        { postId: sueroNatural, quantity: 1 },
      ]),
    ).toBe(`${jugoVerde}:2|${sueroNatural}:1`);
  });

  it("un carrito vacío es una cookie vacía", () => {
    expect(serializeCart([])).toBe("");
  });
});

describe("parseCart", () => {
  /* Corrida de escritorio del Scenario Outline "Una cookie manipulada no tumba el carrito" en
     orders.feature. Una cookie la escribe cualquiera: lo que venga se valida antes de creerle. */
  it.each([
    [`${jugoVerde}:2`, 1, "el caso normal"],
    [`${jugoVerde}:2|${sueroNatural}:1`, 2, "dos renglones"],
    [`${jugoVerde}:0`, 0, "cantidad 0 no es un renglón"],
    [`${jugoVerde}:abc`, 0, "cantidad ilegible"],
    [`${jugoVerde}:1.5`, 0, "media unidad no se puede pedir"],
    [`${jugoVerde}:-2`, 0, "cantidad negativa"],
    [`${jugoVerde}:2|:5`, 1, "sin id no hay producto; el bueno sobrevive"],
    [`${jugoVerde}:2|basura`, 1, "un renglón sin cantidad no arrastra al otro"],
    ["", 0, "carrito vacío"],
  ])("con %j quedan %i renglones (%s)", (cookie, expected) => {
    expect(parseCart(cookie)).toHaveLength(expected);
  });

  it.each([null, undefined])("sin cookie (%j) el carrito está vacío", (raw) => {
    expect(parseCart(raw)).toEqual([]);
  });

  it("recorta una cantidad inflada a mano", () => {
    expect(parseCart(`${jugoVerde}:100000`)[0].quantity).toBe(MAX_QUANTITY);
  });

  it("no deja que una cookie inflada cargue la página de renglones", () => {
    const huge = Array.from(
      { length: MAX_LINES + 20 },
      (_, index) => `producto-${index}:1`,
    ).join("|");

    expect(parseCart(huge)).toHaveLength(MAX_LINES);
  });

  it("descarta el id repetido en vez de sumarlo dos veces", () => {
    // Dos renglones del mismo producto harían que la pantalla lo pintara dos veces.
    expect(parseCart(`${jugoVerde}:2|${jugoVerde}:3`)).toEqual([
      { postId: jugoVerde, quantity: 2 },
    ]);
  });

  it("lo que escribe serializeCart se vuelve a leer igual", () => {
    const selection = [
      { postId: jugoVerde, quantity: 2 },
      { postId: sueroNatural, quantity: 1 },
    ];

    expect(parseCart(serializeCart(selection))).toEqual(selection);
  });
});
