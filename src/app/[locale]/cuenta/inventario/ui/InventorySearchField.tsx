"use client";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import ListSearchField from "~/presentation/search/ListSearchField/ListSearchField";
import { type InventoryParams, inventoryHref } from "./inventoryHref";

/**
 * La búsqueda del panel de inventario.
 *
 * El comportamiento vive en `ListSearchField`, compartido con los pedidos y el catálogo de una
 * tienda; aquí sólo queda cómo se arma la dirección del panel y qué filtro viaja oculto para que
 * Enter siga funcionando sin JavaScript.
 */
export default function InventorySearchField({
  current,
}: {
  current: InventoryParams;
}) {
  const t = useTranslations("account");

  const hrefForTerm = useCallback(
    (term: string) => inventoryHref(current, { term, page: 1 }),
    [current],
  );

  return (
    <ListSearchField
      term={current.term}
      hrefForTerm={hrefForTerm}
      labels={{
        placeholder: t("inventorySearchPlaceholder"),
        label: t("inventorySearchLabel"),
      }}
      hiddenFields={
        current.scope === "all" ? null : (
          <input type="hidden" name="filtro" value={current.scope} />
        )
      }
      testId="inventory-search"
      className="mb-4 flex items-center gap-2"
    />
  );
}
