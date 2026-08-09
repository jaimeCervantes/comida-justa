import {
  buildCartLines,
  type CartSellerGroup,
  groupBySeller,
} from "~/domain/cart/cart";
import type { CartSelection } from "~/domain/cart/cartSelection";
import type { CartProductRepository } from "~/domain/cart/ports";

export interface ViewCartInput {
  selection: readonly CartSelection[];
  locale: string;
  fallbackLocale: string;
}

/**
 * El carrito tal como hay que enseñarlo: un grupo por tienda, con su subtotal.
 *
 * Es una sola consulta para todo el carrito, no una por renglón, y el cruce con las cantidades pasa
 * en el dominio. Devolver grupos en vez de una lista plana es lo que hace que la pantalla no tenga
 * que saber que un pedido es por vendedor: ya se lo dan partido.
 */
export default class ViewCartUseCase {
  constructor(private readonly products: CartProductRepository) {}

  async execute({
    selection,
    locale,
    fallbackLocale,
  }: ViewCartInput): Promise<CartSellerGroup[]> {
    if (selection.length === 0) return [];

    const products = await this.products.findByIds(
      selection.map((line) => line.postId),
      locale,
      fallbackLocale,
    );

    return groupBySeller(buildCartLines(selection, products));
  }
}
