import { describe, expect, it } from "vitest";
import {
  currentPrice,
  isPromotionActive,
  parseOnSaleFilter,
  validatePromotion,
} from "./promotion";

const NOW = new Date("2026-10-20T12:00:00Z");
const TOMORROW = new Date("2026-10-21T12:00:00Z");
const YESTERDAY = new Date("2026-10-19T12:00:00Z");

describe("isPromotionActive", () => {
  it("sin fecha de fin, dura hasta que se quite", () => {
    expect(isPromotionActive({ price: 180, salePrice: 150 }, NOW)).toBe(true);
  });

  it("con fecha futura, sigue vigente", () => {
    expect(
      isPromotionActive(
        { price: 180, salePrice: 150, saleEndsAt: TOMORROW },
        NOW,
      ),
    ).toBe(true);
  });

  /* Nadie la apaga: pasada la fecha, deja de aplicar sola. */
  it("con fecha pasada, ya no aplica", () => {
    expect(
      isPromotionActive(
        { price: 180, salePrice: 150, saleEndsAt: YESTERDAY },
        NOW,
      ),
    ).toBe(false);
  });

  it("termina justo a la hora de fin", () => {
    expect(
      isPromotionActive({ price: 180, salePrice: 150, saleEndsAt: NOW }, NOW),
    ).toBe(false);
  });

  it("acepta la fecha como texto, como llega de la base o de un formulario", () => {
    expect(
      isPromotionActive(
        { price: 180, salePrice: 150, saleEndsAt: TOMORROW.toISOString() },
        NOW,
      ),
    ).toBe(true);
  });

  it("sin rebaja no hay promoción", () => {
    expect(isPromotionActive({ price: 180, salePrice: null }, NOW)).toBe(false);
    expect(isPromotionActive({ price: 180 }, NOW)).toBe(false);
  });

  /* La base lo impide; si algún día no, cobrar el normal es el error barato. */
  it("una rebaja que no es menor al precio no se aplica", () => {
    expect(isPromotionActive({ price: 180, salePrice: 180 }, NOW)).toBe(false);
    expect(isPromotionActive({ price: 180, salePrice: 200 }, NOW)).toBe(false);
  });
});

describe("currentPrice", () => {
  it("en promoción cobra la rebaja y tacha el normal", () => {
    expect(
      currentPrice({ price: 180, salePrice: 150, saleEndsAt: TOMORROW }, NOW),
    ).toEqual({
      price: 150,
      regularPrice: 180,
      discountPercent: 17,
      endsAt: TOMORROW,
    });
  });

  it("sin promoción cobra el normal y no tacha nada", () => {
    expect(currentPrice({ price: 180 }, NOW)).toEqual({
      price: 180,
      regularPrice: null,
      discountPercent: null,
      endsAt: null,
    });
  });

  it("vencida, cobra el normal", () => {
    expect(
      currentPrice({ price: 180, salePrice: 150, saleEndsAt: YESTERDAY }, NOW)
        .price,
    ).toBe(180);
  });

  it("redondea el porcentaje al entero", () => {
    expect(
      currentPrice({ price: 125, salePrice: 96 }, NOW).discountPercent,
    ).toBe(23);
  });
});

describe("validatePromotion", () => {
  it("sin promoción no hay nada que validar", () => {
    expect(validatePromotion({ price: 180 })).toBeNull();
    expect(
      validatePromotion({ price: 180, salePrice: null, saleEndsAt: null }),
    ).toBeNull();
  });

  it("una rebaja menor al precio, con o sin fecha, es válida", () => {
    expect(validatePromotion({ price: 180, salePrice: 150 })).toBeNull();
    expect(
      validatePromotion({ price: 180, salePrice: 150, saleEndsAt: TOMORROW }),
    ).toBeNull();
  });

  /* Poner una fecha ya pasada es una forma de terminarla: no se rechaza. */
  it("acepta una fecha de fin ya pasada", () => {
    expect(
      validatePromotion({ price: 180, salePrice: 150, saleEndsAt: YESTERDAY }),
    ).toBeNull();
  });

  it.each([180, 200])("rechaza una rebaja de %s sobre 180", (salePrice) => {
    expect(validatePromotion({ price: 180, salePrice })).toBe(
      "sale-price-not-below-price",
    );
  });

  it.each([0, -10, Number.NaN])("rechaza una rebaja de %s", (salePrice) => {
    expect(validatePromotion({ price: 180, salePrice })).toBe(
      "invalid-sale-price",
    );
  });

  it("sin precio normal no hay nada que rebajar", () => {
    expect(validatePromotion({ price: null, salePrice: 150 })).toBe(
      "sale-price-not-below-price",
    );
  });

  it("rechaza una fecha de fin sin rebaja", () => {
    expect(validatePromotion({ price: 180, saleEndsAt: TOMORROW })).toBe(
      "sale-ends-without-sale-price",
    );
  });

  it("rechaza una fecha ilegible", () => {
    expect(
      validatePromotion({ price: 180, salePrice: 150, saleEndsAt: "mañana" }),
    ).toBe("invalid-sale-end");
  });
});

describe("parseOnSaleFilter", () => {
  it.each([
    ["1", true],
    [undefined, false],
    ["", false],
    ["0", false],
    ["si", false],
    [["1"], false],
  ])("%j → %s", (value, expected) => {
    expect(parseOnSaleFilter(value)).toBe(expected);
  });
});
