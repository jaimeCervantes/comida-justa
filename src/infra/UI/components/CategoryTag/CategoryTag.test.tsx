import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CategoryTag from "./CategoryTag";

describe("CategoryTag", () => {
  it("shows the sub-category label in the visitor's locale", () => {
    render(<CategoryTag subCategory="jugos" locale="en" />);

    expect(screen.getByTestId("category-tag")).toHaveTextContent("Juices");
  });

  it("defaults to Spanish when no locale is given", () => {
    render(<CategoryTag subCategory="panaderia" />);

    expect(screen.getByTestId("category-tag")).toHaveTextContent("Panadería");
  });

  it("falls back to the category when there is no sub-category", () => {
    render(<CategoryTag category="alimentacion" locale="es" />);

    expect(screen.getByTestId("category-tag")).toHaveTextContent("Alimentación");
  });

  // Escenario "The category is optional in this slice" (@slice-1)
  it("renders nothing when the publication has no category", () => {
    const { container } = render(<CategoryTag />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("category-tag")).toBeNull();
  });

  it("renders nothing for a key outside the allowlist", () => {
    const { container } = render(<CategoryTag subCategory="postres" />);

    expect(container).toBeEmptyDOMElement();
  });
});
