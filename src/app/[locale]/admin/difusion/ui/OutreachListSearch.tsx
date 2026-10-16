"use client";

import { useCallback } from "react";
import ListSearchField from "~/presentation/search/ListSearchField/ListSearchField";
import {
  type OutreachListPathname,
  outreachListHref,
} from "./outreachListHref";

/**
 * El buscador de una lista de la difusión. El comportamiento —filtrar mientras se escribe, Enter
 * sin JavaScript, `replace` y no `push`— es el de `ListSearchField`, el mismo de pedidos e
 * inventario; aquí queda solo a qué lista pertenece. Buscar vuelve a la página 1.
 */
export default function OutreachListSearch({
  pathname,
  term,
  label,
  placeholder,
  testId,
}: {
  pathname: OutreachListPathname;
  term: string;
  label: string;
  placeholder: string;
  testId: string;
}) {
  const hrefForTerm = useCallback(
    (next: string) => outreachListHref(pathname, { term: next, page: 1 }),
    [pathname],
  );

  return (
    <ListSearchField
      term={term}
      hrefForTerm={hrefForTerm}
      labels={{ label, placeholder }}
      testId={testId}
      className="mb-4 flex max-w-md items-center gap-2"
    />
  );
}
