import { describe, expect, it } from "vitest";
import type { Order } from "./order";
import {
  buildWhatsappOrderNoticeLink,
  buildWhatsappOrderNoticeMessage,
} from "./whatsappOrderNotice";

const labels = { intro: "Hola, te acabo de hacer un pedido:", total: "Total" };
const ORDER_URL = "https://hazlosano.com/pedido/abc-123";

const order: Order = {
  id: "abc-123",
  checkoutId: "11111111-2222-3333-4444-555555555555",
  sellerId: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
  buyerId: "user-jaime",
  status: "PENDING",
  lines: [
    {
      postId: "f5258215-a56c-4c86-813e-89177f2860d2",
      title: "Jugo Verde",
      unitPrice: 40,
      quantity: 2,
      slug: "jugo-verde",
      imageUrl: null,
    },
    {
      postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
      title: "Suero natural",
      unitPrice: 35,
      quantity: 1,
      slug: "suero-natural",
      imageUrl: null,
    },
  ],
  createdAt: new Date("2026-08-09T12:00:00Z"),
};

describe("buildWhatsappOrderNoticeMessage", () => {
  it("lista los renglones, el total y el enlace del pedido", () => {
    expect(buildWhatsappOrderNoticeMessage(order, ORDER_URL, labels)).toBe(
      [
        "Hola, te acabo de hacer un pedido:",
        "",
        "2 × Jugo Verde — $80",
        "1 × Suero natural — $35",
        "",
        "Total: $115",
        "https://hazlosano.com/pedido/abc-123",
      ].join("\n"),
    );
  });

  /* El renglón guarda una copia del título, no una referencia: aunque la publicación se haya
     borrado —`post_id` queda nulo—, el mensaje sigue diciendo qué se pidió. */
  it("sigue diciendo qué se pidió aunque la publicación ya no exista", () => {
    const huerfano: Order = {
      ...order,
      // Publicación borrada: `post_id` nulo, y con él el enlace y la miniatura.
      lines: [{ ...order.lines[0], postId: null, slug: null, imageUrl: null }],
    };

    expect(
      buildWhatsappOrderNoticeMessage(huerfano, ORDER_URL, labels),
    ).toContain("2 × Jugo Verde — $80");
  });
});

describe("buildWhatsappOrderNoticeLink", () => {
  it("escribe al teléfono de la tienda con la lada que pide wa.me", () => {
    const link = buildWhatsappOrderNoticeLink(
      order,
      "2781126948",
      ORDER_URL,
      labels,
    );

    expect(link?.startsWith("https://wa.me/522781126948?text=")).toBe(true);
    expect(link).toContain("%0A");
    expect(link).not.toContain(" ");
  });

  it("sin teléfono no ofrece un enlace roto", () => {
    expect(
      buildWhatsappOrderNoticeLink(order, null, ORDER_URL, labels),
    ).toBeNull();
  });
});
