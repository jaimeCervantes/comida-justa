import { describe, expect, it } from "vitest";
import { SellerPhoneInvalidError } from "./errors";
import { normalizeSellerPhone } from "./phone";

describe("normalizeSellerPhone", () => {
  // El número de la única tienda que existe hoy, escrito de las formas en que se teclea.
  it.each([
    ["2781126948", "2781126948"],
    ["+52 278 112 6948", "2781126948"],
    ["52 278 112 6948", "2781126948"],
    ["(278) 112-6948", "2781126948"],
  ])("%j se guarda como %j", (input, expected) => {
    expect(normalizeSellerPhone(input)).toBe(expected);
  });

  it.each(["123", "", null, undefined, "27811269481234"])(
    "%j no es un teléfono utilizable",
    (input) => {
      expect(() => normalizeSellerPhone(input)).toThrow(
        SellerPhoneInvalidError,
      );
    },
  );
});
