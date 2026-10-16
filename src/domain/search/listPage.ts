/** Una página de una lista: sus renglones, cuántos hay en total y cuál es. */
export interface ListPage<T> {
  items: T[];
  total: number;
  page: number;
}

/** Sin acentos ni mayúsculas: «Mamás» y «mamas» se escriben igual para quien busca. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Si lo escrito está **contenido** en alguno de los campos, sin acentos ni mayúsculas.
 *
 * «Contiene» y no «empieza con»: se busca un grupo por la palabra que uno recuerda, y «Orizaba»
 * suele ir al final. Se compara texto con texto, sin comodines: un `%` tecleado es un `%`. Vacío
 * no filtra.
 */
export function matchesListTerm(
  term: string,
  fields: readonly string[],
): boolean {
  const wanted = fold(term.trim());
  if (!wanted) return true;

  return fields.some((field) => fold(field).includes(wanted));
}

/**
 * La página pedida de una lista que ya está en memoria.
 *
 * Una página de más se vuelve la última y una imposible la primera: una dirección vieja o tecleada
 * a mano no deja una página vacía con «Anterior» como única salida.
 */
export function pageOf<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): ListPage<T> {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize));
  const wanted = Number.isInteger(page)
    ? Math.min(Math.max(page, 1), lastPage)
    : 1;
  const start = (wanted - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page: wanted,
  };
}
