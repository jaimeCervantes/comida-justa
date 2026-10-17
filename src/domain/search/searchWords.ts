import { foldForSearch } from "./listPage";
import { normalizeListTerm } from "./listTerm";

/** Ocho palabras alcanzan para cualquier nombre de producto; más no afinan, solo encarecen. */
export const MAX_SEARCH_WORDS = 8;

/**
 * Las palabras de lo escrito, listas para buscarlas **contenidas** en un título: sin acentos, ñ, ü
 * ni mayúsculas, sin repetir y en el orden en que se escribieron. El orden importa: la primera es la
 * que decide qué títulos van primero, los que empiezan con ella.
 *
 * Quien busca compara contra el título doblado de la misma forma, así que «pina» encuentra «Piña» y
 * «madr» encuentra «Madre». Los signos se quedan: un `%` escrito es un `%`.
 */
export function searchWords(raw: unknown): string[] {
  const words = foldForSearch(normalizeListTerm(raw))
    .split(/\s+/)
    .filter(Boolean);

  return [...new Set(words)].slice(0, MAX_SEARCH_WORDS);
}
