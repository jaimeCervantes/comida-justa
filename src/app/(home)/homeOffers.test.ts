import { describe, expect, it, vi } from "vitest";

/* La función que se prueba no lee la base; el módulo sí importa el repositorio para `loadHomeOffers`. */
vi.mock("~/infra/dataAccess/getMultiplePosts", () => ({
  createPostQueryRepository: vi.fn(),
}));

import type {
  BannerGroup,
  BannerPromotion,
} from "~/domain/entities/post/promotionBanner";
import { buildHomeOffersSlides } from "./homeOffers";

const miel: BannerPromotion = {
  postId: "miel",
  title: "Miel de abeja 500 g",
  slug: "miel-de-abeja-500-g",
  imageUrl: "https://fotos.example/miel.webp",
  price: 150,
  regularPrice: 180,
  discountPercent: 17,
  endsAt: null,
  brand: "Apis",
  store: { handle: "hazlo-sano", name: "Hazlo Sano" },
};
const miel1kg: BannerPromotion = {
  ...miel,
  postId: "miel-1kg",
  title: "Miel 1 kg",
};

const texts = {
  alt: (items: string, label: string | null) =>
    label ? `Ofertas de ${label}: ${items}` : `Ofertas: ${items}`,
  item: (promotion: BannerPromotion) =>
    `${promotion.title} -${promotion.discountPercent}%`,
};

const apis: BannerGroup = {
  key: "brand:apis",
  label: "Apis",
  filter: { brand: "Apis" },
  promotions: [miel, miel1kg],
  count: 2,
};

describe("buildHomeOffersSlides", () => {
  it("sin ofertas no hay slides, y la página pinta el hero", () => {
    expect(
      buildHomeOffersSlides({ general: [], groups: [], total: 0 }, "es", texts),
    ).toEqual([]);
  });

  it("el general primero, y después uno por grupo que lleva al catálogo de esa marca", () => {
    const [general, grupo] = buildHomeOffersSlides(
      { general: [miel], groups: [apis], total: 3 },
      "en",
      texts,
    );

    expect(general).toMatchObject({
      key: "general",
      label: null,
      alt: "Ofertas: Miel de abeja 500 g -17%",
      catalogQuery: { promocion: "1" },
    });
    expect(general.images.ancho).toMatch(
      /^\/api\/ofertas\/banner\?locale=en&formato=ancho&v=\w+\.\w+$/,
    );
    expect(grupo).toMatchObject({
      key: "brand:apis",
      label: "Apis",
      alt: "Ofertas de Apis: Miel de abeja 500 g -17%, Miel 1 kg -17%",
      catalogQuery: { promocion: "1", marca: "Apis" },
    });
    expect(grupo.images.compacto).toContain("formato=compacto&marca=Apis&v=");
  });

  it("cada slide tiene su propia huella: cambia la de uno sin tocar la del otro", () => {
    const antes = buildHomeOffersSlides(
      { general: [miel], groups: [apis], total: 3 },
      "es",
      texts,
    );
    const despues = buildHomeOffersSlides(
      {
        general: [miel],
        groups: [{ ...apis, promotions: [miel, { ...miel1kg, price: 140 }] }],
        total: 3,
      },
      "es",
      texts,
    );

    expect(despues[0].images.ancho).toBe(antes[0].images.ancho);
    expect(despues[1].images.ancho).not.toBe(antes[1].images.ancho);
  });
});
