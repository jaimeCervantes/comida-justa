"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import { PUBLICATION_PILLAR_QUERY_PARAM } from "~/domain/entities/post/publicationPillars";
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
}: {
  handle: string;
  term: string;
  currentPillar: PublicationPillar | null;
}) {
  const t = useTranslations("store");

  const hrefForTerm = useCallback(
    (next: string) => ({
      pathname: "/tienda/[slug]" as const,
      params: { slug: handle },
      query: {
        ...(currentPillar
          ? { [PUBLICATION_PILLAR_QUERY_PARAM]: currentPillar }
          : {}),
        ...(next ? { q: next } : {}),
      },
    }),
    [handle, currentPillar],
  );

  return (
    <ListSearchField
      term={term}
      hrefForTerm={hrefForTerm}
      labels={{
        placeholder: t("searchPlaceholder"),
        label: t("searchLabel"),
      }}
      /* El pilar viaja oculto para no perderse cuando el envío lo hace el navegador. */
      hiddenFields={
        currentPillar ? (
          <input
            type="hidden"
            name={PUBLICATION_PILLAR_QUERY_PARAM}
            value={currentPillar}
          />
        ) : null
      }
      testId="store-search"
      className="mb-4 flex items-center gap-2"
    />
  );
}
