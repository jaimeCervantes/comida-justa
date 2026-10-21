"use client";

import { useFormatter, useTranslations } from "next-intl";
import { currentPrice } from "~/domain/entities/post/promotion";
import { Badge } from "~/presentation/design_system/badges/Badge";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";

/**
 * El tachado del precio normal, centrado en las cifras.
 *
 * No es el `line-through` del navegador: ese lo dibuja la fuente de `<del>`, y la cifra va en la
 * fuente de exhibición (`font-display`), así que la raya caía casi en la base de los números y no
 * se leía como «ya no es el precio». Una raya de 2px a media altura de la cifra sí. `<del>` se
 * conserva por lo que dice a un lector de pantalla.
 */
export const STRUCK_PRICE =
  "relative inline-block no-underline after:pointer-events-none after:absolute after:inset-x-[-2px] after:top-[55%] after:h-[2px] after:-translate-y-1/2 after:rounded-full after:bg-current after:content-['']";

type Props = {
  price?: number | null;
  salePrice?: number | null;
  saleEndsAt?: Date | string | null;
  currency?: string;
  className?: string;
  /** Para el precio que se cobra, con o sin promoción: la tarjeta lo agranda en modo renglón. */
  amountClassName?: string;
  /**
   * La tarjeta lo apaga: ahí cabe el precio y la insignia, no la fecha. Quien quiera saber hasta
   * cuándo abre la ficha, que sí la dice.
   */
  showEnds?: boolean;
};

/**
 * El precio que se cobra hoy y, si hay promoción vigente, el normal tachado y cuánto se ahorra.
 *
 * **Es de cliente por la misma razón que `EventDate`**: la vigencia se decide contra el reloj
 * (`currentPrice`), y una página cacheada en el servidor seguiría anunciando una oferta vencida. El
 * carrito y el pedido deciden con la misma función, así que lo que se enseña es lo que se cobra.
 *
 * Sin precio no pinta nada, como `CurrencyAmount`: un anuncio no tiene.
 */
export default function PromotionPrice({
  price,
  salePrice,
  saleEndsAt,
  currency,
  className,
  amountClassName,
  showEnds = true,
}: Props) {
  const t = useTranslations("post");
  const format = useFormatter();

  if (typeof price !== "number") {
    return <CurrencyAmount value={price} currency={currency} />;
  }

  const current = currentPrice({ price, salePrice, saleEndsAt }, new Date());

  if (current.regularPrice === null) {
    return (
      <CurrencyAmount
        value={current.price}
        currency={currency}
        className={cn(amountClassName, className)}
      />
    );
  }

  return (
    <span
      data-testid="promotion-price"
      className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}
    >
      {/* `<del>` y no solo `line-through`: un lector de pantalla también tiene que saber que ese
          precio ya no es el que se cobra. */}
      <del
        data-testid="promotion-regular-price"
        className={cn(STRUCK_PRICE, "text-text-support")}
      >
        <span className="sr-only">{t("saleRegularPrice")}: </span>
        <CurrencyAmount
          value={current.regularPrice}
          currency={currency}
          className="text-body text-text-support"
        />
      </del>
      <span data-testid="promotion-sale-price">
        <CurrencyAmount
          value={current.price}
          currency={currency}
          className={amountClassName}
        />
      </span>
      <Badge tone="accent" data-testid="promotion-discount">
        {t("saleDiscount", { percent: current.discountPercent ?? 0 })}
      </Badge>
      {showEnds && current.endsAt ? (
        <span
          data-testid="promotion-ends"
          className="text-sm text-text-support"
        >
          {t("saleUntil", {
            date: format.dateTime(current.endsAt, {
              day: "numeric",
              month: "long",
            }),
          })}
        </span>
      ) : null}
    </span>
  );
}
