"use client";

import { useTranslations } from "next-intl";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";
import AmountCurrency from "~/presentation/money/CurrencyAmount";
import PageButtons from "~/presentation/navigation/PageButtons";
import type {
  OutreachProductOption,
  OutreachProductPage,
} from "~/use_cases/outreach/searchOutreachProductsUseCase";
import { searchOutreachProducts } from "../actions";

/** Lo que se espera a que se deje de teclear antes de preguntar: una ida al servidor por palabra, no por letra. */
const TYPING_PAUSE_MS = 300;

interface ProductPickerProps {
  addedIds: ReadonlySet<string>;
  onAdd: (product: OutreachProductOption) => void;
}

/**
 * El buscador del formulario: **la búsqueda del sitio**, limitada a lo que se vende y de diez en
 * diez, con números de página.
 *
 * Antes filtraba en el navegador comparando letras del título, y se quedaba con ocho: «pan
 * chocolate» no encontraba «Pan de Masa Madre de Chocolate». Ahora pregunta al servidor
 * (`searchOutreachProducts`), que busca por palabras con ranking y, si no encuentra nada, por
 * sentido.
 *
 * Los números son botones (`PageButtons`), no enlaces: el buscador vive dentro de un formulario a
 * medio llenar, y cambiar de página no puede salir de él. Si llegan dos respuestas, solo cuenta la
 * de lo último que se pidió: una búsqueda vieja que tarda más no puede pisar a la nueva.
 */
export default function ProductPicker({ addedIds, onAdd }: ProductPickerProps) {
  const t = useTranslations("outreach");
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<OutreachProductPage | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);

  const fetchPage = (wanted: string, page: number): void => {
    const request = ++latest.current;
    setIsSearching(true);

    searchOutreachProducts(wanted, page)
      .then((next) => {
        if (request !== latest.current) return;
        setResult(next);
        setFailed(false);
      })
      .catch(() => {
        if (request === latest.current) setFailed(true);
      })
      .finally(() => {
        if (request === latest.current) setIsSearching(false);
      });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: solo cambia con lo escrito; `fetchPage` se rehace en cada render.
  useEffect(() => {
    const wanted = term.trim();

    if (!wanted) {
      latest.current++;
      setResult(null);
      setIsSearching(false);
      setFailed(false);
      return;
    }

    const timer = setTimeout(() => fetchPage(wanted, 1), TYPING_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  // Un Enter en el buscador enviaría el formulario entero a medio llenar.
  const keepFormOpen = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") event.preventDefault();
  };

  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 0;

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

      <p
        role="status"
        data-testid="outreach-product-status"
        className="mb-2 text-sm text-text-support"
      >
        {failed
          ? t("searchFailed")
          : isSearching
            ? t("searching")
            : result && term.trim()
              ? result.total === 0
                ? t("noMatches")
                : t("searchCount", { count: result.total })
              : null}
      </p>

      {result && term.trim() ? (
        <>
          <ul className="flex flex-col gap-2">
            {result.matches.map((product) => (
              <li
                key={product.postId}
                data-testid="outreach-product-match"
                className="flex items-center gap-3"
              >
                <Thumbnail url={product.photoUrl} size={40} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="break-words">{product.title}</span>
                  <AmountCurrency
                    value={product.price}
                    className="text-sm font-sans text-text-support"
                  />
                </span>
                {addedIds.has(product.postId) ? (
                  <span className="text-sm text-text-support">
                    {t("alreadyAdded")}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      onAdd({
                        postId: product.postId,
                        title: product.title,
                        price: product.price,
                      })
                    }
                  >
                    {t("addProduct")}
                  </Button>
                )}
              </li>
            ))}
          </ul>

          <PageButtons
            page={result.page}
            totalPages={totalPages}
            onSelect={(page) => fetchPage(term.trim(), page)}
            disabled={isSearching}
            labels={{
              navigation: t("searchPages"),
              previous: t("searchPrevious"),
              next: t("searchNext"),
            }}
            testId="outreach-product-pages"
          />
        </>
      ) : null}
    </div>
  );
}
