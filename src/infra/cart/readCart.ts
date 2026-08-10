import { cookies } from "next/headers";
import type { CartSelection } from "~/domain/cart/cartSelection";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  parseCart,
  serializeCart,
} from "./cartCookie";

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

/**
 * Deja el carrito como diga la selección.
 *
 * Solo se puede llamar desde una Server Action o un Route Handler — son los únicos sitios donde Next
 * permite escribir cookies—. Vive junto a la lectura porque las dos acciones del carrito y la de
 * hacer el pedido escriben la misma cookie con las mismas opciones, y tenerlas repetidas era la
 * forma de que un día una durase treinta días y la otra la sesión.
 */
export async function writeCartSelection(
  selection: readonly CartSelection[],
): Promise<void> {
  const store = await cookies();

  store.set(CART_COOKIE, serializeCart(selection), {
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}
