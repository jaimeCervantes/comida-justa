import type { InventoryScope } from "~/domain/entities/post/inventoryScope";

export interface InventoryParams {
  scope: InventoryScope;
  page: number;
  /** Ya normalizado por quien leyó la dirección. Vacío = no filtrar. */
  term: string;
}

/**
 * Arma la dirección del panel cambiando **solo** lo que se pide.
 *
 * Cambiar de ámbito o de término vuelve a la página 1 salvo que la página venga en el cambio: quien
 * filtra por agotados desde la página 7 de «todos» no quiere la página 7 de una lista que puede
 * tener una. Es la misma regla que ya sigue `ordersHref`, por el mismo motivo.
 */
export function inventoryHref(
  current: InventoryParams,
  change: Partial<InventoryParams>,
): { pathname: "/cuenta/inventario"; query: Record<string, string> } {
  const next = { ...current, ...change };
  const query: Record<string, string> = {};

  if (next.scope !== "all") query.filtro = next.scope;
  if (next.term) query.q = next.term;
  if (next.page > 1 && change.page !== undefined)
    query.pagina = String(next.page);

  return { pathname: "/cuenta/inventario", query };
}
