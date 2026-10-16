import { describe, expect, it } from "vitest";
import { pageWindow } from "./pageWindow";

/** Corrida de escritorio del slice 8 de `difusionEnGrupos.feature`, a diez por página. */
describe("los números de página según cuántos resultados hay", () => {
  it.each([
    { resultados: 8, pagina: 1, numeros: [], porQue: "cabe en una página" },
    { resultados: 25, pagina: 1, numeros: [1, 2, 3], porQue: "tres, todas" },
    {
      resultados: 75,
      pagina: 1,
      numeros: [1, 2, 3, 4, 5],
      porQue: "las cinco primeras",
    },
    {
      resultados: 75,
      pagina: 6,
      numeros: [4, 5, 6, 7, 8],
      porQue: "centrada, sin pasarse",
    },
    {
      resultados: 75,
      pagina: 8,
      numeros: [4, 5, 6, 7, 8],
      porQue: "las cinco finales",
    },
  ])(
    "$resultados resultados en la página $pagina: $porQue",
    ({ resultados, pagina, numeros }) => {
      expect(pageWindow(pagina, Math.ceil(resultados / 10))).toEqual(numeros);
    },
  );

  it("centra en la actual cuando hay de dónde", () => {
    expect(pageWindow(5, 20)).toEqual([3, 4, 5, 6, 7]);
  });
});
