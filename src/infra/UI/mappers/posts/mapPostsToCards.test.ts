import { expect, describe, it } from "vitest";
import { posts } from "./dummies/firestorePostDummies";
import { mapOnePostToCard, mapPostsToCards } from "./mapPostsToCards";
import { makeTaxonomy } from "~/domain/entities/post/__fixtures__/categoryTaxonomy";

const taxonomy = makeTaxonomy();
const es = { locale: "es", taxonomy };
const en = { locale: "en", taxonomy };

describe("When mapPostsToIndex receive a list of FirestorePost", () => {
  it("should map them to a list of post for the index cards", () => {
    const mapped = mapPostsToCards(posts, es);

    expect(mapped).toHaveLength(2);
    expect(mapped).toHaveProperty("0.media");
    expect(mapped).toHaveProperty("0.media.url", posts[0].media.url);
    expect(mapped).toHaveProperty("0.media.alt", posts[0].media.alt);
    expect(mapped).toHaveProperty("0.media.type", posts[0].media.type);
  });
});

describe("When a post carries provenance", () => {
  it("should keep kind and origin on the card, so the badge can be derived", () => {
    const card = mapOnePostToCard(
      { ...posts[0], kind: "producto", origin: "hazlo_sano_propio" },
      es,
    );

    expect(card.kind).toBe("producto");
    expect(card.origin).toBe("hazlo_sano_propio");
  });

  it("should default origin to null when the post has none", () => {
    expect(mapOnePostToCard(posts[0], es).origin).toBeNull();
  });
});

/**
 * Escenario "A card shows the label in the visitor's language" (@slice-2).
 *
 * Era un bug: el mapper no recibía locale, así que las tarjetas salían en español también bajo
 * `/en`, contradiciendo a la página de detalle, que sí lo respetaba.
 */
describe("When a card is mapped for a visitor's locale", () => {
  describe.each([
    ["es", "Panadería"],
    ["en", "Bakery"],
  ])("in locale %j", (locale, expected) => {
    it(`resolves the label to ${expected}`, () => {
      const card = mapOnePostToCard(
        { ...posts[0], category: "alimentacion", subCategory: "panaderia" },
        { locale, taxonomy },
      );

      expect(card.categoryLabel).toBe(expected);
    });
  });

  it("prefers the sub-category, being the most specific", () => {
    const card = mapOnePostToCard(
      { ...posts[0], category: "alimentacion", subCategory: "jugos" },
      en,
    );

    expect(card.categoryLabel).toBe("Juices");
  });

  it("falls back to the category when there is no sub-category", () => {
    const card = mapOnePostToCard(
      { ...posts[0], category: "alimentacion", subCategory: null },
      en,
    );

    expect(card.categoryLabel).toBe("Food");
  });

  it("has no label when the publication has no category", () => {
    expect(mapOnePostToCard(posts[0], es).categoryLabel).toBeNull();
  });

  // Una clave que ya no está en el catálogo (renombrada, desactivada) deja la tarjeta sin chip
  // en vez de pintar la clave cruda.
  it("has no label for a key outside the catalog", () => {
    const card = mapOnePostToCard({ ...posts[0], subCategory: "postres" }, es);

    expect(card.categoryLabel).toBeNull();
  });

  it("keeps the raw keys for filters and analytics", () => {
    const card = mapOnePostToCard(
      { ...posts[0], category: "alimentacion", subCategory: "jugos" },
      en,
    );

    expect(card.category).toBe("alimentacion");
    expect(card.subCategory).toBe("jugos");
  });
});
