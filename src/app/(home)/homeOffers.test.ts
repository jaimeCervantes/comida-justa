import { describe, expect, it, vi } from "vitest";

/* La función que se prueba no lee la base; el módulo sí importa el repositorio para `loadHomeOffers`. */
vi.mock("~/infra/dataAccess/getMultiplePosts", () => ({
  createPostQueryRepository: vi.fn(),
}));

import type { BannerPromotion } from "~/domain/entities/post/promotionBanner";
import { buildHomeOffersBanner } from "./homeOffers";

const miel: BannerPromotion = {
  postId: "miel",
  title: "Miel de abeja 500 g",
  slug: "miel-de-abeja-500-g",
  imageUrl: "https://fotos.example/miel.webp",
  price: 150,
  regularPrice: 180,
  discountPercent: 17,
  endsAt: null,
};

const texts = {
  alt: (items: string) => `Ofertas: ${items}`,
  item: (promotion: BannerPromotion) =>
    `${promotion.title} -${promotion.discountPercent}%`,
};

describe("buildHomeOffersBanner", () => {
  it("sin ofertas no hay banner", () => {
    expect(
      buildHomeOffersBanner({ promotions: [], fingerprint: "x" }, "es", texts),
    ).toBeNull();
  });

  it("la dirección lleva el idioma y la huella, y el alt nombra cada oferta", () => {
    const cafe = {
      ...miel,
      postId: "cafe",
      title: "Café",
      discountPercent: 50,
    };

    expect(
      buildHomeOffersBanner(
        { promotions: [cafe, miel], fingerprint: "k3x9" },
        "en",
        texts,
      ),
    ).toEqual({
      images: {
        ancho: "/api/ofertas/banner?locale=en&formato=ancho&v=k3x9",
        compacto: "/api/ofertas/banner?locale=en&formato=compacto&v=k3x9",
      },
      alt: "Ofertas: Café -50%, Miel de abeja 500 g -17%",
      count: 2,
    });
  });
});
