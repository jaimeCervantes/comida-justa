import { describe, expect, it } from "vitest";
import { boundsFor, type MappedStore } from "./map";
import { COMMUNITY_ANCHOR } from "./proximity";

const store = (latitude: number, longitude: number): MappedStore => ({
  handle: "e2e-tienda",
  name: "Tienda",
  coordinates: { latitude, longitude },
  meters: 0,
});

describe("boundsFor", () => {
  /* Quien mira tiene que caber en el encuadre: un mapa donde no te ves no sirve para decidir. */
  it("encuadra al visitante junto con las tiendas", () => {
    const bounds = boundsFor(COMMUNITY_ANCHOR, [
      store(COMMUNITY_ANCHOR.latitude + 0.1, COMMUNITY_ANCHOR.longitude + 0.1),
      store(COMMUNITY_ANCHOR.latitude - 0.2, COMMUNITY_ANCHOR.longitude - 0.05),
    ]);

    expect(bounds).toEqual({
      southWest: {
        latitude: COMMUNITY_ANCHOR.latitude - 0.2,
        longitude: COMMUNITY_ANCHOR.longitude - 0.05,
      },
      northEast: {
        latitude: COMMUNITY_ANCHOR.latitude + 0.1,
        longitude: COMMUNITY_ANCHOR.longitude + 0.1,
      },
    });
  });

  it("no encuadra nada cuando no hay tiendas que situar", () => {
    expect(boundsFor(COMMUNITY_ANCHOR, [])).toBeNull();
  });

  it("con una sola tienda, el encuadre va de ella a quien mira", () => {
    const bounds = boundsFor(COMMUNITY_ANCHOR, [
      store(COMMUNITY_ANCHOR.latitude + 0.02, COMMUNITY_ANCHOR.longitude),
    ]);

    expect(bounds?.southWest.latitude).toBe(COMMUNITY_ANCHOR.latitude);
    expect(bounds?.northEast.latitude).toBe(COMMUNITY_ANCHOR.latitude + 0.02);
  });
});
