"use client";
import { useTranslations } from "next-intl";
import { lineAmount, type OrderLine, orderTotal } from "~/domain/order/order";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import Thumbnail from "~/presentation/media/Thumbnail/Thumbnail";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

/**
 * Los renglones de un pedido y lo que suman.
 *
 * **El total se calcula aquí, de los renglones**, y no viaja como dato: la tabla no guarda ninguna
 * columna `total` precisamente para que no pueda desincronizarse de lo que la compone.
 *
 * La miniatura y el enlace salen de la publicación **de hoy**, no del pedido: lo que el renglón
 * congela es el título y el precio, que es lo que se acordó. Si la publicación se borró, el renglón
 * se sigue leyendo entero —con su texto y su importe— y simplemente no lleva foto ni enlace. Es lo
 * mismo que ya garantiza el `ON DELETE SET NULL` de `post_id`.
 */
export default function OrderLines({ lines }: { lines: OrderLine[] }) {
  const t = useTranslations("orders");

  return (
    <>
      <ul data-testid="order-lines">
        {lines.map((line) => (
          <li
            key={`${line.postId ?? "sin-post"}-${line.title}`}
            className="flex items-center gap-3 border-t border-separator py-2 first:border-t-0"
          >
            <LineIdentity line={line} />
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

/** La foto y el nombre, enlazados al producto cuando todavía existe. */
function LineIdentity({ line }: { line: OrderLine }) {
  const label = `${line.quantity} × ${line.title}`;
  /* La misma miniatura que el carrito: decorativa, y nada cuando no hay archivo. Se comparte en vez
     de escribirla dos veces — la segunda copia es donde empiezan a discrepar. */
  const thumb = <Thumbnail url={line.imageUrl} testId="order-line-image" />;

  if (!line.slug) {
    return (
      <span className="flex min-w-0 grow items-center gap-3">
        {thumb}
        <span className="min-w-0 truncate">{label}</span>
      </span>
    );
  }

  return (
    <Link
      href={{ pathname: "/[slug]", params: { slug: line.slug } }}
      data-testid="order-line-link"
      className="flex min-w-0 grow items-center gap-3 hover:text-pw-lightgreen"
    >
      {thumb}
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
