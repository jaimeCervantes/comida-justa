import { describe, expect, it } from "vitest";
import {
  normalizeChannelUrl,
  type OutreachChannelDraft,
  validateOutreachChannelDraft,
} from "./outreachChannelDraft";

const COMPRA_VENTA: OutreachChannelDraft = {
  name: "Compra Venta Orizaba",
  url: "https://www.facebook.com/groups/compraventaorizaba",
  format: "listing",
  minDaysBetween: "7",
  notes: "Solo los sábados, con foto y precio",
};

function draft(overrides: Partial<OutreachChannelDraft>): OutreachChannelDraft {
  return { ...COMPRA_VENTA, ...overrides };
}

/** La corrida de escritorio del slice 3 de `difusionEnGrupos.feature`. */
describe("un grupo se guarda solo con lo que Facebook entiende", () => {
  it("se guarda", () => {
    expect(validateOutreachChannelDraft(COMPRA_VENTA)).toEqual({
      channel: {
        name: "Compra Venta Orizaba",
        url: "https://www.facebook.com/groups/compraventaorizaba",
        format: "listing",
        minDaysBetween: 7,
        notes: "Solo los sábados, con foto y precio",
      },
    });
  });

  it('sin "https://" se guarda con él', () => {
    expect(
      validateOutreachChannelDraft(
        draft({ url: "facebook.com/groups/compraventaorizaba" }),
      ).channel?.url,
    ).toBe("https://facebook.com/groups/compraventaorizaba");
  });

  it.each([
    {
      caso: "sin nombre",
      cambio: { name: "  " },
      errores: { name: "required" },
    },
    {
      caso: "una dirección con espacios",
      cambio: { url: "compra venta" },
      errores: { url: "invalid" },
    },
    {
      // Se pinta como enlace: un `javascript:` correría código en la sesión del admin.
      caso: "un esquema que no es de la web",
      cambio: { url: "javascript:alert(1)" },
      errores: { url: "invalid" },
    },
    {
      caso: "días negativos",
      cambio: { minDaysBetween: "-1" },
      errores: { minDaysBetween: "out-of-range" },
    },
    {
      caso: "más de un año",
      cambio: { minDaysBetween: "366" },
      errores: { minDaysBetween: "out-of-range" },
    },
    {
      caso: "días con decimales",
      cambio: { minDaysBetween: "1.5" },
      errores: { minDaysBetween: "out-of-range" },
    },
    {
      caso: "un tipo que no existe",
      cambio: { format: "subasta" },
      errores: { format: "invalid" },
    },
  ])("rechaza $caso", ({ cambio, errores }) => {
    expect(validateOutreachChannelDraft(draft(cambio))).toEqual({
      errors: errores,
    });
  });

  it("0 días se guarda: es sin límite", () => {
    expect(
      validateOutreachChannelDraft(draft({ minDaysBetween: "0" })).channel
        ?.minDaysBetween,
    ).toBe(0);
  });

  it("dice todo lo que falta a la vez", () => {
    expect(
      validateOutreachChannelDraft({
        name: "",
        url: "",
        format: "",
        minDaysBetween: "",
        notes: "",
      }).errors,
    ).toEqual({
      name: "required",
      url: "invalid",
      format: "invalid",
      minDaysBetween: "out-of-range",
    });
  });
});

describe("normalizeChannelUrl", () => {
  it.each([
    ["www.facebook.com/groups/123", "https://www.facebook.com/groups/123"],
    [
      "  https://m.facebook.com/groups/123  ",
      "https://m.facebook.com/groups/123",
    ],
    ["http://facebook.com/groups/abc", "http://facebook.com/groups/abc"],
  ])("%s → %s", (raw, url) => {
    expect(normalizeChannelUrl(raw)).toBe(url);
  });

  it.each([
    "",
    "localhost",
    "ftp://facebook.com/groups/1",
    "data:text/html,hola",
  ])("%j no es una dirección de grupo", (raw) => {
    expect(normalizeChannelUrl(raw)).toBeNull();
  });
});
