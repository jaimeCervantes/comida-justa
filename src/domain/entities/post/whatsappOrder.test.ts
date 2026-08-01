import { describe, expect, it } from "vitest";
import {
  buildWhatsappOrderLink,
  buildWhatsappOrderMessage,
} from "./whatsappOrder";

// Datos reales del catálogo: "Jugo Verde" a 40, con el WhatsApp que dejó la migración.
const jugoVerde = {
  title: "Jugo Verde",
  price: 40,
  url: "https://hazlosano.com/jugo-verde",
};

describe("buildWhatsappOrderMessage", () => {
  it("nombra el producto, su precio y su enlace", () => {
    expect(buildWhatsappOrderMessage(jugoVerde)).toBe(
      "Hola, me interesa:\nJugo Verde — $40\nhttps://hazlosano.com/jugo-verde",
    );
  });

  it("omite el precio cuando la publicación no lo tiene", () => {
    expect(buildWhatsappOrderMessage({ ...jugoVerde, price: null })).toBe(
      "Hola, me interesa:\nJugo Verde\nhttps://hazlosano.com/jugo-verde",
    );
  });
});

describe("buildWhatsappOrderLink", () => {
  // Corrida de escritorio del Scenario Outline "El teléfono del pedido sale del primero
  // que sirva" en sellerStore.feature.
  it.each([
    ["522781126948", "2781126948", "https://wa.me/522781126948"],
    [null, "2781092116", "https://wa.me/522781092116"],
    ["", "2781092116", "https://wa.me/522781092116"],
  ])(
    "con whatsapp %j y teléfono %j escribe a %s",
    (whatsapp, phone, expectedPrefix) => {
      const link = buildWhatsappOrderLink({ ...jugoVerde, whatsapp, phone });

      expect(link?.startsWith(`${expectedPrefix}?text=`)).toBe(true);
    },
  );

  it("no ofrece enlace cuando no hay a quién escribirle", () => {
    expect(
      buildWhatsappOrderLink({ ...jugoVerde, whatsapp: null, phone: null }),
    ).toBeNull();
  });

  it("codifica el mensaje para que sobreviva a la URL", () => {
    const link = buildWhatsappOrderLink({ ...jugoVerde, phone: "2781092116" });

    // El salto de línea y el acento del guion largo no pueden viajar en crudo.
    expect(link).toContain("Jugo%20Verde");
    expect(link).toContain("%0A");
    expect(link).not.toContain(" ");
  });
});
