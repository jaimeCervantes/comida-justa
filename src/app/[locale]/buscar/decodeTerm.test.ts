import { describe, expect, it } from "vitest";
import { decodeSearchTerm } from "./decodeTerm";

describe("decodeSearchTerm", () => {
  /* El bug real: la ruta buscaba con el término codificado, así que `pán` o `buñuelos` devolvían
     cero resultados mientras el encabezado los mostraba bien escritos. */
  it.each([
    ["bu%C3%B1uelos", "buñuelos"],
    ["p%C3%A1n", "pán"],
    ["jugo%20verde", "jugo verde"],
    ["caf%C3%A9%20org%C3%A1nico", "café orgánico"],
  ])("decodifica %s", (encoded, expected) => {
    expect(decodeSearchTerm(encoded)).toBe(expected);
  });

  it("deja intacto lo que no lleva codificación", () => {
    expect(decodeSearchTerm("pan")).toBe("pan");
  });

  /**
   * `decodeURIComponent` lanza con una secuencia inválida, y un `%` suelto es algo que cualquiera
   * puede escribir —«50% descuento»—. Buscar de más es mejor que romper la página con un 500.
   */
  it.each(["50% descuento", "100%", "%", "%zz"])("no rompe con %j", (term) => {
    expect(() => decodeSearchTerm(term)).not.toThrow();
    expect(decodeSearchTerm(term)).toBe(term);
  });

  it.each([
    ["indefinido", undefined],
    ["nulo", null],
    ["vacío", ""],
  ])("devuelve cadena vacía cuando es %s", (_caso, term) => {
    expect(decodeSearchTerm(term)).toBe("");
  });
});
