import { describe, expect, it } from "vitest";
import { type OrdersParams, ordersHref } from "./OrdersControls";

const enLoAbierto: OrdersParams = {
  view: "received",
  scope: "open",
  term: "",
  page: 1,
};

describe("ordersHref", () => {
  it("lo que está por omisión no ensucia la dirección", () => {
    expect(ordersHref(enLoAbierto, {})).toEqual({
      pathname: "/pedidos",
      query: { vista: "received" },
    });
  });

  /* Cambiar de estado no puede perder lo que estabas buscando: es la queja más obvia de un filtro
     que se pisa a sí mismo. */
  it("conserva la búsqueda al cambiar de estado", () => {
    const buscando = { ...enLoAbierto, term: "pan" };

    expect(ordersHref(buscando, { scope: "closed", page: 1 }).query).toEqual({
      vista: "received",
      estado: "closed",
      q: "pan",
    });
  });

  it("conserva el estado al cambiar de pestaña", () => {
    const terminados = { ...enLoAbierto, scope: "closed" as const };

    expect(ordersHref(terminados, { view: "placed", page: 1 }).query).toEqual({
      vista: "placed",
      estado: "closed",
    });
  });

  /* Filtrar desde la página 4 y quedarte en la 4 de un resultado que tiene una es una pantalla
     vacía que parece un fallo. Solo se conserva la página cuando el cambio ES la página. */
  it("vuelve a la primera página al cambiar cualquier filtro", () => {
    const enLaCuarta = { ...enLoAbierto, page: 4 };

    expect(
      ordersHref(enLaCuarta, { scope: "all", page: 1 }).query.pagina,
    ).toBeUndefined();
    expect(
      ordersHref(enLaCuarta, { view: "placed", page: 1 }).query.pagina,
    ).toBeUndefined();
  });

  it("pero pagina cuando lo que se pide es pasar de página", () => {
    expect(ordersHref(enLoAbierto, { page: 2 }).query.pagina).toBe("2");
  });

  it("la primera página tampoco se escribe", () => {
    const enLaSegunda = { ...enLoAbierto, page: 2 };

    expect(ordersHref(enLaSegunda, { page: 1 }).query.pagina).toBeUndefined();
  });
});
