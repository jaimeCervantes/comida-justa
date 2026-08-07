/**
 * Qué pasó en una búsqueda.
 *
 * Existe porque hoy no hay **ningún** dato sobre qué se escribe en la caja ni cuántas búsquedas
 * terminan sin resultados, y sin eso cualquier mejora del motor es a ciegas: no se puede saber si
 * el rescate semántico se dispara una vez al día o en la mitad de las búsquedas, ni cuánto se está
 * gastando en embeddings.
 */

/** Cómo se resolvió la búsqueda. */
export type SearchStrategy =
  /** La encontró el texto completo. No costó ninguna llamada al proveedor. */
  | "text"
  /** El texto no encontró nada y la rescató el vector. Cuesta un embedding. */
  | "semantic"
  /** Ni el texto ni el vector encontraron nada. */
  | "none";

export interface SearchEvent {
  /** Lo que se escribió, normalizado. Ver `normalizeTerm`. */
  term: string;
  locale: string;
  strategy: SearchStrategy;
  resultCount: number;
  /** `true` cuando quien buscó se fue con las manos vacías. Es la métrica que importa. */
  emptyHanded: boolean;
}

/**
 * El término tal y como se guarda para medir.
 *
 * Se normaliza a minúsculas y se colapsan los espacios para que «Pan Integral», «pan integral» y
 * «pan  integral» cuenten como la misma búsqueda; si no, el informe de términos más buscados sería
 * una lista de variantes de escritura.
 *
 * Se recorta a 120 caracteres: nadie busca una frase más larga a propósito, y un término
 * desmesurado suele ser un pegado accidental que solo ensucia el registro.
 */
export function normalizeTerm(term: string): string {
  return term.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 120);
}

export function buildSearchEvent(input: {
  term: string;
  locale: string;
  strategy: SearchStrategy;
  resultCount: number;
}): SearchEvent {
  return {
    term: normalizeTerm(input.term),
    locale: input.locale,
    strategy: input.strategy,
    resultCount: input.resultCount,
    emptyHanded: input.resultCount === 0,
  };
}
