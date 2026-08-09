import type { CartProduct } from "./cart";

export interface CartProductRepository {
  /**
   * Los productos del carrito, tal como están hoy.
   *
   * Devuelve **solo lo que sigue siendo vendible**: `kind = 'producto'` con precio y con tienda. Un
   * id que ya no cumpla eso no vuelve, y el carrito lo deja caer. Lo agotado **sí vuelve**, con
   * `isAvailable` en `false`: hace falta para poder decir que se agotó.
   *
   * El orden no importa: quien llama conserva el del carrito.
   */
  findByIds(
    postIds: readonly string[],
    locale: string,
    fallbackLocale: string,
  ): Promise<CartProduct[]>;
}
