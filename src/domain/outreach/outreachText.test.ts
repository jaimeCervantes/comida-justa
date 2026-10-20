import { describe, expect, it } from "vitest";
import { addedInOrder } from "./__fixtures__/listedProduct";
import { buildOutreachKit, composeOutreachText } from "./outreachText";

const LIST = ["🌾 Natural — $96"];

/** «⏎» del `.feature`, para que la tabla se lea igual aquí que allá. */
function lines(text: string): string {
  return text.replaceAll("⏎", "\n");
}

describe("el texto para grupos", () => {
  describe("se arma con lo que haya antes y después de la lista", () => {
    it.each([
      {
        antes: "Hay pan:",
        despues: "Pedidos por WhatsApp",
        texto: "Hay pan:⏎⏎🌾 Natural — $96⏎⏎Pedidos por WhatsApp",
      },
      {
        antes: "",
        despues: "Pedidos por WhatsApp",
        texto: "🌾 Natural — $96⏎⏎Pedidos por WhatsApp",
      },
      {
        antes: "Hay pan:",
        despues: "",
        texto: "Hay pan:⏎⏎🌾 Natural — $96",
      },
    ])('antes "$antes", después "$despues"', ({ antes, despues, texto }) => {
      expect(
        composeOutreachText({ opening: antes, closing: despues }, LIST),
      ).toBe(lines(texto));
    });
  });

  it("sin renglones no hay texto, aunque haya qué decir alrededor", () => {
    expect(
      composeOutreachText({ opening: "Hay pan:", closing: "Pedidos" }, []),
    ).toBeNull();
  });

  // Un `<textarea>` manda `\r\n`, y los textos que vinieron del bot traen `\r` sueltos.
  it("los saltos de renglón llegan como los entiende quien pega", () => {
    expect(
      composeOutreachText(
        { opening: "¿Te inflama el pan comercial?\r\nHay pan:", closing: "\r" },
        LIST,
      ),
    ).toBe("¿Te inflama el pan comercial?\nHay pan:\n\n🌾 Natural — $96");
  });

  // Lo que sobra en los extremos es del formulario; lo de dentro es de quien escribió.
  it("recorta los extremos y respeta lo de dentro", () => {
    expect(
      composeOutreachText(
        {
          opening: "\n\n✅ Digestión Ligera\n\n✅ 100% Natural  \n",
          closing: "",
        },
        LIST,
      ),
    ).toBe("✅ Digestión Ligera\n\n✅ 100% Natural\n\n🌾 Natural — $96");
  });

  it("el kit dice qué quedó fuera aunque el texto no tenga nada que anunciar", () => {
    const kit = buildOutreachKit(
      { opening: "Hay pan:", closing: "" },
      addedInOrder([
        { label: "Canela", price: 125, stockQuantity: 0, isAvailable: false },
      ]),
    );

    expect(kit.text).toBeNull();
    expect(kit.excluded).toEqual([
      expect.objectContaining({ label: "Canela", reason: "out-of-stock" }),
    ]);
  });

  /* El escenario principal del slice 1, entero: el texto de masa madre con los cinco panes
     sembrados. Si esta prueba y la de Playwright difieren, una de las dos lee mal el `.feature`. */
  /** La corrida de escritorio del slice 5: la versión, la lista, lo de después y el pie. */
  describe("se arma con su versión, la lista, lo de después y el pie", () => {
    it.each([
      {
        despues: "MM Naturalmente",
        pie: "📲 Pedidos WhatsApp",
        texto:
          "Hay pan:⏎⏎🌾 Natural — $96⏎⏎MM Naturalmente⏎⏎📲 Pedidos WhatsApp",
      },
      {
        despues: "",
        pie: "📲 Pedidos WhatsApp",
        texto: "Hay pan:⏎⏎🌾 Natural — $96⏎⏎📲 Pedidos WhatsApp",
      },
      {
        despues: "MM Naturalmente",
        pie: "",
        texto: "Hay pan:⏎⏎🌾 Natural — $96⏎⏎MM Naturalmente",
      },
    ])('después "$despues", pie "$pie"', ({ despues, pie, texto }) => {
      expect(
        composeOutreachText(
          { opening: "Hay pan:", closing: despues, footer: pie },
          LIST,
        ),
      ).toBe(lines(texto));
    });

    it("cada versión comparte la lista, lo de después y el pie", () => {
      const kit = buildOutreachKit(
        {
          opening: "¿Te inflama el pan comercial?",
          versions: ["Masa madre de verdad, hecha aquí."],
          closing: "MM Naturalmente",
          footer: "📲 Pedidos WhatsApp",
        },
        addedInOrder([{ label: "Natural", emoji: "🌾", price: 96 }]),
      );

      expect(kit.versions).toEqual([
        "¿Te inflama el pan comercial?\n\n🌾 Natural — $96\n\nMM Naturalmente\n\n📲 Pedidos WhatsApp",
        "Masa madre de verdad, hecha aquí.\n\n🌾 Natural — $96\n\nMM Naturalmente\n\n📲 Pedidos WhatsApp",
      ]);
      expect(kit.text).toBe(kit.versions[0]);
    });

    it("sin nada disponible no hay ninguna versión que copiar", () => {
      const kit = buildOutreachKit(
        { opening: "Hay pan:", versions: ["Otra"], closing: "" },
        addedInOrder([
          { label: "Canela", price: 125, stockQuantity: 0, isAvailable: false },
        ]),
      );

      expect(kit.versions).toEqual([]);
      expect(kit.text).toBeNull();
    });
  });

  it("arma el texto de masa madre tal cual lo pide el escenario principal", () => {
    const kit = buildOutreachKit(
      {
        opening:
          "¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948\n" +
          "🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:",
        closing: "📲 Pedidos WhatsApp: https://wa.me/522781126948",
      },
      addedInOrder([
        { label: "Natural", emoji: "🌾", price: 96, stockQuantity: 2 },
        { label: "Semillas", emoji: "🌻", price: 125, stockQuantity: 5 },
        { label: "Arándanos", price: 125, stockQuantity: 5 },
        { label: "Canela", price: 125, stockQuantity: 2 },
        {
          label: "Chocolate Orgánico",
          emoji: "🍫",
          price: 136,
          stockQuantity: 5,
        },
      ]),
    );

    expect(kit.text).toBe(
      [
        "¿Te inflama el pan comercial? Pásate a la Masa Madre en Hazlo Sano. 📲2781126948",
        "🛒 DISPONIBLES EN TIENDA (1 kg). Pasa por el tuyo a Hazlo Sano:",
        "",
        "🌾 Natural — $96",
        "🌻 Semillas / Arándanos / Canela — $125",
        "🍫 Chocolate Orgánico — $136",
        "",
        "📲 Pedidos WhatsApp: https://wa.me/522781126948",
      ].join("\n"),
    );
    expect(kit.excluded).toEqual([]);
  });
});
