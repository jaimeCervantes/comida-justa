import { describe, expect, it, vi } from "vitest";
import MapboxRouteProvider from "./MapboxRouteProvider";

const FROM = { lat: 25.6699, lng: -100.3097 };
const TO = { lat: 25.6766, lng: -100.3303 };

function respondWith(body: unknown, ok = true) {
  return vi.fn(async () => ({ ok, json: async () => body }) as Response);
}

const MAPBOX_OK = {
  code: "Ok",
  routes: [
    {
      distance: 2600.4,
      duration: 540.2,
      geometry: {
        coordinates: [
          [-100.3097, 25.6699],
          [-100.318, 25.672],
          [-100.3303, 25.6766],
        ],
      },
    },
  ],
};

describe("MapboxRouteProvider", () => {
  it("pide el camino con tráfico, en GeoJSON, y lo pasa a { lat, lng }", async () => {
    const fetchImpl = respondWith(MAPBOX_OK);
    const provider = new MapboxRouteProvider({
      accessToken: "pk.test",
      fetchImpl,
    });

    const route = await provider.routeBetween(FROM, TO);

    expect(route).toEqual({
      distanceMeters: 2600.4,
      durationSeconds: 540.2,
      path: [
        { lat: 25.6699, lng: -100.3097 },
        { lat: 25.672, lng: -100.318 },
        { lat: 25.6766, lng: -100.3303 },
      ],
    });

    const [url] = fetchImpl.mock.calls[0] as unknown as [URL];
    expect(url.pathname).toBe(
      "/directions/v5/mapbox/driving-traffic/-100.3097,25.6699;-100.3303,25.6766",
    );
    expect(url.searchParams.get("geometries")).toBe("geojson");
    expect(url.searchParams.get("access_token")).toBe("pk.test");
  });

  /* Cláusula 2.10.1 de los términos de Mapbox: el resultado no se cachea. */
  it("no deja que Next guarde la respuesta en su caché", async () => {
    const fetchImpl = respondWith(MAPBOX_OK);
    await new MapboxRouteProvider({
      accessToken: "pk.test",
      fetchImpl,
    }).routeBetween(FROM, TO);

    const [, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit];
    expect(init.cache).toBe("no-store");
  });

  it.each([
    ["sin ruta posible", { code: "NoRoute", routes: [] }, true],
    ["clave inválida", { message: "Not Authorized" }, false],
    [
      "respuesta sin trazo",
      { code: "Ok", routes: [{ distance: 1, duration: 1 }] },
      true,
    ],
  ])("%s → null", async (_, body, ok) => {
    const provider = new MapboxRouteProvider({
      accessToken: "pk.test",
      fetchImpl: respondWith(body, ok),
    });

    expect(await provider.routeBetween(FROM, TO)).toBeNull();
  });

  it("si la red falla, null sin lanzar", async () => {
    const provider = new MapboxRouteProvider({
      accessToken: "pk.test",
      fetchImpl: vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    });

    expect(await provider.routeBetween(FROM, TO)).toBeNull();
  });
});
