import { cookies } from "next/headers";
import {
  CHECKOUT_COOKIE,
  CHECKOUT_COOKIE_MAX_AGE,
  parseCheckoutId,
} from "./checkoutCookie";

/** La compra que este carrito ya empezó, o `null` si todavía no ha confirmado nada. */
export async function readCheckoutId(): Promise<string | null> {
  const store = await cookies();

  return parseCheckoutId(store.get(CHECKOUT_COOKIE)?.value);
}

/**
 * Deja anotada la compra en curso, para que la siguiente tienda del mismo carrito se le enganche.
 *
 * Solo se puede llamar desde una Server Action o un Route Handler, como `writeCartSelection`: son
 * los únicos sitios donde Next permite escribir cookies.
 */
export async function writeCheckoutId(checkoutId: string): Promise<void> {
  const store = await cookies();

  store.set(CHECKOUT_COOKIE, checkoutId, {
    maxAge: CHECKOUT_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

/**
 * Cierra la compra en curso.
 *
 * Se llama **cuando el carrito se queda vacío**, por cualquiera de los dos caminos: porque se
 * confirmó todo o porque se quitó a mano. Dejarla abierta metería el pedido de la semana que viene
 * dentro de la compra de esta.
 */
export async function clearCheckoutId(): Promise<void> {
  const store = await cookies();

  store.delete(CHECKOUT_COOKIE);
}
