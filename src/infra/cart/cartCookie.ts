import {
  type CartSelection,
  MAX_LINES,
  MAX_QUANTITY,
} from "~/domain/cart/cartSelection";

/**
 * La escribe el servidor y la lee el servidor — pero es una cookie y no memoria de sesión porque el
 * carrito **no pide cuenta**: tiene que sobrevivir a la recarga sin que nadie se identifique.
 *
 * Misma decisión que `hs_location` (`src/infra/location/locationCookie.ts`): al viajar en la
 * petición, la página del carrito y el contador de la cabecera son Server Components, sin parpadeo
 * de hidratación. No cuesta nada estático, porque todas las rutas ya son dinámicas: `Header` lee la
 * sesión.
 */
export const CART_COOKIE = "hs_cart";

/** Treinta días. Un carrito más viejo que eso ya no es una intención de compra, es un recuerdo. */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

const LINE_SEPARATOR = "|";
const FIELD_SEPARATOR = ":";

/** `postId:cantidad|postId:cantidad`. */
export function serializeCart(selection: readonly CartSelection[]): string {
  return selection
    .map((line) => `${line.postId}${FIELD_SEPARATOR}${line.quantity}`)
    .join(LINE_SEPARATOR);
}

/**
 * Una cookie la escribe cualquiera: lo que venga se valida antes de creerle.
 *
 * Un renglón ilegible **se descarta solo**, sin arrastrar a los demás — un carácter de más escrito a
 * mano no puede dejar sin carrito a quien sí tenía uno. Los ids no se comprueban aquí: eso lo hace
 * la base al releer, y un id inventado simplemente no vuelve.
 */
export function parseCart(raw: string | null | undefined): CartSelection[] {
  if (!raw) return [];

  const seen = new Set<string>();
  const selection: CartSelection[] = [];

  for (const chunk of raw.split(LINE_SEPARATOR)) {
    if (selection.length >= MAX_LINES) break;

    const [postId, rawQuantity] = chunk.split(FIELD_SEPARATOR);

    if (!postId || seen.has(postId)) continue;

    const quantity = Number(rawQuantity);

    if (!Number.isInteger(quantity) || quantity < 1) continue;

    seen.add(postId);
    selection.push({ postId, quantity: Math.min(quantity, MAX_QUANTITY) });
  }

  return selection;
}
