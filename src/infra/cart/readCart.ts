import { cookies } from "next/headers";
import type { CartSelection } from "~/domain/cart/cartSelection";
import { CART_COOKIE, parseCart } from "./cartCookie";

/**
 * El carrito que trae esta petición.
 *
 * Vive aquí y no en cada página porque lo leen tres sitios —el carrito, el contador de la cabecera y
 * las propias acciones antes de escribir—, y cada uno tenía que acordarse del nombre de la cookie.
 */
export async function readCartSelection(): Promise<CartSelection[]> {
  const store = await cookies();

  return parseCart(store.get(CART_COOKIE)?.value);
}
