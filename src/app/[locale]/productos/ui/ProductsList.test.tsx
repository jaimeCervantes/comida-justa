import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProductsList, { PRODUCTS_EMPTY_MESSAGE } from "./ProductsList";

const product = {
  id: "product-1",
  title: "Miel de abeja de Hazlo Sano",
  price: 150,
  origin: "hazlo_sano_propio",
  kind: "producto",
  createdAt: new Date("2026-07-01").toISOString(),
  user: { id: "user-1", name: "Hazlo Sano" },
  to: "/miel-de-abeja-de-hazlo-sano",
  media: [{ url: "https://ruta/de/imagen/1.webp", type: "image", alt: "Miel" }],
};

describe("When the products list is rendered", () => {
  it("shows the empty state instead of the grid when there are no products", () => {
    const { getByTestId, queryByTestId } = render(
      <ProductsList products={[]} currentPage={1} totalPages={0} />,
    );

    expect(getByTestId("products-empty")).toHaveTextContent(
      PRODUCTS_EMPTY_MESSAGE,
    );
    expect(queryByTestId("products-grid")).not.toBeInTheDocument();
  });

  it("renders a card with its provenance badge for each product", () => {
    const { getByTestId, getByText } = render(
      <ProductsList products={[product]} currentPage={1} totalPages={1} />,
    );

    expect(getByText(product.title)).toBeInTheDocument();
    expect(getByTestId("provenance-badge")).toHaveTextContent("Hazlo Sano");
  });

  it("links to the next products page when there is more than one", () => {
    const { getByRole } = render(
      <ProductsList products={[product]} currentPage={1} totalPages={3} />,
    );

    expect(getByRole("link", { name: "Siguiente" })).toHaveAttribute(
      "href",
      "/productos/page/2",
    );
  });
});
