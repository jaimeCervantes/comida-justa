import { useTranslations } from "next-intl";
import { MdPlace } from "react-icons/md";
import { describeDistance } from "~/domain/entities/seller/distance";

/**
 * A qué distancia está la tienda de quien mira.
 *
 * No se pinta nada cuando no hay distancia —ni la tienda dio ubicación, ni el visitante la suya—,
 * porque un "distancia desconocida" ocupa espacio para no decir nada.
 */
export default function StoreDistance({
  meters,
  className = "",
}: {
  meters: number | null;
  className?: string;
}) {
  const t = useTranslations("distance");
  const described = meters === null ? null : describeDistance(meters);

  if (!described) return null;

  return (
    <span
      data-testid="store-distance"
      className={`inline-flex items-center gap-1 text-sm text-text-support ${className}`}
    >
      <MdPlace aria-hidden />
      {described.unit === "meters"
        ? t("meters", { value: described.value })
        : t("kilometers", { value: described.value })}
    </span>
  );
}
