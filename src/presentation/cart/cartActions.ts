"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  addToSelection,
  countSelectionItems,
  removeFromSelection,
  setSelectionQuantity,
} from "~/domain/cart/cartSelection";
import {
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  serializeCart,
} from "~/infra/cart/cartCookie";
import { readCartSelection } from "~/infra/cart/readCart";

export type CartActionState = {
  /** Cuántos artículos quedaron. Es lo que deja al botón decir que ya lo añadió. */
  itemCount?: number;
};

/**
 * Añade un producto al carrito.
 *
 * **No comprueba que el id exista**: la cookie no es la verdad, solo una intención. Un id inventado
 * simplemente no vuelve de la base cuando el carrito se relee, y el renglón desaparece. Comprobarlo
 * aquí costaría una consulta en cada clic para evitar un renglón que ya se cae solo.
 *
 * Vive en `presentation/` y no bajo la ruta del carrito porque se dispara desde los tres sitios donde
 * aparece un producto —su ficha, su tarjeta en cualquier listado y el propio carrito—, y una tarjeta
 * no puede importar desde `app/` sin invertir las capas. Mismo motivo que `availabilityAction.ts`.
 */
export async function addToCart(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return {};

  return writeCart(addToSelection(await readCartSelection(), postId));
}

export async function setCartQuantity(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const postId = String(formData.get("postId") ?? "");
  const quantity = Number(formData.get("quantity"));

  if (!postId || !Number.isFinite(quantity)) return {};

  return writeCart(
    setSelectionQuantity(await readCartSelection(), postId, quantity),
  );
}

export async function removeCartLine(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return {};

  return writeCart(removeFromSelection(await readCartSelection(), postId));
}

async function writeCart(
  selection: readonly CartSelection[],
): Promise<CartActionState> {
  const store = await cookies();

  store.set(CART_COOKIE, serializeCart(selection), {
    maxAge: CART_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  /* El layout entero, no solo la página: el contador de la cabecera sale de esta misma cookie y se
     pinta en todas las pantallas. Sin esto, añadir desde una tarjeta parecería no hacer nada. */
  revalidatePath("/", "layout");

  return { itemCount: countSelectionItems(selection) };
}
