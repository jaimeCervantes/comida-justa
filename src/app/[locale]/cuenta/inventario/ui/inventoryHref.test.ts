import { describe, expect, it } from "vitest";
import { type InventoryParams, inventoryHref } from "./inventoryHref";

/**
 * El estado del panel, con lo que cada escenario cambie encima.
 *
 * Es un constructor y no tres literales sueltos porque los literales se rompen enteros cada vez que
 * `InventoryParams` gana un campo — que es justo lo que pasó al llegar la búsqueda con `term`, y lo
 * que dejó el `typecheck` de las pruebas en rojo.
 */
function params(patch: Partial<InventoryParams> = {}): InventoryParams {
  return { scope: "all", page: 1, term: "", ...patch };
}

describe("inventoryHref", () => {
  it("el estado por omisión no ensucia la dirección", () => {
    expect(inventoryHref(params(), {})).toEqual({
      pathname: "/cuenta/inventario",
      query: {},
    });
  });

  it("el ámbito viaja cuando no es el de omisión", () => {
    expect(inventoryHref(params(), { scope: "out" }).query).toEqual({
      filtro: "out",
    });
  });

  it("conserva el ámbito al cambiar de página", () => {
    expect(
      inventoryHref(params({ scope: "untracked", page: 2 }), { page: 3 }).query,
    ).toEqual({ filtro: "untracked", pagina: "3" });
  });

  /* Quien filtra desde la página 7 de «todos» no quiere la página 7 de una lista que puede tener
     una: cambiar de filtro sin pedir página vuelve al principio. */
  it("cambiar de ámbito vuelve al principio", () => {
    expect(inventoryHref(params({ page: 7 }), { scope: "out" })).toEqual({
      pathname: "/cuenta/inventario",
      query: { filtro: "out" },
    });
  });
});
