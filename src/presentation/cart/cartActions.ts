"use server";
import { revalidatePath } from "next/cache";
import {
  addToSelection,
  type CartSelection,
  countSelectionItems,
  removeFromSelection,
  setSelectionQuantity,
} from "~/domain/cart/cartSelection";
import { readCartSelection, writeCartSelection } from "~/infra/cart/readCart";
import { clearCheckoutId } from "~/infra/cart/readCheckout";

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

/**
 * Cambia la cantidad de un renglón, por incremento o por valor.
 *
 * **Los botones de más y menos mandan `delta`, no la cantidad final**, y se aplica sobre lo que hay
 * en la cookie en ese momento. Dos toques rápidos suman dos aunque la pantalla todavía enseñe el
 * número viejo; mandar "3" desde una pantalla que se quedó atrás pisaría el otro toque.
 *
 * El campo numérico sí manda el valor absoluto, porque escribir 12 es decir exactamente 12. Los dos
 * llegan en el mismo formulario cuando se pulsa un botón —el campo va dentro—, así que `delta`
 * decide cuando está presente.
 */
export async function setCartQuantity(
  _prevState: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) return {};

  const selection = await readCartSelection();
  const quantity = quantityFrom(formData, selection, postId);

  if (quantity === null) return {};

  return writeCart(setSelectionQuantity(selection, postId, quantity));
}

/** La cantidad que pide el formulario, o `null` si no manda nada utilizable. */
function quantityFrom(
  formData: FormData,
  selection: readonly CartSelection[],
  postId: string,
): number | null {
  const delta = Number(formData.get("delta"));

  if (formData.has("delta")) {
    if (!Number.isFinite(delta)) return null;

    const current =
      selection.find((line) => line.postId === postId)?.quantity ?? 0;

    return current + delta;
  }

  const quantity = Number(formData.get("quantity"));

  return Number.isFinite(quantity) ? quantity : null;
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
  await writeCartSelection(selection);

  /* Un carrito vacío cierra la compra. La otra salida —confirmarlo todo— la cierra en `placeOrder`;
     esta es la de quien se arrepiente y quita los renglones a mano. Sin las dos, el siguiente pedido
     se engancharía a una compra que ya terminó. */
  if (selection.length === 0) {
    await clearCheckoutId();
  }

  /* El layout entero, no solo la página: el contador de la cabecera sale de esta misma cookie y se
     pinta en todas las pantallas. Sin esto, añadir desde una tarjeta parecería no hacer nada. */
  revalidatePath("/", "layout");

  return { itemCount: countSelectionItems(selection) };
}
