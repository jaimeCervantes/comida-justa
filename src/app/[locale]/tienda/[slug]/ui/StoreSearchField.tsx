"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { ONLY_AVAILABLE_QUERY_PARAM } from "~/domain/entities/post/catalogFilters";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
} from "~/domain/entities/post/publicationPillars";
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
  currentPillar,
  onlyAvailable = false,
}: {
  handle: string;
  term: string;
  currentPillar: PublicationPillar | null;
  onlyAvailable?: boolean;
}) {
  const t = useTranslations("store");

  const hrefForTerm = useCallback(
    (next: string) => ({
      pathname: "/tienda/[slug]" as const,
      params: { slug: handle },
      query: listingQuery({
        [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar,
        [ONLY_AVAILABLE_QUERY_PARAM]: onlyAvailable ? "1" : undefined,
        q: next,
      }),
    }),
    [handle, currentPillar, onlyAvailable],
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
      hiddenFields={
        <>
          {currentPillar ? (
            <input
              type="hidden"
              name={PUBLICATION_PILLAR_QUERY_PARAM}
              value={currentPillar}
            />
          ) : null}
          {onlyAvailable ? (
            <input type="hidden" name={ONLY_AVAILABLE_QUERY_PARAM} value="1" />
          ) : null}
        </>
      }
      testId="store-search"
      className="mb-4 flex items-center gap-2"
    />
  );
}
