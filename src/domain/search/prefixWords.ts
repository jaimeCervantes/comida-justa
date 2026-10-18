import { normalizeListTerm } from "./listTerm";
import { MAX_SEARCH_WORDS } from "./searchWords";

/** Una letra sola no dice nada: «pan d» empezaría a traer todo lo que tenga una palabra con «d». */
const MIN_PREFIX_LENGTH = 2;

/**
 * Las palabras de lo escrito, listas para buscarlas como **inicio de palabra**: «prote» encuentra
 * «Proteína» y «barra de prot» encuentra «Barra de Proteína».
 *
 * Solo letras y números: los signos parten palabras («green-clean» son dos) y nada más llega a la
 * consulta. **Los acentos y la ñ se quedan**, a diferencia de `searchWords`: quien compara es el
 * diccionario del idioma, que ya quita los acentos de las vocales, y doblar la ñ haría que «piña»
 * dejara de encontrar «Piña».
 *
 * Sin repetir, en el orden escrito y hasta `MAX_SEARCH_WORDS`.
 */
export function prefixWords(raw: unknown): string[] {
  const words = normalizeListTerm(raw)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= MIN_PREFIX_LENGTH);

  return [...new Set(words)].slice(0, MAX_SEARCH_WORDS);
}
