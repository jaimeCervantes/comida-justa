"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import {
  type ListingFilterState,
  listingFilterParams,
} from "~/domain/entities/post/listingFilters";
import { listingQuery } from "~/presentation/post/ListingFilters/listingQuery";
import ListSearchField from "~/presentation/search/ListSearchField/ListSearchField";

/**
 * La búsqueda dentro del catálogo de una tienda.
 *
 * **La ve cualquiera**, no sólo su dueño: un catálogo de 418 productos es un muro para quien viene
 * a comprar, y buscar dentro de él no es administrar nada. El comportamiento vive en
 * `ListSearchField`, compartido con los pedidos y el panel de inventario.
 *
 * Busca siempre desde la **página 1**: el resultado de un término nuevo no tiene por qué tener la
 * página en la que estabas, y la ruta paginada es un segmento, no un parámetro.
 */
export default function StoreSearchField({
  handle,
  term,
  filters,
}: {
  handle: string;
  term: string;
  filters: ListingFilterState;
}) {
  const filterParams = listingFilterParams(filters);
  const t = useTranslations("store");

  const hrefForTerm = useCallback(
    (next: string) => ({
      pathname: "/tienda/[slug]" as const,
      params: { slug: handle },
      query: listingQuery({ ...listingFilterParams(filters), q: next }),
    }),
    [handle, filters],
  );

  return (
    <ListSearchField
      term={term}
      hrefForTerm={hrefForTerm}
      labels={{
        placeholder: t("searchPlaceholder"),
        label: t("searchLabel"),
      }}
      /* Los filtros viajan ocultos para no perderse cuando el envío lo hace el navegador. */
      hiddenFields={Object.entries(filterParams).map(([name, value]) =>
        value ? (
          <input key={name} type="hidden" name={name} value={value} />
        ) : null,
      )}
      testId="store-search"
      className="mb-4 flex items-center gap-2"
    />
  );
}
