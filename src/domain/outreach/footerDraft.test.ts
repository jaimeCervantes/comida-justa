import { describe, expect, it } from "vitest";
import { validateOutreachFooterDraft } from "./footerDraft";

/** La corrida de escritorio del slice 5 de `difusionEnGrupos.feature`. */
describe("un pie se guarda solo con su nombre y algo que decir", () => {
  it.each([
    {
      caso: "se guarda",
      pie: {
        name: "Hazlo Sano",
        body: "📲 Pedidos WhatsApp: wa.me/522781126948",
      },
      resultado: {
        footer: {
          name: "Hazlo Sano",
          body: "📲 Pedidos WhatsApp: wa.me/522781126948",
        },
      },
    },
    {
      caso: "se pide el nombre",
      pie: { name: " ", body: "📲 Pedidos WhatsApp: wa.me/522781126948" },
      resultado: { errors: { name: "required" } },
    },
    {
      caso: "se pide el texto",
      pie: { name: "Hazlo Sano", body: "\n  \n" },
      resultado: { errors: { body: "required" } },
    },
  ])("$caso", ({ pie, resultado }) => {
    expect(validateOutreachFooterDraft(pie)).toEqual(resultado);
  });

  it("guarda el texto con saltos de renglón \\n y sin espacios en los extremos", () => {
    expect(
      validateOutreachFooterDraft({
        name: "  Hazlo Sano ",
        body: "\r\n📍 Ubicación\r\n📲 WhatsApp\r\n",
      }).footer,
    ).toEqual({ name: "Hazlo Sano", body: "📍 Ubicación\n📲 WhatsApp" });
  });
});
