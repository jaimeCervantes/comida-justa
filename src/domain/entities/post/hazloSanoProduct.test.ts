import { describe, it, expect } from "vitest";
import { isHazloSanoProduct, PRODUCT_KIND } from "./hazloSanoProduct";

describe("isHazloSanoProduct", () => {
  it("is true only when it is a product AND its origin is hazlo_sano_*", () => {
    expect(
      isHazloSanoProduct({ kind: "producto", origin: "hazlo_sano_propio" }),
    ).toBe(true);
    expect(
      isHazloSanoProduct({ kind: "producto", origin: "hazlo_sano_reventa" }),
    ).toBe(true);
  });

  it("is false for a community product", () => {
    expect(
      isHazloSanoProduct({ kind: "producto", origin: "productor_local" }),
    ).toBe(false);
    expect(isHazloSanoProduct({ kind: "producto", origin: null })).toBe(false);
  });

  it("is false for an anuncio, even one from Hazlo Sano", () => {
    expect(
      isHazloSanoProduct({ kind: "anuncio", origin: "hazlo_sano_propio" }),
    ).toBe(false);
  });

  it("is false for missing or unknown kinds", () => {
    expect(isHazloSanoProduct({ origin: "hazlo_sano_propio" })).toBe(false);
    expect(
      isHazloSanoProduct({ kind: "oferta", origin: "hazlo_sano_propio" }),
    ).toBe(false);
  });

  it("exposes the product kind used by the listing", () => {
    expect(PRODUCT_KIND).toBe("producto");
  });
});
