import type { OrderScope } from "~/domain/order/order";

export type OrdersView = "received" | "placed";

export interface OrdersParams {
  view: OrdersView;
  scope: OrderScope;
  term: string;
  page: number;
}

/**
 * Arma la dirección de la lista cambiando **solo** lo que se pide.
 *
 * Todo lo demás se conserva: cambiar de estado no puede perder la búsqueda, y buscar no puede
 * dejarte en la página 4 de un resultado que tiene una.
 *
 * Vive en su propio módulo y no dentro de `OrdersControls` porque lo usan las dos orillas: las
 * pestañas y la paginación, que son de servidor, y el campo de búsqueda, que es de cliente. Un
 * `"use client"` no puede importar de un componente servidor asíncrono sin arrastrarlo al paquete
 * del navegador.
 */
export function ordersHref(
  current: OrdersParams,
  change: Partial<OrdersParams>,
): { pathname: "/pedidos"; query: Record<string, string> } {
  const next = { ...current, ...change };
  const query: Record<string, string> = { vista: next.view };

  if (next.scope !== "open") query.estado = next.scope;
  if (next.term) query.q = next.term;
  // La página vuelve a 1 en cuanto cambia el filtro: `change.page` manda si viene.
  if (next.page > 1 && change.page !== undefined)
    query.pagina = String(next.page);

  return { pathname: "/pedidos", query };
}
