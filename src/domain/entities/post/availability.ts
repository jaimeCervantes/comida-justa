import { SELLABLE_KINDS } from "./kind";

export const SOLD_OUT_LABEL = "Agotado";

type AvailabilityFields = {
  kind?: string | null;
  /** `posts.is_available`. Ausente en lecturas viejas: se trata como disponible. */
  isAvailable?: boolean | null;
};

/**
 * La disponibilidad solo significa algo en lo que se vende.
 *
 * Un anuncio no se agota y un evento no se agota —caduca, que es otra cosa y la decide el reloj—,
 * así que `is_available` en ellos no debe pintar nada ni cambiar ningún comportamiento.
 *
 * Desde el slice 3 son **dos** los tipos que se venden, y por eso se pregunta a `SELLABLE_KINDS` en
 * vez de comparar contra un literal: la pregunta se hace en media docena de sitios y sumar un tipo
 * no puede obligar a encontrarlos todos.
 */
export function isSellable(post: AvailabilityFields): boolean {
  return SELLABLE_KINDS.includes(post.kind as never);
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
