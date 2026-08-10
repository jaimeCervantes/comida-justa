"use client";
import { useTranslations } from "next-intl";
import { lineAmount, type OrderLine, orderTotal } from "~/domain/order/order";
import { SITE_CURRENCY } from "~/infra/constants";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

/**
 * Los renglones de un pedido y lo que suman.
 *
 * **El total se calcula aquí, de los renglones**, y no viaja como dato: la tabla no guarda ninguna
 * columna `total` precisamente para que no pueda desincronizarse de lo que la compone.
 *
 * No enlaza a las publicaciones. El renglón guarda una copia del título y del precio, no el slug: un
 * pedido tiene que poder leerse aunque el producto ya no exista.
 */
export default function OrderLines({ lines }: { lines: OrderLine[] }) {
  const t = useTranslations("orders");

  return (
    <>
      <ul data-testid="order-lines">
        {lines.map((line) => (
          <li
            key={`${line.postId}-${line.title}`}
            className="flex items-center justify-between gap-3 border-t border-separator py-2 first:border-t-0"
          >
            <span>
              {line.quantity} × {line.title}
            </span>
            <CurrencyAmount value={lineAmount(line)} currency={SITE_CURRENCY} />
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-center justify-between gap-3 border-t border-separator pt-3 text-body-lg">
        <span className="font-medium">{t("total")}</span>
        <span data-testid="order-total">
          <CurrencyAmount value={orderTotal(lines)} currency={SITE_CURRENCY} />
        </span>
      </p>
    </>
  );
}
