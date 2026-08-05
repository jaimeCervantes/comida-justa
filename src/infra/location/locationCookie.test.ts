import { describe, expect, it } from "vitest";
import { COMMUNITY_ANCHOR } from "~/domain/entities/seller/proximity";
import { parseCoordinates, parseFix, serializeFix } from "./locationCookie";

const FIXED_AT = new Date("2026-08-05T12:00:00.000Z");

describe("serializeFix", () => {
  it("escribe latitud, longitud y la fecha en milisegundos", () => {
    expect(
      serializeFix({ coordinates: COMMUNITY_ANCHOR, fixedAt: FIXED_AT }),
    ).toBe(`18.6005415256606,-96.6872065729976,${FIXED_AT.getTime()}`);
  });

  it("da la vuelta completa", () => {
    const original = { coordinates: COMMUNITY_ANCHOR, fixedAt: FIXED_AT };

    expect(parseFix(serializeFix(original))).toEqual(original);
  });
});

describe("parseFix", () => {
  /*
   * La cookie de dos campos es la que llevan **hoy** los navegadores reales: se escribió con
   * `maxAge` de un año y no hay forma de alcanzarla para migrarla. Se acepta sin fecha, y sin fecha
   * significa "vieja", que es lo honesto: pudo escribirse hace once meses.
   */
  it("acepta el formato anterior, de dos campos, sin fecha", () => {
    expect(parseFix("18.6005415256606,-96.6872065729976")).toEqual({
      coordinates: COMMUNITY_ANCHOR,
      fixedAt: null,
    });
  });

  it.each<[string, string | null | undefined]>([
    ["vacía", ""],
    ["ausente", undefined],
    ["nula", null],
    ["sin longitud", "18.6"],
    ["con texto", "aqui,mismo"],
    ["fuera del planeta", "91,-96.68"],
    ["el Golfo de Guinea, que significa 'no se pudo leer nada'", "0,0"],
  ])("descarta una cookie %s", (_caso, raw) => {
    expect(parseFix(raw)).toBeNull();
  });

  it.each<[string, string]>([
    ["no es un número", `18.6005415256606,-96.6872065729976,ayer`],
    ["está vacía", `18.6005415256606,-96.6872065729976,`],
    ["es cero", `18.6005415256606,-96.6872065729976,0`],
  ])(
    "conserva las coordenadas cuando la fecha %s, y la trata como vieja",
    (_caso, raw) => {
      expect(parseFix(raw)).toEqual({
        coordinates: COMMUNITY_ANCHOR,
        fixedAt: null,
      });
    },
  );
});

describe("parseCoordinates", () => {
  it("sigue devolviendo solo las coordenadas, para quien no necesita la fecha", () => {
    expect(
      parseCoordinates(
        `18.6005415256606,-96.6872065729976,${FIXED_AT.getTime()}`,
      ),
    ).toEqual(COMMUNITY_ANCHOR);
  });

  it("null cuando no hay nada que creer", () => {
    expect(parseCoordinates("0,0")).toBeNull();
  });
});
