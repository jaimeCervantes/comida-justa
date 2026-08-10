import { describe, expect, it } from "vitest";
import {
  addToSelection,
  countSelectionItems,
  MAX_LINES,
  MAX_QUANTITY,
  removeFromSelection,
  setSelectionQuantity,
} from "./cartSelection";

const jugoVerde = "f5258215-a56c-4c86-813e-89177f2860d2";
const sueroNatural = "4e256323-9965-5f82-a8d6-6fc2849e9c77";

describe("addToSelection", () => {
  it("estrena el renglón la primera vez", () => {
    expect(addToSelection([], jugoVerde)).toEqual([
      { postId: jugoVerde, quantity: 1 },
    ]);
  });

  it("suma sobre el renglón que ya estaba, en vez de duplicarlo", () => {
    const selection = addToSelection(
      [{ postId: jugoVerde, quantity: 2 }],
      jugoVerde,
    );

    expect(selection).toEqual([{ postId: jugoVerde, quantity: 3 }]);
  });

  it("no toca el carrito recibido", () => {
    const original = [{ postId: jugoVerde, quantity: 1 }];

    addToSelection(original, sueroNatural);

    expect(original).toHaveLength(1);
  });

  it("no pasa del tope de cantidad", () => {
    const selection = addToSelection(
      [{ postId: jugoVerde, quantity: MAX_QUANTITY }],
      jugoVerde,
    );

    expect(selection[0].quantity).toBe(MAX_QUANTITY);
  });

  it("no pasa del tope de renglones", () => {
    const full = Array.from({ length: MAX_LINES }, (_, index) => ({
      postId: `producto-${index}`,
      quantity: 1,
    }));

    expect(addToSelection(full, jugoVerde)).toHaveLength(MAX_LINES);
  });
});

describe("setSelectionQuantity", () => {
  it("cambia la cantidad de un renglón", () => {
    const selection = setSelectionQuantity(
      [{ postId: jugoVerde, quantity: 1 }],
      jugoVerde,
      2,
    );

    expect(selection).toEqual([{ postId: jugoVerde, quantity: 2 }]);
  });

  // Vaciar el campo es la forma natural de decir "ya no lo quiero".
  it.each([0, -3])("con cantidad %i quita el renglón", (quantity) => {
    const selection = setSelectionQuantity(
      [
        { postId: jugoVerde, quantity: 1 },
        { postId: sueroNatural, quantity: 1 },
      ],
      jugoVerde,
      quantity,
    );

    expect(selection).toEqual([{ postId: sueroNatural, quantity: 1 }]);
  });

  it("recorta una cantidad fuera de escala", () => {
    const selection = setSelectionQuantity(
      [{ postId: jugoVerde, quantity: 1 }],
      jugoVerde,
      5000,
    );

    expect(selection[0].quantity).toBe(MAX_QUANTITY);
  });
});

describe("removeFromSelection", () => {
  it("quita solo el renglón pedido", () => {
    const selection = removeFromSelection(
      [
        { postId: jugoVerde, quantity: 2 },
        { postId: sueroNatural, quantity: 1 },
      ],
      jugoVerde,
    );

    expect(selection).toEqual([{ postId: sueroNatural, quantity: 1 }]);
  });
});

describe("countSelectionItems", () => {
  it("cuenta cantidades, no renglones: es lo que dice la cabecera", () => {
    expect(
      countSelectionItems([
        { postId: jugoVerde, quantity: 2 },
        { postId: sueroNatural, quantity: 1 },
      ]),
    ).toBe(3);
  });

  it("un carrito vacío no lleva nada", () => {
    expect(countSelectionItems([])).toBe(0);
  });
});
