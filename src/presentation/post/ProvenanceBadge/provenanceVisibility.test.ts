import { describe, expect, it } from "vitest";
import { showsProvenanceBadge } from "./provenanceVisibility";

/**
 * `Scenario Outline` "Cuándo se calla la procedencia y cuándo no" de `sellerStore.feature`.
 *
 * La regla es "lo dice ya la identidad de arriba", no "el origen dejó de importar": por eso depende
 * de dos cosas y no solo del origen.
 */
describe("Cuándo se calla la insignia de procedencia", () => {
  const casos = [
    {
      origin: "hazlo_sano_propio",
      hasStoreIdentity: true,
      expected: false,
      razón: "el logo de la tienda ya dice Hazlo Sano",
    },
    {
      origin: "hazlo_sano_reventa",
      hasStoreIdentity: true,
      expected: false,
      razón: "también pinta «🌿 Hazlo Sano», así que duplica igual",
    },
    {
      origin: "productor",
      hasStoreIdentity: true,
      expected: true,
      razón: "el logo no dice quién lo hizo",
    },
    {
      origin: "reventa_cercana",
      hasStoreIdentity: true,
      expected: true,
      razón: "«📍 Local» tampoco se deduce del logo",
    },
    {
      origin: "hazlo_sano_propio",
      hasStoreIdentity: false,
      expected: true,
      razón: "sin tienda arriba no hay nada que lo diga",
    },
  ] as const;

  for (const { origin, hasStoreIdentity, expected, razón } of casos) {
    it(`${origin} con${hasStoreIdentity ? "" : " sin"} tienda arriba: ${expected ? "se pinta" : "se calla"} — ${razón}`, () => {
      expect(showsProvenanceBadge(origin, hasStoreIdentity)).toBe(expected);
    });
  }

  it("no se calla por una publicación sin origen: ahí no hay insignia que ocultar", () => {
    expect(showsProvenanceBadge(null, true)).toBe(true);
  });
});
