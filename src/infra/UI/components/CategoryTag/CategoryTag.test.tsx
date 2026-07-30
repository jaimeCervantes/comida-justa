import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CategoryTag from "./CategoryTag";

/**
 * El componente es tonto a propósito: la taxonomía vive en la base y esto se renderiza también
 * dentro de un árbol cliente, así que la traducción la hace el servidor. Lo que antes se probaba
 * aquí —el locale y las claves fuera del catálogo— vive ahora en `mapPostsToCards.test.ts` y
 * `taxonomy.test.ts`.
 */
describe("CategoryTag", () => {
  it("shows the label it was given", () => {
    render(<CategoryTag label="Juices" />);

    expect(screen.getByTestId("category-tag")).toHaveTextContent("Juices");
  });

  // Escenario "The category is optional in this slice" (@slice-1 del catálogo unificado)
  describe.each([
    [null, "a publication with no category"],
    [undefined, "no label prop at all"],
    ["", "an empty label"],
  ])("with %j", (label, reason) => {
    it(`renders nothing — ${reason}`, () => {
      const { container } = render(<CategoryTag label={label} />);

      expect(container).toBeEmptyDOMElement();
      expect(screen.queryByTestId("category-tag")).toBeNull();
    });
  });
});
