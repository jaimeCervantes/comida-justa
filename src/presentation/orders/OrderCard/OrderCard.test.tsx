import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Order, OrderLine } from "~/domain/order/order";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import OrderCard from "./OrderCard";

/* El pedido real del 14 de agosto: 3 renglones, 9 artículos, 525. */
const line = (
  title: string,
  unitPrice: number,
  quantity: number,
  slug: string | null,
): OrderLine => ({
  postId: slug && "1f0a2b3c-4d5e-6f70-8192-a3b4c5d6e7f8",
  title,
  unitPrice,
  quantity,
  slug,
  imageUrl: null,
});

const pedido: Order = {
  id: "a7fd1c34-5f0a-47d3-967c-2c22537d38e3",
  checkoutId: "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e",
  sellerId: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
  buyerId: "44pZIIJ5w1vSYkDQ6gfb",
  status: "PENDING",
  lines: [
    line("Pechuga de pollo a la naranja en bistec", 105, 1, "pechuga-naranja"),
    line("Pechuga de pollo asada en bistec", 105, 2, "pechuga-asada"),
    line("Suero natural", 35, 6, "suero-natural"),
  ],
  createdAt: new Date("2026-08-14T01:45:34.024Z"),
  updatedAt: new Date("2026-08-14T01:45:34.024Z"),
};

const renderCard = (order: Order = pedido) =>
  render(
    <ul>
      <OrderCard
        order={order}
        testId="order-card"
        party={<span>Hazlo Sano</span>}
      >
        <span>pie</span>
      </OrderCard>
    </ul>,
  );

/**
 * La tarjeta es la misma para los dos papeles: lo que cambia son la contraparte y el pie. Estos
 * casos fijan lo que **no** cambia, que es justo lo que la lista del comprador no enseñaba.
 */
describe("OrderCard", () => {
  it("desglosa los renglones sin abrir el pedido", () => {
    renderCard();

    const lines = within(screen.getByTestId("order-lines"));

    expect(lines.getByText("6 × Suero natural")).toBeInTheDocument();
    expect(
      lines.getByText("1 × Pechuga de pollo a la naranja en bistec"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("order-total")).toHaveTextContent("525");
  });

  /* Cantidades y no renglones: la tabla tiene 3 filas y hay 9 cosas que preparar. */
  it("cuenta los artículos, no los renglones", () => {
    renderCard();

    expect(screen.getByTestId("order-item-count")).toHaveTextContent(
      "9 artículos",
    );
  });

  it("un solo artículo se dice en singular", () => {
    renderCard({ ...pedido, lines: [line("Suero natural", 35, 1, "suero")] });

    expect(screen.getByTestId("order-item-count")).toHaveTextContent(
      "1 artículo",
    );
  });

  it("enseña con quién es el pedido y en qué va", () => {
    renderCard();

    expect(screen.getByText("Hazlo Sano")).toBeInTheDocument();
    expect(screen.getByTestId("order-status")).toHaveAttribute(
      "data-status",
      "PENDING",
    );
  });

  /* Un renglón cuyo producto se borró conserva título e importe y pierde el enlace: es lo que ya
     garantiza el `ON DELETE SET NULL` de `post_id`, y la lista tiene que aguantarlo igual que la
     ficha. */
  it("un producto borrado no rompe la tarjeta", () => {
    renderCard({
      ...pedido,
      lines: [line("Producto que ya no está", 50, 2, null)],
    });

    expect(screen.getByText("2 × Producto que ya no está")).toBeInTheDocument();
    expect(screen.queryByTestId("order-line-link")).not.toBeInTheDocument();
    expect(screen.getByTestId("order-total")).toHaveTextContent("100");
  });
});
