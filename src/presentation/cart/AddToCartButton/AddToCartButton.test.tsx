import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AddToCartButton from "./AddToCartButton";

/* La acción es un Server Action: en un test de componente no hay servidor al que mandarla, y lo que
   se prueba aquí es *cuándo se pinta el botón*, no qué escribe. */
vi.mock("../cartActions", () => ({
  addToCart: vi.fn(),
}));

const jugoVerde = "f5258215-a56c-4c86-813e-89177f2860d2";

describe("AddToCartButton", () => {
  /* Corrida de escritorio del Scenario Outline "Qué se puede añadir al carrito" en orders.feature.
     La regla es `canBeOrdered`, la misma que apaga el botón de WhatsApp: si discreparan, la ficha
     ofrecería juntar algo que no se puede pedir. */
  it.each([
    ["producto", true, true, "es lo que esta feature viene a resolver"],
    ["producto", false, false, "no se junta lo que no se puede entregar"],
    ["anuncio", true, false, "un anuncio no tiene precio: no suma"],
    ["anuncio", false, false, "un anuncio tampoco se agota"],
  ])(
    "con kind %s y disponible %s el botón se pinta: %s",
    (kind, isAvailable, expected) => {
      renderWithIntl(
        <AddToCartButton
          postId={jugoVerde}
          kind={kind}
          isAvailable={isAvailable}
        />,
      );

      expect(Boolean(screen.queryByTestId("add-to-cart"))).toBe(expected);
    },
  );

  /* `is_available` llega nulo en las lecturas viejas y eso significa disponible, no agotado: solo
     un `false` explícito lo agota. Es la regla de `availability.ts`. */
  it("una publicación sin disponibilidad declarada se puede añadir", () => {
    renderWithIntl(
      <AddToCartButton postId={jugoVerde} kind="producto" isAvailable={null} />,
    );

    expect(screen.getByTestId("add-to-cart")).toBeInTheDocument();
  });

  it("manda el id del producto, que es lo único que guarda el carrito", () => {
    const { container } = renderWithIntl(
      <AddToCartButton postId={jugoVerde} kind="producto" isAvailable />,
    );

    expect(
      container.querySelector<HTMLInputElement>('input[name="postId"]')?.value,
    ).toBe(jugoVerde);
  });
});
