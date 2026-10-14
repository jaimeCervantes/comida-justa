import { describe, expect, it } from "vitest";
import { versionForGroup, versionOfTheDay } from "./versions";

/** «versión 1, versión 2»: como lo escribe la corrida de escritorio, contando desde 1. */
function turns(day: number, groups: number, versions: number): string {
  return Array.from(
    { length: groups },
    (_, index) => `versión ${versionForGroup(day, index, versions) + 1}`,
  ).join(", ");
}

/** La corrida de escritorio del slice 5 de `difusionEnGrupos.feature`. */
describe("a cada grupo le toca una versión, y se turnan día con día", () => {
  it.each([
    {
      porQue: "el mismo día, dos grupos, dos versiones",
      versiones: 2,
      grupos: 2,
      dia: 0,
      leToca: "versión 1, versión 2",
    },
    {
      porQue: "al día siguiente se intercambian",
      versiones: 2,
      grupos: 2,
      dia: 1,
      leToca: "versión 2, versión 1",
    },
    {
      porQue: "tantas versiones como grupos: todas distintas",
      versiones: 3,
      grupos: 3,
      dia: 0,
      leToca: "versión 1, versión 2, versión 3",
    },
    {
      porQue: "más grupos que versiones: se reparten parejo",
      versiones: 2,
      grupos: 3,
      dia: 0,
      leToca: "versión 1, versión 2, versión 1",
    },
    {
      porQue: "con una sola versión no hay qué turnar",
      versiones: 1,
      grupos: 2,
      dia: 5,
      leToca: "versión 1, versión 1",
    },
  ])("$porQue", ({ versiones, grupos, dia, leToca }) => {
    expect(turns(dia, grupos, versiones)).toBe(leToca);
  });

  // Los días reales son números grandes —días desde 1970—: el turno no puede depender de empezar en 0.
  it("funciona con el número de día de verdad", () => {
    const today = 20_739;

    expect(versionForGroup(today, 0, 2)).not.toBe(versionForGroup(today, 1, 2));
    expect(versionForGroup(today, 0, 2)).not.toBe(
      versionForGroup(today + 1, 0, 2),
    );
  });

  it("la versión del día es la del primer grupo", () => {
    expect(versionOfTheDay(7, 3)).toBe(versionForGroup(7, 0, 3));
    expect(versionOfTheDay(7, 1)).toBe(0);
  });
});
