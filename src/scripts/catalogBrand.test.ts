import { describe, expect, it } from "vitest";
import { catalogBrand } from "./catalogBrand";

/** `ofertasEnPortada.feature` (@slice-2 @component): el importador guarda la marca del catálogo. */
describe("catalogBrand", () => {
  it.each([
    [{ supplierName: "Birdman" }, "Birdman"],
    [{ supplierName: "  Amarosana  " }, "Amarosana"],
    [{ supplierName: "" }, null],
    [{}, null],
  ])("%j → %j", (product, expected) => {
    expect(catalogBrand(product)).toBe(expected);
  });
});
