import { describe, expect, it } from "vitest";
import {
  buildCartLines,
  type CartProduct,
  groupBySeller,
} from "~/domain/cart/cart";
import {
  buildWhatsappCartLink,
  buildWhatsappCartMessage,
} from "./whatsappCartOrder";

const labels = { intro: "Hola, quiero pedir:", total: "Total" };
const baseUrl = "https://hazlosano.com";

const hazloSano = {
  id: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
  name: "Hazlo Sano",
  handle: "hazlo-sano",
  phone: "2781126948",
};

const jugoVerde: CartProduct = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  slug: "jugo-verde",
  price: 40,
  isAvailable: true,
  seller: hazloSano,
};

const sueroNatural: CartProduct = {
  postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
  title: "Suero natural",
  slug: "suero-natural",
  price: 35,
  isAvailable: true,
  seller: hazloSano,
};

function groupOf(products: CartProduct[], quantities: number[]) {
  const lines = buildCartLines(
    products.map((product, index) => ({
      postId: product.postId,
      quantity: quantities[index],
    })),
    products,
  );

  return groupBySeller(lines)[0];
}

describe("buildWhatsappCartMessage", () => {
  it("lista cantidades, importes, enlaces y el total", () => {
    const message = buildWhatsappCartMessage(
      groupOf([jugoVerde, sueroNatural], [2, 1]),
      baseUrl,
      labels,
    );

    expect(message).toBe(
      [
        "Hola, quiero pedir:",
        "",
        "2 × Jugo Verde — $80",
        "https://hazlosano.com/jugo-verde",
        "1 × Suero natural — $35",
        "https://hazlosano.com/suero-natural",
        "",
        "Total: $115",
      ].join("\n"),
    );
  });

  it("no le pide al vendedor lo que él mismo marcó como agotado", () => {
    const message = buildWhatsappCartMessage(
      groupOf([jugoVerde, { ...sueroNatural, isAvailable: false }], [1, 1]),
      baseUrl,
      labels,
    );

    expect(message).toContain("Jugo Verde");
    expect(message).not.toContain("Suero natural");
    // El subtotal ya venía sin lo agotado: el mensaje y la pantalla dicen la misma cifra.
    expect(message).toContain("Total: $40");
  });

  it("sin nada disponible no hay mensaje que mandar", () => {
    expect(
      buildWhatsappCartMessage(
        groupOf([{ ...jugoVerde, isAvailable: false }], [1]),
        baseUrl,
        labels,
      ),
    ).toBeNull();
  });
});

describe("buildWhatsappCartLink", () => {
  it("escribe al teléfono de la tienda, con la lada que pide wa.me", () => {
    const link = buildWhatsappCartLink(
      groupOf([jugoVerde], [1]),
      baseUrl,
      labels,
    );

    expect(link?.startsWith("https://wa.me/522781126948?text=")).toBe(true);
  });

  it("codifica el mensaje para que sobreviva a la URL", () => {
    const link = buildWhatsappCartLink(
      groupOf([jugoVerde], [2]),
      baseUrl,
      labels,
    );

    expect(link).toContain("%0A");
    expect(link).not.toContain(" ");
  });

  it("una tienda sin teléfono no ofrece un enlace roto", () => {
    const group = groupOf([jugoVerde], [1]);

    expect(
      buildWhatsappCartLink(
        { ...group, seller: { ...group.seller, phone: null } },
        baseUrl,
        labels,
      ),
    ).toBeNull();
  });
});
