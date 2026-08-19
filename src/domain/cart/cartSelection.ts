/**
 * Lo que el navegador recuerda del carrito: qué producto y cuántos. **Nada más.**
 *
 * Ni el título ni el precio viajan aquí. Un precio guardado en el navegador es el precio del día que
 * se guardó, y el carrito tiene que enseñar el de hoy: releerlo de la base es lo que hace que una
 * subida de precio o un producto agotado se vean **antes** de pedir. Ver `docs/features/commerce/003-2026-08-09-pedidos.md`.
 */
export interface CartSelection {
  postId: string;
  quantity: number;
}

/** Nadie pide cien de nada por esta vía; el tope existe para acotar lo que entra por la cookie. */
export const MAX_QUANTITY = 99;

/**
 * Cuántos renglones distintos caben. Hoy el catálogo entero son 13 productos, así que 50 no lo
 * alcanza ni sumando el de varias tiendas: es un límite contra una cookie inflada a mano, no contra
 * un comprador entusiasta.
 */
export const MAX_LINES = 50;

/** Suma uno más de lo mismo, o lo estrena. El tope se aplica aquí y no en cada pantalla. */
export function addToSelection(
  selection: readonly CartSelection[],
  postId: string,
  quantity = 1,
): CartSelection[] {
  const current = selection.find((line) => line.postId === postId);

  if (!current) {
    if (selection.length >= MAX_LINES) return [...selection];

    return [...selection, { postId, quantity: clampQuantity(quantity) }];
  }

  return selection.map((line) =>
    line.postId === postId
      ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
      : line,
  );
}

/** Poner cantidad 0 es quitar el renglón: es lo que espera quien vacía el campo. */
export function setSelectionQuantity(
  selection: readonly CartSelection[],
  postId: string,
  quantity: number,
): CartSelection[] {
  if (quantity < 1) return removeFromSelection(selection, postId);

  return selection.map((line) =>
    line.postId === postId
      ? { ...line, quantity: clampQuantity(quantity) }
      : line,
  );
}

export function removeFromSelection(
  selection: readonly CartSelection[],
  postId: string,
): CartSelection[] {
  return selection.filter((line) => line.postId !== postId);
}

/**
 * Cuántos artículos lleva, contando cantidades.
 *
 * Es lo que pinta la cabecera, y sale de la cookie **sin consultar la base**: el contador aparece en
 * todas las páginas del sitio y no puede costar una consulta cada vez. El precio de eso es que
 * cuenta también lo que se agotó desde que se añadió; el carrito, que sí lee la base, lo aclara.
 */
export function countSelectionItems(
  selection: readonly CartSelection[],
): number {
  return selection.reduce((total, line) => total + line.quantity, 0);
}

function clampQuantity(quantity: number): number {
  return Math.min(Math.max(Math.trunc(quantity), 1), MAX_QUANTITY);
}
