import { describe, expect, it } from "vitest";
import { buildProfileJsonLd, buildSiteJsonLd } from "./site";

const BASE = "https://hazlosano.com";

const site = {
  siteUrl: BASE,
  brandName: "Hazlo Sano",
  logoUrl: `${BASE}/logo.webp`,
  description: "Lo que publica y vende la comunidad para comer sano.",
  sameAs: [
    "https://www.tiktok.com/@hazlosano",
    "https://fb.com/hazlo.sano.comunidad",
  ],
  inLanguage: "es",
};

describe("buildSiteJsonLd", () => {
  it("declara la organización con sus perfiles públicos", () => {
    const [organization] = buildSiteJsonLd(site);

    expect(organization).toMatchObject({
      "@type": "Organization",
      "@id": `${BASE}#organization`,
      name: "Hazlo Sano",
      url: BASE,
      logo: `${BASE}/logo.webp`,
      sameAs: site.sameAs,
    });
  });

  it("declara el sitio y lo ata a su editor por @id", () => {
    const [organization, website] = buildSiteJsonLd(site);

    expect(website).toMatchObject({
      "@type": "WebSite",
      "@id": `${BASE}#website`,
      inLanguage: "es",
      publisher: { "@id": organization["@id"] },
    });
  });

  it("sigue el idioma que se está sirviendo", () => {
    const [, website] = buildSiteJsonLd({ ...site, inLanguage: "en" });

    expect(website).toMatchObject({ inLanguage: "en" });
  });

  it("no declara sameAs cuando no hay perfiles", () => {
    const [organization] = buildSiteJsonLd({ ...site, sameAs: [] });

    expect(organization).not.toHaveProperty("sameAs");
  });
});

describe("buildProfileJsonLd", () => {
  it("declara a la persona con su página y su foto", () => {
    expect(
      buildProfileJsonLd({
        url: `${BASE}/u/jaime-cervantes`,
        name: "Jaime Cervantes",
        imageUrl: "https://lh3.googleusercontent.com/foto.jpg",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Jaime Cervantes",
      url: `${BASE}/u/jaime-cervantes`,
      image: "https://lh3.googleusercontent.com/foto.jpg",
    });
  });

  it("omite la foto de quien no tiene", () => {
    const node = buildProfileJsonLd({
      url: `${BASE}/u/jaime-cervantes`,
      name: "Jaime Cervantes",
      imageUrl: null,
    });

    expect(node).not.toHaveProperty("image");
  });
});
