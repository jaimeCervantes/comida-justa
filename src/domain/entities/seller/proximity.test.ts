import { describe, expect, it } from "vitest";
import {
  anchorFor,
  COMMUNITY_ANCHOR,
  isWithinSustainableRadius,
  SUSTAINABLE_RADIUS_KM,
  SUSTAINABLE_RADIUS_METERS,
} from "./proximity";

describe("radio sostenible", () => {
  it("expresa en metros lo mismo que en kilómetros", () => {
    expect(SUSTAINABLE_RADIUS_METERS).toBe(SUSTAINABLE_RADIUS_KM * 1000);
  });

  /*
   * Corrida de escritorio con distancias reales desde Tezonapa: lo que entra al directorio de
   * productores locales y lo que no. El límite es cerrado —50 km exactos siguen contando— porque
   * el criterio es "hasta dónde sigue siendo sostenible", no "menos de".
   */
  it.each<[string, number, boolean]>([
    ["la sucursal del pueblo, a 2 km", 2_000, true],
    ["Córdoba, a ~40 km", 40_000, true],
    ["justo en el límite, 50 km", SUSTAINABLE_RADIUS_METERS, true],
    ["un metro más allá del límite", SUSTAINABLE_RADIUS_METERS + 1, false],
    ["Xalapa, a ~106 km", 106_000, false],
    ["Ciudad de México, a ~270 km", 270_000, false],
  ])("%s → %s", (_caso, metros, esperado) => {
    expect(isWithinSustainableRadius(metros)).toBe(esperado);
  });

  it("no acepta una distancia que no es una distancia", () => {
    expect(isWithinSustainableRadius(Number.NaN)).toBe(false);
    expect(isWithinSustainableRadius(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isWithinSustainableRadius(-1)).toBe(false);
  });
});

describe("anchorFor", () => {
  /*
   * "Local" no es una propiedad del vendedor, es una relación entre dos puntos, y el punto que
   * importa es dónde está quien va a ir a comprar. Medirlo siempre desde el mismo pueblo dejaba el
   * directorio de productores inservible para cualquiera que no viviera ahí.
   */
  it("mide desde quien mira cuando sabemos dónde está", () => {
    const monterrey = { latitude: 25.6866, longitude: -100.3161 };

    expect(anchorFor(monterrey)).toEqual(monterrey);
  });

  it("vuelve al ancla de la comunidad cuando no lo sabemos", () => {
    expect(anchorFor(null)).toEqual(COMMUNITY_ANCHOR);
  });
});
