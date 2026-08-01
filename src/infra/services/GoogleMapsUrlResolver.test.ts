import { afterEach, describe, expect, it, vi } from "vitest";
import { GoogleMapsUrlResolver } from "./GoogleMapsUrlResolver";

const SHORT_URL = "https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6";
const LONG_URL =
  "https://www.google.com/maps/place/Restaurante/@18.6,-96.68,17z/data=!3d18.6005415!4d-96.6872066";

function respondWith(location: string | null): Response {
  return {
    headers: { get: () => location },
  } as unknown as Response;
}

describe("GoogleMapsUrlResolver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sigue el redirect hasta el enlace largo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(respondWith(LONG_URL))
        .mockResolvedValueOnce(respondWith(null)),
    );

    expect(await new GoogleMapsUrlResolver().expand(SHORT_URL)).toBe(LONG_URL);
  });

  it("devuelve el mismo enlace cuando Google no redirige", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respondWith(null)));

    expect(await new GoogleMapsUrlResolver().expand(SHORT_URL)).toBe(SHORT_URL);
  });

  it("no lanza cuando la red falla: devolver el original deja un mensaje accionable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ETIMEDOUT")));

    expect(await new GoogleMapsUrlResolver().expand(SHORT_URL)).toBe(SHORT_URL);
  });

  it("no se queda dando vueltas en una cadena infinita", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async (url: string) =>
        respondWith(`${url}?hop=${Math.random()}`),
      );
    vi.stubGlobal("fetch", fetchMock);

    await new GoogleMapsUrlResolver().expand(SHORT_URL);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
