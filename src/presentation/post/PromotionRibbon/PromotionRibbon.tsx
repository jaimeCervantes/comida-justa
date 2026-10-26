import { useTranslations } from "next-intl";
import { currentPrice } from "~/domain/entities/post/promotion";
import { cn } from "~/presentation/design_system/styling/merge-class-names";

type Props = {
  price?: number | null;
  salePrice?: number | null;
  saleEndsAt?: Date | string | null;
  /**
   * `tape`, la cinta horizontal pegada al borde, es la de la tarjeta. `corner` es una banda en
   * diagonal que cruza la esquina superior izquierda: la ficha tiene la foto grande y esa esquina
   * libre, y ahí la oferta se ve antes que nada. En la tarjeta esa esquina es del pilar.
   */
  variant?: "tape" | "corner";
  className?: string;
};

/**
 * El cintillo «Promoción · -N%» sobre la foto de una tarjeta o de la ficha.
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
  variant = "tape",
  className,
}: Props) {
  const t = useTranslations("post");

  if (typeof price !== "number") return null;

  const current = currentPrice({ price, salePrice, saleEndsAt }, new Date());

  if (current.discountPercent === null) return null;

  const label = t("saleRibbon", { percent: current.discountPercent });

  if (variant === "corner") {
    /* El marco es un cuadrado que recorta: la banda es más larga que la diagonal que se ve, así sus
       extremos quedan fuera y la esquina queda cortada limpia. Se posiciona contra el marco, no
       contra la foto, y por eso solo hace falta colocar el marco. */
    return (
      <span
        data-testid="promotion-ribbon"
        className={cn(
          "pointer-events-none absolute left-0 top-0 size-52 overflow-hidden sm:size-56",
          className,
        )}
      >
        <span className="absolute left-[-3.25rem] top-[4.5rem] block w-[17rem] -rotate-45 bg-brand-clay-700 py-1.5 text-center text-sm font-bold text-white shadow-md sm:left-[-3.75rem] sm:top-[5rem] sm:w-[20rem] sm:py-2 sm:text-base">
          {label}
        </span>
      </span>
    );
  }

  return (
    <span
      data-testid="promotion-ribbon"
      className={cn(
        "pointer-events-none rounded-r-full bg-brand-clay-700 py-1 pl-2 pr-3 text-xs font-semibold text-white shadow-md",
        className,
      )}
    >
      {label}
    </span>
  );
}
