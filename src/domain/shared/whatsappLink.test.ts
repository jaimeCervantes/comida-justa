import { describe, expect, it } from "vitest";
import { toWhatsappNumber, whatsappLink } from "./whatsappLink";

describe("toWhatsappNumber", () => {
  // Las dos formas que conviven en la base: `contact_phone` a 10 dígitos y
  // `contact_whatsapp` ya con lada, que dejó la migración del catálogo del bot.
  it.each([
    ["2781126948", "522781126948"],
    ["522781126948", "522781126948"],
    ["+52 278 112 6948", "522781126948"],
    ["(278) 112-6948", "522781126948"],
  ])("%j → %j", (input, expected) => {
    expect(toWhatsappNumber(input)).toBe(expected);
  });

  it.each([null, undefined, "", "sin dígitos"])("%j no da número", (input) => {
    expect(toWhatsappNumber(input)).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("arma el enlace con el mensaje codificado", () => {
    expect(whatsappLink("2781126948", "Hola, ¿tienes pan?")).toBe(
      "https://wa.me/522781126948?text=Hola%2C%20%C2%BFtienes%20pan%3F",
    );
  });

  it("devuelve null sin número, para que nadie pinte un enlace roto", () => {
    expect(whatsappLink(null, "Hola")).toBeNull();
  });
});
