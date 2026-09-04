/**
 * Las tres preguntas que se le hacen a un inventario de 418 productos.
 *
 * No son un filtro genérico: cada una responde algo que alguien quiere saber al abrir el panel.
 * `out` es «qué tengo que reponer» y `untracked` es «qué me falta por poner a contar», que en una
 * tienda que acaba de estrenar inventario son **todos** — y por eso el ámbito existe: sin él, el
 * trabajo pendiente queda escondido entre lo que ya está hecho.
 */
export const INVENTORY_SCOPES = ["all", "out", "untracked"] as const;

export type InventoryScope = (typeof INVENTORY_SCOPES)[number];

export const DEFAULT_INVENTORY_SCOPE: InventoryScope = "all";

/**
 * Qué ámbito pidió la dirección, con `all` como respuesta a cualquier cosa que no se reconozca.
 *
 * Un parámetro inventado no es un error que merezca una pantalla: es alguien que editó la URL o un
 * enlace viejo, y enseñarle el inventario completo es lo más parecido a lo que quería.
 */
export function resolveInventoryScope(candidate: unknown): InventoryScope {
  return (INVENTORY_SCOPES as readonly unknown[]).includes(candidate)
    ? (candidate as InventoryScope)
    : DEFAULT_INVENTORY_SCOPE;
}
