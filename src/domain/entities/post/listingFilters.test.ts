import { describe, expect, it } from "vitest";
import {
  hasActiveToggle,
  listingFilterParams,
  NO_LISTING_FILTERS,
  parseListingFilters,
} from "./listingFilters";

describe("Los filtros de un listado", () => {
  it.each([
    [{}, NO_LISTING_FILTERS],
    [
      { pillar: "nutrition", disponibles: "1", promocion: "1" },
      { currentPillar: "nutrition", onlyAvailable: true, onSale: true },
    ],
    [
      { pillar: "no-existe", disponibles: "", promocion: "si" },
      NO_LISTING_FILTERS,
    ],
    [
      { pillar: ["sleep"], disponibles: ["1"], promocion: ["1"] },
      NO_LISTING_FILTERS,
    ],
  ])("lee %j como %j", (params, expected) => {
    expect(parseListingFilters(params)).toEqual(expected);
  });

  it("se escriben de vuelta y lo apagado no viaja", () => {
    expect(
      listingFilterParams({
        currentPillar: "movement",
        onlyAvailable: false,
        onSale: true,
      }),
    ).toEqual({
      pillar: "movement",
      disponibles: undefined,
      promocion: "1",
    });
  });

  it.each([
    [NO_LISTING_FILTERS, false],
    [{ ...NO_LISTING_FILTERS, currentPillar: "sleep" as const }, false],
    [{ ...NO_LISTING_FILTERS, onlyAvailable: true }, true],
    [{ ...NO_LISTING_FILTERS, onSale: true }, true],
  ])("un pilar no es un interruptor: %j → %s", (filters, expected) => {
    expect(hasActiveToggle(filters)).toBe(expected);
  });
});
