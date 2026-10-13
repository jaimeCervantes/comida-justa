"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { OutreachProductOption } from "~/use_cases/outreach/ports/IOutreachProductCatalog";

/** Cuántas coincidencias se enseñan: con más, lo que hay que hacer es escribir otra letra. */
const MAX_MATCHES = 8;

interface ProductPickerProps {
  products: readonly OutreachProductOption[];
  addedIds: ReadonlySet<string>;
  onAdd: (product: OutreachProductOption) => void;
}

/** «arandanos» encuentra «arándanos»: nadie teclea los acentos en un buscador. */
function searchable(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * El buscador del formulario: filtra en el navegador, porque el catálogo cabe entero (unos
 * cuatrocientos títulos) y una ida al servidor por letra haría esperar a quien teclea.
 */
export default function ProductPicker({
  products,
  addedIds,
  onAdd,
}: ProductPickerProps) {
  const t = useTranslations("outreach");
  const [term, setTerm] = useState("");
  const wanted = searchable(term.trim());
  const matches = wanted
    ? products
        .filter((product) => searchable(product.title).includes(wanted))
        .slice(0, MAX_MATCHES)
    : [];

  // Un Enter en el buscador enviaría el formulario entero a medio llenar.
  const keepFormOpen = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") event.preventDefault();
  };

  return (
    <div data-testid="outreach-product-picker" className="mb-4">
      <TextField
        type="search"
        label={t("searchLabel")}
        placeholder={t("searchPlaceholder")}
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={keepFormOpen}
        containerClassName="mb-2"
      />

      {wanted && matches.length === 0 ? (
        <p className="text-sm text-text-support">{t("noMatches")}</p>
      ) : null}

      <ul className="flex flex-col gap-1">
        {matches.map((product) => {
          const added = addedIds.has(product.postId);

          return (
            <li
              key={product.postId}
              data-testid="outreach-product-match"
              className="flex items-center justify-between gap-3"
            >
              <span>{product.title}</span>
              {added ? (
                <span className="text-sm text-text-support">
                  {t("alreadyAdded")}
                </span>
              ) : (
                <Button size="sm" onClick={() => onAdd(product)}>
                  {t("addProduct")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
