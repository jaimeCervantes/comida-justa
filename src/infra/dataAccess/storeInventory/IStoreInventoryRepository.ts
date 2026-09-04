import type { InventoryScope } from "~/domain/entities/post/inventoryScope";

/**
 * Un renglón del inventario de una tienda.
 *
 * Lleva `slug` porque cada renglón enlaza a su ficha —la tabla dice cuántas quedan, la ficha dice
 * qué es— y `isAvailable` porque un producto puede estar agotado **sin** llevar inventario: son los
 * cuatro que ya estaban marcados a mano, y la tabla tiene que poder distinguirlos de los que están
 * en cero.
 */
export interface InventoryItem {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  /** `null` = no lleva inventario. **Nulo no es cero.** */
  stockQuantity: number | null;
  isAvailable: boolean;
}

export interface InventoryQuery {
  scope: InventoryScope;
  page: number;
  pageSize: number;
  locale: string;
  fallbackLocale: string;
}

export interface InventoryPage {
  items: InventoryItem[];
  /** Cuántos hay en el ámbito pedido, no cuántos caben en la página. */
  total: number;
}

export interface IStoreInventoryRepository {
  listBySeller(sellerId: string, query: InventoryQuery): Promise<InventoryPage>;
}
