import { describe, expect, it } from "vitest";
import {
  MAX_REDUCED_ROUTE_POINTS,
  type ParsedRoute,
} from "~/domain/entities/post/gpx";
import {
  MAX_ROUTE_FILE_BYTES,
  parseRoutePayload,
  serializeRoute,
} from "~/domain/entities/post/routeFile";

const ROUTE: ParsedRoute = {
  points: [
    { latitude: 19.432608, longitude: -99.133209 },
    { latitude: 19.434, longitude: -99.135 },
  ],
  meters: 250,
  originalPoints: 7000,
};

/** Un recorrido con `count` puntos, todos válidos. */
function routeOf(count: number): ParsedRoute {
  return {
    points: Array.from({ length: count }, (_, i) => ({
      latitude: 19 + i / 1_000_000,
      longitude: -99 - i / 1_000_000,
    })),
    meters: 1000,
    originalPoints: count,
  };
}

describe("serializeRoute", () => {
  it("va y vuelve sin perder nada", () => {
    expect(parseRoutePayload(serializeRoute(ROUTE))).toEqual(ROUTE);
  });

  /* Se construye campo a campo, así que un dato que `ParsedRoute` gane para otra cosa no se cuela
     solo en la petición de todo el que publique. */
  it("manda solo los tres datos del recorrido", () => {
    const payload = JSON.parse(
      serializeRoute({ ...ROUTE, extra: "no debería viajar" } as ParsedRoute),
    );

    expect(Object.keys(payload).sort()).toEqual([
      "meters",
      "originalPoints",
      "points",
    ]);
  });

  /**
   * La razón de ser del cambio: el cuerpo del POST deja de depender del archivo.
   *
   * `parseGpx` ya recorta, así que el tope de arriba vale para **cualquier** GPX: uno de 200 KB y
   * uno de 20 MB producen la misma petición. Si alguien sube ese tope, esta prueba dice cuánto está
   * engordando la petición de todo el que publique un evento.
   */
  it("el recorrido más grande posible sigue cabiendo de sobra en el cuerpo de una Server Action", () => {
    const bytes = serializeRoute(routeOf(MAX_REDUCED_ROUTE_POINTS)).length;

    expect(bytes).toBeLessThan(200 * 1024);
  });
});

describe("parseRoutePayload", () => {
  it("acepta el tope de puntos", () => {
    expect(
      parseRoutePayload(serializeRoute(routeOf(MAX_REDUCED_ROUTE_POINTS)))
        .points,
    ).toHaveLength(MAX_REDUCED_ROUTE_POINTS);
  });

  it("dice que faltan puntos cuando viene uno solo", () => {
    const payload = JSON.stringify({
      points: [{ latitude: 19, longitude: -99 }],
      meters: 10,
      originalPoints: 1,
    });

    expect(() => parseRoutePayload(payload)).toThrowError(
      expect.objectContaining({ problem: "too-few-points" }),
    );
  });

  /*
   * Cada fila es una forma de que llegue algo que no es un recorrido. Importan porque de aquí los
   * puntos van derechos a `ST_GeogFromText`: lo que no se pare en esta función no da un error
   * legible, da un INSERT roto o una ruta dibujada en otro continente.
   */
  it.each([
    ["no es JSON", "{{{"],
    ["un array en vez de un objeto", "[]"],
    ["nulo", "null"],
    [
      "sin puntos",
      JSON.stringify({ points: undefined, meters: 10, originalPoints: 2 }),
    ],
    [
      "los puntos no son una lista",
      JSON.stringify({ points: "19,-99", meters: 10, originalPoints: 2 }),
    ],
    [
      "una latitud fuera de rango",
      JSON.stringify({
        points: [
          { latitude: 91, longitude: -99 },
          { latitude: 19, longitude: -99 },
        ],
        meters: 10,
        originalPoints: 2,
      }),
    ],
    [
      "una longitud fuera de rango",
      JSON.stringify({
        points: [
          { latitude: 19, longitude: -181 },
          { latitude: 19, longitude: -99 },
        ],
        meters: 10,
        originalPoints: 2,
      }),
    ],
    [
      "una coordenada de texto",
      JSON.stringify({
        points: [
          { latitude: "19", longitude: "-99" },
          { latitude: 19, longitude: -99 },
        ],
        meters: 10,
        originalPoints: 2,
      }),
    ],
    [
      "un punto que no es objeto",
      JSON.stringify({ points: [null, null], meters: 10, originalPoints: 2 }),
    ],
    ["metros que faltan", JSON.stringify({ ...ROUTE, meters: undefined })],
    ["metros en cero", JSON.stringify({ ...ROUTE, meters: 0 })],
    ["metros negativos", JSON.stringify({ ...ROUTE, meters: -5 })],
    ["metros infinitos", JSON.stringify({ ...ROUTE, meters: "Infinity" })],
    [
      "menos puntos originales que puntos recibidos",
      JSON.stringify({ ...ROUTE, originalPoints: 1 }),
    ],
    [
      "puntos originales con decimales",
      JSON.stringify({ ...ROUTE, originalPoints: 2.5 }),
    ],
  ])("rechaza %s", (_caso, payload) => {
    expect(() => parseRoutePayload(payload)).toThrowError(
      expect.objectContaining({ problem: expect.any(String) }),
    );
  });

  /* El tope de puntos es lo que mantiene chica la petición. Sin esta comprobación, un formulario
     manipulado reproduce el fallo que este cambio vino a quitar, solo que ahora en JSON. */
  it("rechaza más puntos de los que el dominio deja guardar", () => {
    const payload = serializeRoute(routeOf(MAX_REDUCED_ROUTE_POINTS + 1));

    expect(() => parseRoutePayload(payload)).toThrowError(
      expect.objectContaining({ problem: "invalid" }),
    );
  });

  /* Se comprueban, no se recalculan: `gpx.ts` los mide sobre TODOS los puntos del archivo y aquí
     solo están los reducidos, así que volver a medirlos encogería la distancia. */
  it("conserva los metros que midió el navegador sobre el archivo completo", () => {
    const route = parseRoutePayload(serializeRoute(ROUTE));

    expect(route.meters).toBe(250);
    expect(route.originalPoints).toBe(7000);
  });
});

describe("MAX_ROUTE_FILE_BYTES", () => {
  it("deja sitio al GPX más grande que el dominio dice esperar", () => {
    expect(MAX_ROUTE_FILE_BYTES).toBeGreaterThanOrEqual(7 * 1024 * 1024);
  });
});
