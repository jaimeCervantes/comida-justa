import { describe, expect, it } from "vitest";
import {
  areValidCoordinates,
  isShortMapUrl,
  mapPointUrl,
  parseCoordinatesFromMapUrl,
} from "./coordinates";

// Las coordenadas reales de la única sucursal que existe: Tezonapa, Veracruz.
const TEZONAPA = { latitude: 18.6005415, longitude: -96.6872066 };

describe("parseCoordinatesFromMapUrl", () => {
  it("prefiere el pin del lugar sobre el centro del mapa", () => {
    // `@` trae el encuadre que el usuario tenía en pantalla; `!3d!4d`, el lugar en sí.
    const url =
      "https://www.google.com/maps/place/Restaurante+Hazlo+Sano/@18.5,-96.5,17z/data=!4m6!3m5!8m2!3d18.6005415!4d-96.6872066";

    expect(parseCoordinatesFromMapUrl(url)).toEqual(TEZONAPA);
  });

  it.each([
    [
      "encuadre del mapa",
      "https://www.google.com/maps/@18.6005415,-96.6872066,17z",
    ],
    [
      "búsqueda por coordenadas",
      "https://www.google.com/maps?q=18.6005415,-96.6872066",
    ],
    ["coordenadas pegadas a secas", "18.6005415, -96.6872066"],
    [
      "coma codificada",
      "https://www.google.com/maps?q=18.6005415%2C-96.6872066",
    ],
  ])("las lee de %s", (_caso, url) => {
    expect(parseCoordinatesFromMapUrl(url)).toEqual(TEZONAPA);
  });

  it.each([
    [
      "enlace corto, que no las contiene",
      "https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6",
    ],
    ["una dirección escrita", "Calle Melchor Ocampo #2, Tezonapa, Veracruz"],
    ["un lugar sin coordenadas", "https://www.google.com/maps/place/Tezonapa"],
    ["fuera de rango", "https://www.google.com/maps/@200,-96.68,17z"],
    ["el punto nulo", "https://www.google.com/maps?q=0,0"],
    ["vacío", ""],
  ])("no inventa nada con %s", (_caso, url) => {
    expect(parseCoordinatesFromMapUrl(url)).toBeNull();
  });
});

describe("isShortMapUrl", () => {
  it.each([
    ["https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6", true],
    ["https://goo.gl/maps/abc123", true],
    ["https://www.google.com/maps/@18.6,-96.6,17z", false],
    ["no es una url", false],
    ["", false],
  ])("%j → %s", (url, expected) => {
    expect(isShortMapUrl(url)).toBe(expected);
  });
});

describe("areValidCoordinates", () => {
  it.each([
    [TEZONAPA, true],
    [{ latitude: 0, longitude: 0 }, false],
    [{ latitude: 91, longitude: 0 }, false],
    [{ latitude: 0, longitude: 181 }, false],
    [{ latitude: Number.NaN, longitude: -96 }, false],
    [null, false],
  ])("%j → %s", (value, expected) => {
    expect(areValidCoordinates(value)).toBe(expected);
  });
});

describe("mapPointUrl", () => {
  /* La corrida de escritorio: latitud primero, longitud después, y el signo tal cual. Invertirlas
     manda a quien comprueba su punto al otro lado del mundo sin que nada falle. */
  it.each([
    [{ latitude: 18.6013, longitude: -96.7089 }, "18.6013,-96.7089"],
    [{ latitude: 0, longitude: 12.5 }, "0,12.5"],
    [{ latitude: -33.4489, longitude: -70.6693 }, "-33.4489,-70.6693"],
  ])("arma la dirección de %j", (point, esperado) => {
    expect(mapPointUrl(point)).toBe(
      `https://www.google.com/maps?q=${esperado}`,
    );
  });

  /* Mejor ningún enlace que uno que lleva al Golfo de Guinea: `0,0` es lo que queda cuando no se
     pudo leer nada, y enseñarlo como «tu punto» sería mentir con precisión de seis decimales. */
  it.each([
    ["nulo", null],
    ["0,0", { latitude: 0, longitude: 0 }],
    ["fuera de rango", { latitude: 91, longitude: 0 }],
    ["no numérico", { latitude: Number.NaN, longitude: 0 }],
  ])("no arma nada con %s", (_caso, point) => {
    expect(mapPointUrl(point)).toBeNull();
  });

  /* El reverso encaja con el derecho: lo que se escribe se vuelve a leer igual. */
  it("lo que arma lo sabe releer `parseCoordinatesFromMapUrl`", () => {
    const point = { latitude: 18.6013, longitude: -96.7089 };
    const url = mapPointUrl(point);

    if (!url) throw new Error("mapPointUrl devolvió null con un punto válido");

    expect(parseCoordinatesFromMapUrl(url)).toEqual(point);
  });
});
