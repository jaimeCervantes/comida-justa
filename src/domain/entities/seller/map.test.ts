import { describe, expect, it } from "vitest";
import { type MappedStore, SINGLE_POINT_ZOOM, viewFor } from "./map";
import { COMMUNITY_ANCHOR } from "./proximity";

const store = (latitude: number, longitude: number): MappedStore => ({
  handle: "e2e-tienda",
  name: "Tienda",
  coordinates: { latitude, longitude },
  meters: null,
});

describe("viewFor", () => {
  /* Quien mira tiene que caber en el encuadre: un mapa donde no te ves no sirve para decidir. */
  it("encuadra al visitante junto con las tiendas", () => {
    const view = viewFor(COMMUNITY_ANCHOR, [
      store(COMMUNITY_ANCHOR.latitude + 0.1, COMMUNITY_ANCHOR.longitude + 0.1),
      store(COMMUNITY_ANCHOR.latitude - 0.2, COMMUNITY_ANCHOR.longitude - 0.05),
    ]);

    expect(view).toEqual({
      kind: "bounds",
      bounds: {
        southWest: {
          latitude: COMMUNITY_ANCHOR.latitude - 0.2,
          longitude: COMMUNITY_ANCHOR.longitude - 0.05,
        },
        northEast: {
          latitude: COMMUNITY_ANCHOR.latitude + 0.1,
          longitude: COMMUNITY_ANCHOR.longitude + 0.1,
        },
      },
    });
  });

  it("con una tienda y quien mira, el encuadre va de uno al otro", () => {
    const view = viewFor(COMMUNITY_ANCHOR, [
      store(COMMUNITY_ANCHOR.latitude + 0.02, COMMUNITY_ANCHOR.longitude),
    ]);

    expect(view).toMatchObject({
      kind: "bounds",
      bounds: {
        southWest: { latitude: COMMUNITY_ANCHOR.latitude },
        northEast: { latitude: COMMUNITY_ANCHOR.latitude + 0.02 },
      },
    });
  });

  /*
   * El caso del detalle de una publicación cuando quien mira no compartió su ubicación: hay un solo
   * punto, y encuadrar un rectángulo de área cero deja a Leaflet en su zoom máximo, sin contexto.
   */
  it("centra en la tienda cuando es el único punto", () => {
    const unica = store(COMMUNITY_ANCHOR.latitude, COMMUNITY_ANCHOR.longitude);

    expect(viewFor(null, [unica])).toEqual({
      kind: "center",
      center: unica.coordinates,
      zoom: SINGLE_POINT_ZOOM,
    });
  });

  it("encuadra varias tiendas aunque no sepamos dónde está quien mira", () => {
    const view = viewFor(null, [
      store(COMMUNITY_ANCHOR.latitude, COMMUNITY_ANCHOR.longitude),
      store(COMMUNITY_ANCHOR.latitude + 0.3, COMMUNITY_ANCHOR.longitude),
    ]);

    expect(view?.kind).toBe("bounds");
  });

  it("no encuadra nada cuando no hay tiendas que situar", () => {
    expect(viewFor(COMMUNITY_ANCHOR, [])).toBeNull();
    expect(viewFor(null, [])).toBeNull();
  });
});
