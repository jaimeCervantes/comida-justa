import { describe, expect, it } from "vitest";
import { parseBrandFilter, parseStoreFilter } from "./catalogFilters";

describe("los filtros del catálogo en la dirección", () => {
  it.each([
    ["Birdman", "Birdman"],
    ["  E2E   Apis ", "E2E Apis"],
    ["", null],
    [undefined, null],
  ])("marca %j → %j", (value, expected) => {
    expect(parseBrandFilter(value)).toBe(expected);
  });

  it.each([
    ["hazlo-sano", "hazlo-sano"],
    ["la-luz-2", "la-luz-2"],
    ["Hazlo Sano", null],
    ["../admin", null],
    [undefined, null],
  ])("tienda %j → %j", (value, expected) => {
    expect(parseStoreFilter(value)).toBe(expected);
  });
});
