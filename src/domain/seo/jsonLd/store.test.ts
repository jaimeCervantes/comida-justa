import { describe, expect, it } from "vitest";
import { type BranchJsonLdInput, buildStoreJsonLd } from "./store";

const BASE = "https://hazlosano.com";

/** La sucursal real de la única tienda del sitio, con sus coordenadas de Tezonapa. */
const restaurante: BranchJsonLdInput = {
  name: "Restaurante Hazlo Sano",
  address:
    "Calle Melchor Ocampo #2, Col. Las Flores. Tezonapa, Veracruz, México",
  mapUrl: "https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6",
  latitude: 18.6014,
  longitude: -96.6873,
};

const hazloSano = {
  url: `${BASE}/tienda/hazlo-sano`,
  name: "Hazlo Sano",
  description: "Comida preparada sin ultraprocesados.",
  phone: "2781126948",
  logoUrl: `${BASE}/logo.webp`,
  website: "https://restaurante.hazlosano.com",
  branches: [restaurante],
};

describe("buildStoreJsonLd", () => {
  it("declara el negocio con su dirección y sus coordenadas", () => {
    expect(buildStoreJsonLd(hazloSano)).toMatchObject({
      "@type": "LocalBusiness",
      name: "Hazlo Sano",
      url: `${BASE}/tienda/hazlo-sano`,
      telephone: "2781126948",
      address: {
        "@type": "PostalAddress",
        streetAddress: restaurante.address,
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 18.6014,
        longitude: -96.6873,
      },
      hasMap: restaurante.mapUrl,
      sameAs: ["https://restaurante.hazlosano.com"],
    });
  });

  it("no declara geo cuando la sucursal no tiene coordenadas", () => {
    const node = buildStoreJsonLd({
      ...hazloSano,
      branches: [{ ...restaurante, latitude: null, longitude: null }],
    });

    expect(node).not.toHaveProperty("geo");
    expect(node).toHaveProperty("address");
  });

  it("manda las sucursales siguientes a location, sin perder ninguna", () => {
    const segunda: BranchJsonLdInput = {
      name: "Sucursal Centro",
      address: "Av. Juárez 10, Tezonapa, Veracruz",
      latitude: 18.6,
      longitude: -96.68,
    };

    const node = buildStoreJsonLd({
      ...hazloSano,
      branches: [restaurante, segunda],
    });

    expect(node.address).toMatchObject({ streetAddress: restaurante.address });
    expect(node.location).toEqual([
      {
        "@type": "Place",
        name: "Sucursal Centro",
        address: {
          "@type": "PostalAddress",
          streetAddress: segunda.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: 18.6,
          longitude: -96.68,
        },
      },
    ]);
  });

  it("sigue siendo válido para una tienda sin sucursales", () => {
    const node = buildStoreJsonLd({ ...hazloSano, branches: [] });

    expect(node["@type"]).toBe("LocalBusiness");
    expect(node).not.toHaveProperty("address");
    expect(node).not.toHaveProperty("location");
  });
});
