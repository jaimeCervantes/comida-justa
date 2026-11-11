"use client";
import { type ComponentProps, useCallback } from "react";
import {
  type ListingFilterState,
  listingFilterParams,
} from "~/domain/entities/post/listingFilters";
import type { AppPathname } from "~/i18n/navigation";
import ListSearchField, {
  type ListSearchLabels,
} from "~/presentation/search/ListSearchField/ListSearchField";
import { listingQuery } from "./listingQuery";

/** La dirección que entiende `router.replace`: la ruta del listado viaja como dato, no como literal. */
type SearchHref = ReturnType<
  ComponentProps<typeof ListSearchField>["hrefForTerm"]
>;

/**
 * Buscar por palabras dentro de un listado público —una tienda, un perfil— sin soltar sus filtros.
 *
 * **La ve cualquiera**, no solo el dueño: un catálogo de 418 productos es un muro para quien viene a
 * comprar, y buscar dentro de él no es administrar nada. El comportamiento —esperar a que se deje de
 * teclear, Enter sin JavaScript— vive en `ListSearchField`, compartido con los pedidos y el
 * inventario; esto le añade lo que tienen en común los listados: el término viaja en `?q=` junto a
 * pilar, existencia y promoción.
 *
 * Busca siempre desde la **página 1**: el resultado de un término nuevo no tiene por qué tener la
 * página en la que estabas, y la ruta paginada es un segmento, no un parámetro.
 */
export default function ListingSearchField({
  pathname,
  params,
  term,
  filters,
  labels,
  testId,
}: {
  /** La ruta de la página 1 del listado. */
  pathname: AppPathname;
  params: Record<string, string>;
  term: string;
  filters: ListingFilterState;
  labels: ListSearchLabels;
  testId: string;
}) {
  const filterParams = listingFilterParams(filters);

  const hrefForTerm = useCallback(
    (next: string) =>
      ({
        pathname,
        params,
        query: listingQuery({ ...listingFilterParams(filters), q: next }),
      }) as SearchHref,
    [pathname, params, filters],
  );

  return (
    <ListSearchField
      term={term}
      hrefForTerm={hrefForTerm}
      labels={labels}
      /* Los filtros viajan ocultos para no perderse cuando el envío lo hace el navegador. */
      hiddenFields={Object.entries(filterParams).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}
      testId={testId}
      className="mb-4 flex items-center gap-2"
    />
  );
}
