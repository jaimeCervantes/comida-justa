import { PRODUCT_KIND } from "./hazloSanoProduct";

export const SOLD_OUT_LABEL = "Agotado";

type AvailabilityFields = {
  kind?: string | null;
  /** `posts.is_available`. Ausente en lecturas viejas: se trata como disponible. */
  isAvailable?: boolean | null;
};

/**
 * La disponibilidad solo significa algo en lo que se vende.
 *
 * Un anuncio no se agota, así que `is_available` en un `anuncio` no debe pintar nada ni cambiar
 * ningún comportamiento: la columna existe para el chatbot, que filtra productos.
 */
export function isSellable(post: AvailabilityFields): boolean {
  return post.kind === PRODUCT_KIND;
}

export function isSoldOut(post: AvailabilityFields): boolean {
  return isSellable(post) && post.isAvailable === false;
}

/**
 * ¿Se le puede pedir?
 *
 * Es la regla que apaga el botón de WhatsApp: ofrecer "Pedir" algo que el vendedor ya marcó como
 * agotado manda al comprador a una conversación que empieza mal.
 */
export function canBeOrdered(post: AvailabilityFields): boolean {
  return isSellable(post) && !isSoldOut(post);
}
