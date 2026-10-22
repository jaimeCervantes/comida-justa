import { describe, expect, it } from "vitest";
import {
  activeBannerPromotions,
  type BannerCandidate,
  groupBannerPromotions,
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
    brand: null,
    store: { handle: "hazlo-sano", name: "Hazlo Sano" },
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

/**
 * La corrida de escritorio de `ofertasEnPortada.feature` (@slice-2 @component): las mismas siete
 * ofertas de la tabla, con su marca, su tienda y su descuento sobre un precio de 100.
 */
describe("groupBannerPromotions", () => {
  const laLuz = { handle: "la-luz", name: "La Luz" };
  const hazloSano = { handle: "hazlo-sano", name: "Hazlo Sano" };
  const oferta = (
    title: string,
    brand: string | null,
    store: { handle: string; name: string },
    discount: number,
  ) =>
    candidate({ title, brand, store, price: 100, salePrice: 100 - discount });

  const TABLA = [
    oferta("Falcon Protein Vegana", "Birdman", hazloSano, 21),
    oferta("Falcon Golden Vanilla", "birdman", hazloSano, 20),
    oferta("Smoothie Verde Detox", "Amarosana", hazloSano, 15),
    oferta("Smoothie Frutos Rojos", "Amarosana", hazloSano, 10),
    oferta("Miel de abeja 500 g", "Apis", hazloSano, 17),
    oferta("Pan de masa madre", null, laLuz, 12),
    oferta("Pan de centeno", null, laLuz, 8),
  ];

  const slides = () =>
    groupBannerPromotions(activeBannerPromotions(TABLA, NOW)).map(
      (group) =>
        `${group.label}: ${group.promotions.map((p) => p.title).join(", ")}`,
    );

  it("un slide por marca y, sin marca, por tienda; la marca sin distinguir mayúsculas", () => {
    expect(slides()).toEqual([
      "Birdman: Falcon Protein Vegana, Falcon Golden Vanilla",
      "Amarosana: Smoothie Verde Detox, Smoothie Frutos Rojos",
      "La Luz: Pan de masa madre, Pan de centeno",
    ]);
  });

  it("filtra el catálogo por la marca o por la tienda del grupo", () => {
    const groups = groupBannerPromotions(activeBannerPromotions(TABLA, NOW));

    expect(groups.map((group) => group.filter)).toEqual([
      { brand: "Birdman" },
      { brand: "Amarosana" },
      { store: "la-luz" },
    ]);
  });

  it("un grupo que junta todas las ofertas no tiene slide: repetiría el general", () => {
    const todasDeHazloSano = [
      oferta("Falcon Protein Vegana", null, hazloSano, 21),
      oferta("Falcon Golden Vanilla", null, hazloSano, 20),
    ];

    expect(
      groupBannerPromotions(activeBannerPromotions(todasDeHazloSano, NOW)),
    ).toEqual([]);
  });

  it("no pasa de cuatro grupos", () => {
    const muchas = ["A", "B", "C", "D", "E", "F"].flatMap((marca) => [
      oferta(`${marca} 1`, marca, hazloSano, 20),
      oferta(`${marca} 2`, marca, hazloSano, 10),
    ]);

    expect(
      groupBannerPromotions(activeBannerPromotions(muchas, NOW)),
    ).toHaveLength(4);
  });
});
