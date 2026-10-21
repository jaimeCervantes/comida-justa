"use client";

import { useTranslations } from "next-intl";
import { currentPrice } from "~/domain/entities/post/promotion";
import { cn } from "~/presentation/design_system/styling/merge-class-names";

type Props = {
  price?: number | null;
  salePrice?: number | null;
  saleEndsAt?: Date | string | null;
  className?: string;
};

/**
 * El cintillo «Promoción · -N%» sobre la foto de una tarjeta.
 *
 * En un listado lo primero que se mira es la imagen, y el precio tachado queda abajo, entre las
 * demás insignias: sin esto, una oferta se notaba solo a quien ya estaba leyendo precios. Va pegado
 * al borde izquierdo, como una cinta, y no como otra píldora, para que no se confunda con el pilar.
 *
 * **De cliente, como `PromotionPrice`**: la vigencia se decide contra el reloj al pintar, y una
 * página cacheada no debe seguir anunciando una oferta vencida. Sin promoción vigente no pinta nada.
 */
export default function PromotionRibbon({
  price,
  salePrice,
  saleEndsAt,
  className,
}: Props) {
  const t = useTranslations("post");

  if (typeof price !== "number") return null;

  const current = currentPrice({ price, salePrice, saleEndsAt }, new Date());

  if (current.discountPercent === null) return null;

  return (
    <span
      data-testid="promotion-ribbon"
      className={cn(
        "pointer-events-none rounded-r-full bg-brand-clay-700 py-1 pl-2 pr-3 text-xs font-semibold text-white shadow-md",
        className,
      )}
    >
      {t("saleRibbon", { percent: current.discountPercent })}
    </span>
  );
}
