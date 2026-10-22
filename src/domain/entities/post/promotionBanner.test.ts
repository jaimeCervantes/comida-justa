import { describe, expect, it } from "vitest";
import {
  type BannerCandidate,
  promotionsFingerprint,
  selectBannerPromotions,
} from "./promotionBanner";

const NOW = new Date("2026-10-21T12:00:00Z");

let sequence = 0;

/** "Miel de abeja 500 g" a 180, rebajada a 150 y con foto: el caso que entra sin más. */
function candidate(overrides: Partial<BannerCandidate> = {}): BannerCandidate {
  sequence += 1;

  return {
    postId: `post-${sequence}`,
    title: "Miel de abeja 500 g",
    slug: `miel-${sequence}`,
    imageUrl: "https://fotos.example/miel.webp",
    price: 180,
    salePrice: 150,
    saleEndsAt: null,
    ...overrides,
  };
}

describe("selectBannerPromotions", () => {
  it("resuelve la promoción: lo que se cobra, lo que se tacha y cuánto se ahorra", () => {
    const [miel] = selectBannerPromotions([candidate()], NOW);

    expect(miel).toMatchObject({
      title: "Miel de abeja 500 g",
      price: 150,
      regularPrice: 180,
      discountPercent: 17,
    });
  });

  it.each([
    ["sin promoción", { salePrice: null }],
    ["con la promoción vencida", { saleEndsAt: "2026-10-20T12:00:00Z" }],
    ["sin foto", { imageUrl: null }],
  ])("deja fuera una publicación %s", (_why, overrides) => {
    expect(selectBannerPromotions([candidate(overrides)], NOW)).toEqual([]);
  });

  it("pone primero el descuento más grande y, a igual descuento, respeta el orden de llegada", () => {
    const panela = candidate({
      title: "Panela 1 kg",
      price: 90,
      salePrice: 81,
    });
    const miel = candidate({ title: "Miel", price: 180, salePrice: 150 });
    const cafe = candidate({ title: "Café", price: 200, salePrice: 100 });
    const avena = candidate({ title: "Avena", price: 60, salePrice: 54 });

    expect(
      selectBannerPromotions([panela, miel, cafe, avena], NOW).map(
        (promotion) => `${promotion.title} -${promotion.discountPercent}%`,
      ),
    ).toEqual(["Café -50%", "Miel -17%", "Panela 1 kg -10%", "Avena -10%"]);
  });

  it("no pasa de cuatro, lo que cabe en la rejilla", () => {
    const many = Array.from({ length: 6 }, () => candidate());

    expect(selectBannerPromotions(many, NOW)).toHaveLength(4);
  });
});

describe("promotionsFingerprint", () => {
  const [miel] = selectBannerPromotions([candidate({ postId: "miel" })], NOW);

  it("es la misma para el mismo conjunto", () => {
    expect(promotionsFingerprint([miel])).toBe(promotionsFingerprint([miel]));
  });

  it.each([
    ["el precio rebajado", { price: 140 }],
    ["la foto", { imageUrl: "https://fotos.example/otra.webp" }],
    ["la fecha de fin", { endsAt: new Date("2026-11-30T23:59:00Z") }],
  ])("cambia cuando cambia %s", (_what, change) => {
    expect(promotionsFingerprint([{ ...miel, ...change }])).not.toBe(
      promotionsFingerprint([miel]),
    );
  });

  it("cambia cuando entra o sale un producto", () => {
    const [cafe] = selectBannerPromotions([candidate({ postId: "cafe" })], NOW);

    expect(promotionsFingerprint([miel, cafe])).not.toBe(
      promotionsFingerprint([miel]),
    );
  });
});
