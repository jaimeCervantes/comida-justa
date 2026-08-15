import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Order, OrderStatus } from "~/domain/order/order";
import NotifySellerButton from "./NotifySellerButton";

/* El pedido real de 525 del 14 de agosto: 3 renglones y 9 artículos. */
const pedido: Order = {
  id: "a7fd1c34-0000-0000-0000-000000000000",
  checkoutId: "11111111-2222-3333-4444-555555555555",
  sellerId: "7ea7a1ee-0000-0000-0000-000000000000",
  buyerId: "b0000000-0000-0000-0000-000000000000",
  status: "PENDING",
  createdAt: new Date("2026-08-14T01:45:00Z"),
  lines: [
    {
      postId: null,
      title: "Pechuga de pollo a la naranja en bistec",
      unitPrice: 105,
      quantity: 1,
      slug: null,
      imageUrl: null,
    },
    {
      postId: null,
      title: "Pechuga de pollo asada en bistec",
      unitPrice: 105,
      quantity: 2,
      slug: null,
      imageUrl: null,
    },
    {
      postId: null,
      title: "Suero natural",
      unitPrice: 35,
      quantity: 6,
      slug: null,
      imageUrl: null,
    },
  ],
};

const labels = {
  intro: "Hola, te acabo de hacer un pedido:",
  total: "Total",
  cta: "Avisar por WhatsApp",
};

const ORDER_URL = "https://hazlosano.com/pedido/a7fd1c34";

function renderButton(
  overrides: Partial<Parameters<typeof NotifySellerButton>[0]> = {},
) {
  return render(
    <NotifySellerButton
      order={pedido}
      sellerPhone="2781126948"
      orderUrl={ORDER_URL}
      labels={labels}
      testId="notify"
      {...overrides}
    />,
  );
}

/* Sin `renderWithIntl`: el componente no lee el catálogo a propósito —recibe los textos como props—
   y eso es justo lo que le permite servir a la lista (cliente) y al bloque de la compra (servidor). */
describe("NotifySellerButton", () => {
  it("manda el desglose, el total y la dirección del pedido al número de la tienda", () => {
    renderButton();

    const href = screen.getByTestId("notify").getAttribute("href") ?? "";
    const mensaje = decodeURIComponent(href.split("text=")[1] ?? "");

    expect(href).toContain("wa.me/522781126948");
    expect(mensaje).toContain("Hola, te acabo de hacer un pedido:");
    expect(mensaje).toContain(
      "1 × Pechuga de pollo a la naranja en bistec — $105",
    );
    expect(mensaje).toContain("2 × Pechuga de pollo asada en bistec — $210");
    expect(mensaje).toContain("6 × Suero natural — $210");
    expect(mensaje).toContain("Total: $525");
    expect(mensaje).toContain(ORDER_URL);
  });

  /* La corrida de escritorio de `canNotifySeller` vive en el dominio; aquí sólo se comprueba que la
     tarjeta se apoya en ella en vez de repetir el condicional por su cuenta. */
  it.each([
    ["PENDING", true],
    ["CONFIRMED", true],
    ["PREPARING", true],
    ["DELIVERED", false],
    ["CANCELLED", false],
  ] as Array<[OrderStatus, boolean]>)(
    "con el pedido en %s el botón aparece: %s",
    (status, visible) => {
      renderButton({ order: { ...pedido, status } });

      expect(screen.queryByTestId("notify") !== null).toBe(visible);
    },
  );

  /* `sellers.phone` viaja como nullable hasta aquí. Un botón que abre WhatsApp sin número a quien
     escribir es peor que no ofrecerlo: promete un camino que no existe. */
  it("una tienda sin número no pinta un enlace roto", () => {
    renderButton({ sellerPhone: null });

    expect(screen.queryByTestId("notify")).toBeNull();
  });
});
