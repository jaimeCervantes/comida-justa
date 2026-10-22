import { describe, expect, it, vi } from "vitest";

/* El módulo importa el repositorio por `loadHomeOffers`; aquí se inyecta otro cargador. */
vi.mock("~/infra/dataAccess/getMultiplePosts", () => ({
  createPostQueryRepository: vi.fn(),
}));

import type { BannerPromotion } from "~/domain/entities/post/promotionBanner";
import type { HomeOffers } from "./homeOffers";
import { offersBannerUrls, warmOffersBanners } from "./warmOffersBanners";

const miel: BannerPromotion = {
  postId: "miel",
  title: "Miel de abeja 500 g",
  slug: "miel",
  imageUrl: "https://fotos.example/miel.webp",
  price: 150,
  regularPrice: 180,
  discountPercent: 17,
  endsAt: null,
  brand: "Apis",
  store: null,
};

const conOfertas = async (): Promise<HomeOffers> => ({
  general: [miel],
  groups: [
    {
      key: "brand:apis",
      label: "Apis",
      filter: { brand: "Apis" },
      promotions: [miel, { ...miel, postId: "miel-kilo" }],
      count: 2,
    },
  ],
  total: 2,
});

const sinOfertas = async (): Promise<HomeOffers> => ({
  general: [],
  groups: [],
  total: 0,
});

describe("warmOffersBanners", () => {
  it("pide cada slide en cada formato y cada idioma, contra el origen de quien guardó", async () => {
    const fetcher = vi.fn<[string], Promise<unknown>>(async () => undefined);

    const warmed = await warmOffersBanners("http://localhost:3100", {
      load: conOfertas,
      fetcher,
    });
    const pedidas = fetcher.mock.calls.map(([url]) => String(url));

    /* 2 slides × 2 formatos × 2 idiomas. */
    expect(warmed).toBe(8);
    expect(
      pedidas.every((url) =>
        url.startsWith("http://localhost:3100/api/ofertas/banner?"),
      ),
    ).toBe(true);
    expect(pedidas).toContain(
      `http://localhost:3100${(await offersBannerUrls(conOfertas))[0]}`,
    );
    expect(pedidas.some((url) => url.includes("marca=Apis"))).toBe(true);
    expect(pedidas.some((url) => url.includes("locale=en"))).toBe(true);
  });

  it("sin ofertas no pide nada", async () => {
    const fetcher = vi.fn<[string], Promise<unknown>>(async () => undefined);

    expect(
      await warmOffersBanners("http://localhost:3100", {
        load: sinOfertas,
        fetcher,
      }),
    ).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("nunca falla: si una imagen o la base fallan, sigue con las demás", async () => {
    const fetcher = vi
      .fn<[string], Promise<unknown>>()
      .mockRejectedValueOnce(new Error("se cayó"))
      .mockResolvedValue(undefined);

    await expect(
      warmOffersBanners("http://localhost:3100", { load: conOfertas, fetcher }),
    ).resolves.toBe(7);
    await expect(
      warmOffersBanners("http://localhost:3100", {
        load: () => Promise.reject(new Error("sin base")),
        fetcher,
      }),
    ).resolves.toBe(0);
  });
});
