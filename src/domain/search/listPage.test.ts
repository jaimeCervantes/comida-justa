import { describe, expect, it } from "vitest";
import { matchesListTerm, pageOf } from "./listPage";

const MAMAS = [
  "Mamás de Orizaba",
  "https://www.facebook.com/groups/mamasorizaba",
];

/** Corrida de escritorio del slice 9 de `difusionEnGrupos.feature`. */
describe("lo que busco coincide con el nombre, y en los grupos también con su dirección", () => {
  it.each([
    { busco: "mamas", aparece: true, porQue: "sin acentos" },
    { busco: "ORIZABA", aparece: true, porQue: "sin mayúsculas" },
    { busco: "de oriz", aparece: true, porQue: "contiene, no «empieza con»" },
    { busco: "mamasorizaba", aparece: true, porQue: "también la dirección" },
    { busco: "córdoba", aparece: false, porQue: "no coincide" },
    { busco: "100%", aparece: false, porQue: "el % no es comodín" },
  ])("«$busco»: $porQue", ({ busco, aparece }) => {
    expect(matchesListTerm(busco, MAMAS)).toBe(aparece);
  });

  it("sin nada escrito, todo coincide", () => {
    expect(matchesListTerm("", MAMAS)).toBe(true);
  });

  it("con acento en lo buscado también encuentra lo que no lo lleva", () => {
    expect(matchesListTerm("orízaba", ["Orizaba"])).toBe(true);
  });
});

describe("pageOf", () => {
  const veinticinco = Array.from({ length: 25 }, (_, index) => index + 1);

  it("corta la página pedida y dice cuántos hay en total", () => {
    expect(pageOf(veinticinco, 2, 20)).toEqual({
      items: [21, 22, 23, 24, 25],
      total: 25,
      page: 2,
    });
  });

  it("una página de más se vuelve la última, y una imposible la primera", () => {
    expect(pageOf(veinticinco, 9, 20).page).toBe(2);
    expect(pageOf(veinticinco, 0, 20).page).toBe(1);
    expect(pageOf(veinticinco, Number.NaN, 20).page).toBe(1);
  });

  it("vacía, es la página 1 de nada", () => {
    expect(pageOf([], 3, 20)).toEqual({ items: [], total: 0, page: 1 });
  });
});
