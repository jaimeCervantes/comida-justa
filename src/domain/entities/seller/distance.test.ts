import { describe, expect, it } from "vitest";
import { describeDistance } from "./distance";

describe("describeDistance", () => {
  /* Corrida de escritorio de la unidad y del redondeo, incluido el salto de metros a kilómetros. */
  it.each<[number, number, string]>([
    [0, 0, "meters"],
    [350, 350, "meters"],
    [999, 999, "meters"],
    [1000, 1, "kilometers"],
    [1500, 1.5, "kilometers"],
    [1483.2, 1.5, "kilometers"],
    [50_000, 50, "kilometers"],
  ])("%s m → %s %s", (meters, value, unit) => {
    expect(describeDistance(meters)).toEqual({ value, unit });
  });

  it("no describe una distancia que no es una distancia", () => {
    expect(describeDistance(-1)).toBeNull();
    expect(describeDistance(Number.NaN)).toBeNull();
    expect(describeDistance(Number.POSITIVE_INFINITY)).toBeNull();
  });
});
