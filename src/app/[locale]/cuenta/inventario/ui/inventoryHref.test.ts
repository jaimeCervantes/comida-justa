import { describe, expect, it } from "vitest";
import { type InventoryParams, inventoryHref } from "./inventoryHref";

const current: InventoryParams = { scope: "all", page: 1 };

describe("inventoryHref", () => {
  it("el estado por omisión no ensucia la dirección", () => {
    expect(inventoryHref(current, {})).toEqual({
      pathname: "/cuenta/inventario",
      query: {},
    });
  });

  it("el ámbito viaja cuando no es el de omisión", () => {
    expect(inventoryHref(current, { scope: "out" }).query).toEqual({
      filtro: "out",
    });
  });

  it("conserva el ámbito al cambiar de página", () => {
    expect(
      inventoryHref({ scope: "untracked", page: 2 }, { page: 3 }).query,
    ).toEqual({ filtro: "untracked", pagina: "3" });
  });

  /* Quien filtra desde la página 7 de «todos» no quiere la página 7 de una lista que puede tener
     una: cambiar de filtro sin pedir página vuelve al principio. */
  it("cambiar de ámbito vuelve al principio", () => {
    expect(inventoryHref({ scope: "all", page: 7 }, { scope: "out" })).toEqual({
      pathname: "/cuenta/inventario",
      query: { filtro: "out" },
    });
  });
});
