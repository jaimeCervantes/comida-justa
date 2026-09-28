import { createServer, type Server } from "node:http";

/** Donde escucha; `playwright.config.ts` apunta ahí `MAPBOX_DIRECTIONS_BASE_URL`. */
export const FAKE_MAPBOX_PORT = 4010;

export type FakeMapboxMode = "route" | "down";

/** El camino que devuelve en modo `route`: 2.6 km y 9 min, como en `orders.feature`. */
export const FAKE_ROUTE = { distanceMeters: 2600, durationSeconds: 540 };

export interface FakeMapbox {
  setMode(mode: FakeMapboxMode): void;
  /** Cuántas consultas de camino recibió desde que se levantó. */
  requests(): number;
  close(): Promise<void>;
}

/**
 * Un Mapbox Directions falso, local, para que la suite no gaste cuota ni dependa del tráfico.
 *
 * Contesta con un camino de tres puntos —origen, un punto intermedio y destino, tomados de la propia
 * petición— para que el trazo se pinte entre los marcadores reales. En modo `down` contesta 503,
 * que es como se ve un Mapbox caído.
 */
export async function startFakeMapbox(
  port: number = FAKE_MAPBOX_PORT,
): Promise<FakeMapbox> {
  let mode: FakeMapboxMode = "down";
  let count = 0;

  const server: Server = createServer((request, response) => {
    const match = /\/directions\/v5\/mapbox\/[^/]+\/([^?]+)/.exec(
      request.url ?? "",
    );

    if (!match) {
      response.writeHead(404).end();
      return;
    }

    count += 1;

    if (mode === "down") {
      response.writeHead(503).end();
      return;
    }

    const [from, to] = decodeURIComponent(match[1])
      .split(";")
      .map((pair) => pair.split(",").map(Number) as [number, number]);
    const middle: [number, number] = [from[0], to[1]];

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        code: "Ok",
        routes: [
          {
            distance: FAKE_ROUTE.distanceMeters,
            duration: FAKE_ROUTE.durationSeconds,
            geometry: { type: "LineString", coordinates: [from, middle, to] },
          },
        ],
      }),
    );
  });

  await new Promise<void>((resolve) =>
    server.listen(port, "127.0.0.1", resolve),
  );

  return {
    setMode: (next) => {
      mode = next;
    },
    requests: () => count,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
