"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import ListSearchField from "~/presentation/search/ListSearchField/ListSearchField";
import { type OrdersParams, ordersHref } from "./ordersHref";

/**
 * La búsqueda de la lista de pedidos.
 *
 * El comportamiento vive en `ListSearchField`, compartido con el panel de inventario y el catálogo
 * de una tienda; aquí queda lo único que es de los pedidos: cómo se arma su dirección, qué filtros
 * viajan ocultos para que Enter siga funcionando sin JavaScript, y en qué namespace están sus
 * frases.
 */
export default function OrdersSearchField({
  current,
}: {
  current: OrdersParams;
}) {
  const t = useTranslations("orders");

  const hrefForTerm = useCallback(
    (term: string) => ordersHref(current, { term, page: 1 }),
    [current],
  );

  return (
    <ListSearchField
      term={current.term}
      hrefForTerm={hrefForTerm}
      labels={{
        placeholder: t("searchPlaceholder"),
        label: t("searchLabel"),
      }}
      hiddenFields={
        <>
          <input type="hidden" name="vista" value={current.view} />
          {current.scope === "open" ? null : (
            <input type="hidden" name="estado" value={current.scope} />
          )}
        </>
      }
      testId="orders-search"
    />
  );
}
