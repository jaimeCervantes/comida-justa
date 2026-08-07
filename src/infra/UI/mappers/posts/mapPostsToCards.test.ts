import { describe, expect, it } from "vitest";
import { makeTaxonomy } from "~/domain/entities/post/__fixtures__/categoryTaxonomy";
import { posts } from "./dummies/firestorePostDummies";
import { mapOnePostToCard, mapPostsToCards } from "./mapPostsToCards";

const taxonomy = makeTaxonomy();
const es = { locale: "es", fallbackLocale: "es", taxonomy };
const en = { locale: "en", fallbackLocale: "es", taxonomy };

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
        // `fallbackLocale` es el del sitio, no el del caso: en `en` la etiqueta se resuelve en
        // inglés y solo cae a español si falta. Faltaba, y el test seguía en verde porque
        // `undefined` daba la respuesta correcta por la razón equivocada.
        { locale, fallbackLocale: "es", taxonomy },
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

/**
 * Cubre los escenarios de `@slice-2` en `src/e2e/i18n/i18n.feature`.
 *
 * Hasta ahora el mapper leía `translations.es` a secas, así que una fila `en` era invisible por
 * mucho que existiera en la base. Estos casos son los que fallaban antes del cambio.
 */
describe("When the visitor asks for a language", () => {
  const bilingue = {
    ...posts[0],
    translations: {
      es: {
        title: "Suero natural",
        slug: "suero-natural",
        content: "Bebida fermentada de la casa.",
      },
      en: {
        title: "Natural whey",
        slug: "natural-whey",
        content: "House fermented drink.",
      },
    },
  };

  it("shows the English row when it exists", () => {
    const card = mapOnePostToCard(bilingue, en);

    expect(card.title).toBe("Natural whey");
    expect(card.slug).toBe("natural-whey");
    expect(card.contentLocale).toBe("en");
    expect(card.isTranslationFallback).toBe(false);
  });

  it("shows the Spanish row when Spanish is asked", () => {
    const card = mapOnePostToCard(bilingue, es);

    expect(card.title).toBe("Suero natural");
    expect(card.slug).toBe("suero-natural");
    expect(card.isTranslationFallback).toBe(false);
  });

  /* El estado real de la base hoy: 24 filas en español y ninguna en inglés. */
  it("falls back to Spanish and says so when there is no English row", () => {
    const soloEspanol = {
      ...posts[0],
      translations: { es: bilingue.translations.es },
    };

    const card = mapOnePostToCard(soloEspanol, en);

    expect(card.title).toBe("Suero natural");
    expect(card.contentLocale).toBe("es");
    expect(card.isTranslationFallback).toBe(true);
  });

  /* El enlace tiene que llevar al slug del idioma que se está enseñando, o la ficha se abre en el
     otro idioma y el cambio de idioma deja de ser reversible. */
  it("links to the slug of the language it is showing", () => {
    expect(mapOnePostToCard(bilingue, en).to).toContain("natural-whey");
    expect(mapOnePostToCard(bilingue, es).to).toContain("suero-natural");
  });
});
