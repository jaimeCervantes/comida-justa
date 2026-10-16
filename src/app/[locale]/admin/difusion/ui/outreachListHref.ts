import { normalizeListTerm } from "~/domain/search/listTerm";
import type { OutreachListQuery } from "~/use_cases/outreach/listOutreachChannelsUseCase";

/** Las dos listas de la difusión que se buscan y se paginan. */
export type OutreachListPathname = "/admin/difusion" | "/admin/difusion/grupos";

/**
 * La dirección de una lista con lo buscado (`q`) y la página (`pagina`), los mismos nombres que
 * usan el inventario y los pedidos. Lo que vale lo de omisión no se escribe: la dirección de la
 * lista sin buscar sigue siendo la de siempre.
 */
export function outreachListHref(
  pathname: OutreachListPathname,
  { term, page }: OutreachListQuery,
): { pathname: OutreachListPathname; query: Record<string, string> } {
  const query: Record<string, string> = {};

  if (term) query.q = term;
  if (page > 1) query.pagina = String(page);

  return { pathname, query };
}

/** Lo que dice la dirección, ya normalizado: lo tecleado a mano no rompe la página. */
export function readOutreachListParams(
  raw: Record<string, string | string[] | undefined>,
): OutreachListQuery {
  const page = Number(raw.pagina);

  return {
    term: normalizeListTerm(raw.q),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}
