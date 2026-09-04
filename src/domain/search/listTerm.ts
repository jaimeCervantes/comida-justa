/**
 * Lo que cabe en un filtro de lista.
 *
 * Ochenta y no los 120 de `normalizeTerm`: aquél mide lo que alguien busca en el sitio entero y va
 * a parar a `searches`, donde el texto es el dato. Esto es un `ILIKE` sobre una lista que ya se está
 * mirando, y ochenta caracteres son más de lo que cabe en el título más largo del catálogo.
 */
export const LIST_TERM_MAX_LENGTH = 80;

/**
 * El término tal como se va a usar, venga de la URL o del campo.
 *
 * **Una regla, un sitio.** El recorte y el tope estaban escritos dos veces —en la página de pedidos
 * al leer la dirección y en su campo al escribirla—, y esa duplicación es la que hace que un día el
 * campo mande 90 caracteres y el servidor busque otros 80: el campo creería estar filtrando por algo
 * que la lista no filtró. Con las tres pantallas llamando aquí, no pueden discrepar.
 *
 * Vacío significa **no filtrar**, que no es lo mismo que buscar la cadena vacía: por eso quien lo
 * recibe pregunta por la cadena vacía y se salta el `WHERE` entero.
 */
export function normalizeListTerm(raw: unknown): string {
  if (typeof raw !== "string") return "";

  return raw.trim().slice(0, LIST_TERM_MAX_LENGTH);
}
