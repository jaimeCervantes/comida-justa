import { describe, expect, it } from "vitest";
import {
  buildPostJsonLd,
  IN_STOCK,
  OUT_OF_STOCK,
  type PostJsonLdInput,
} from "./post";

const BASE = "https://hazlosano.com";

/** "Jugo Verde", tal como está en el catálogo: producto, 40 MXN, disponible, con su foto. */
const jugoVerde: PostJsonLdInput = {
  url: `${BASE}/jugo-verde`,
  title: "Jugo Verde",
  description: "Nopal, apio, piña y perejil.",
  isProduct: true,
  price: 40,
  currency: "MXN",
  isAvailable: true,
  publishedAt: new Date("2026-07-25T00:00:00.000Z"),
  authorName: "Jaime Cervantes",
  categoryLabel: "Jugos",
  imageUrl: `${BASE}/jugo-verde.jpg`,
};

/** "La clave para dormir profundo": anuncio en video, sin precio. */
const dormirProfundo: PostJsonLdInput = {
  url: `${BASE}/la-clave-para-dormir-profundo`,
  title: "La clave para dormir profundo",
  description: "Qué hacer con la luz de la noche.",
  isProduct: false,
  price: null,
  currency: "MXN",
  isAvailable: true,
  publishedAt: new Date("2026-07-20T00:00:00.000Z"),
  authorName: "Jaime Cervantes",
  imageUrl: `${BASE}/logo.webp`,
  videoUrl: "https://firebasestorage.googleapis.com/dormir-profundo.mp4",
};

const firstOf = (input: PostJsonLdInput) => buildPostJsonLd(input)[0];

describe("buildPostJsonLd", () => {
  it("declara un producto con su precio y su disponibilidad", () => {
    expect(firstOf(jugoVerde)).toMatchObject({
      "@type": "Product",
      name: "Jugo Verde",
      category: "Jugos",
      offers: {
        "@type": "Offer",
        price: "40",
        priceCurrency: "MXN",
        availability: IN_STOCK,
        url: `${BASE}/jugo-verde`,
        seller: { "@type": "Person", name: "Jaime Cervantes" },
      },
    });
  });

  // Corrida de escritorio: lo agotado se dice, no se esconde.
  it.each([
    [true, IN_STOCK],
    [false, OUT_OF_STOCK],
  ])("con isAvailable=%s la disponibilidad es %s", (isAvailable, expected) => {
    const node = firstOf({ ...jugoVerde, isAvailable });

    expect(node.offers).toMatchObject({ availability: expected });
  });

  it("no inventa una oferta cuando la publicación no tiene precio", () => {
    const node = firstOf({ ...jugoVerde, price: null });

    expect(node).not.toHaveProperty("offers");
    expect(node["@type"]).toBe("Product");
  });

  it("declara los anuncios como artículo con su fecha y su autor", () => {
    expect(firstOf(dormirProfundo)).toMatchObject({
      "@type": "Article",
      headline: "La clave para dormir profundo",
      datePublished: "2026-07-20T00:00:00.000Z",
      author: { "@type": "Person", name: "Jaime Cervantes" },
    });
  });

  it("agrega el video como nodo aparte, con su archivo y su fecha", () => {
    const nodes = buildPostJsonLd(dormirProfundo);

    expect(nodes).toHaveLength(2);
    expect(nodes[1]).toMatchObject({
      "@type": "VideoObject",
      name: "La clave para dormir profundo",
      contentUrl: dormirProfundo.videoUrl,
      thumbnailUrl: `${BASE}/logo.webp`,
      uploadDate: "2026-07-20T00:00:00.000Z",
    });
  });

  it("no declara VideoObject cuando la publicación es una foto", () => {
    expect(buildPostJsonLd(jugoVerde)).toHaveLength(1);
  });

  it("omite lo que no se sabe en vez de declararlo vacío", () => {
    const node = firstOf({
      ...jugoVerde,
      categoryLabel: null,
      imageUrl: null,
      authorName: null,
    });

    expect(node).not.toHaveProperty("category");
    expect(node).not.toHaveProperty("image");
    expect(node.offers).not.toHaveProperty("seller");
  });

  it("lleva el contexto de schema.org en cada nodo raíz", () => {
    for (const node of buildPostJsonLd(dormirProfundo)) {
      expect(node["@context"]).toBe("https://schema.org");
    }
  });
});
