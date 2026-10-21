import { describe, expect, it } from "vitest";
import { listedProduct } from "./__fixtures__/listedProduct";
import {
  buildListingArticles,
  formatPriceField,
  type ListingSource,
} from "./listingArticles";
import type { OutreachListedProduct } from "./priceList";

function bread(
  title: string,
  overrides: Partial<OutreachListedProduct> = {},
): ListingSource {
  return {
    ...listedProduct(overrides),
    title,
    photos: [{ url: `https://fotos.example/${title}.jpg`, alt: title }],
  };
}

/** Las corridas de escritorio del slice 2 de `difusionEnGrupos.feature`. */
describe("los artículos de compraventa", () => {
  describe("el precio va como lo pide el campo de Facebook", () => {
    it.each([
      { precio: 96, seCopia: "96" },
      { precio: 140.0, seCopia: "140" },
      { precio: 96.5, seCopia: "96.50" },
      { precio: 1250, seCopia: "1250" },
    ])("$precio se copia como $seCopia", ({ precio, seCopia }) => {
      expect(formatPriceField(precio)).toBe(seCopia);
      expect(
        buildListingArticles([bread("Pan Natural", { price: precio })])[0]
          ?.price,
      ).toBe(seCopia);
    });
  });

  it("uno por pan disponible, en el orden del texto y con su precio exacto", () => {
    const articles = buildListingArticles([
      bread("Pan de Masa Madre de Chocolate", { price: 136, position: 3 }),
      bread("Pan de Masa Madre Natural", { price: 96, position: 0 }),
      bread("Pan de masa madre de canela", {
        price: 125,
        position: 2,
        stockQuantity: 0,
        isAvailable: false,
      }),
      bread("Pan de Masa Madre con Semillas", { price: 125, position: 1 }),
    ]);

    expect(articles.map(({ title, price }) => ({ title, price }))).toEqual([
      { title: "Pan de Masa Madre Natural", price: "96" },
      { title: "Pan de Masa Madre con Semillas", price: "125" },
      { title: "Pan de Masa Madre de Chocolate", price: "136" },
    ]);
  });

  // La misma regla que la lista: lo que no se anuncia junto tampoco se vende suelto.
  it.each([
    ["no publicado", { moderationStatus: "in_review" }],
    ["apagado a mano", { stockQuantity: null, isAvailable: false }],
    ["sin precio", { price: null }],
  ])("lo %s no genera artículo", (_motivo, overrides) => {
    expect(buildListingArticles([bread("Pan Integral", overrides)])).toEqual(
      [],
    );
  });

  it("sin nada disponible no hay ninguno", () => {
    expect(
      buildListingArticles([
        bread("Pan Natural", { stockQuantity: 0, isAvailable: false }),
        bread("Pan Canela", { stockQuantity: 0, isAvailable: false }),
      ]),
    ).toEqual([]);
  });

  it("cada artículo lleva las fotos de su pan y el título sin espacios de más", () => {
    const [article] = buildListingArticles([bread("  Pan Natural ")]);

    expect(article?.title).toBe("Pan Natural");
    expect(article?.photos).toEqual([
      {
        url: "https://fotos.example/  Pan Natural .jpg",
        alt: "  Pan Natural ",
      },
    ]);
  });
});

describe("un artículo de compraventa con promoción", () => {
  it("lleva el precio que se cobra: el campo de Facebook admite uno solo", () => {
    const [article] = buildListingArticles([
      bread("Miel de abeja 500 g", { price: 180, salePrice: 150 }),
    ]);

    expect(article?.price).toBe("150");
  });
});
