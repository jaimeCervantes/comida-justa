"use client";
import { useTranslations } from "next-intl";
import { MdMyLocation } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareLocation } from "./useShareLocation";

/**
 * El botón suelto que acompaña a una publicación cuando no se le puede poner distancia.
 *
 * Al negar el permiso se retira en silencio y deja una línea corta. La explicación larga y la
 * invitación a abrir tienda las da `LocationNotice`, arriba de la sección: repetirlas junto a cada
 * tarjeta sería insistirle a quien ya contestó que no.
 */
export default function ShareLocationButton({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const t = useTranslations("distance");
  const { state, isBusy, share } = useShareLocation();

  if (state === "failed") {
    return (
      <span
        data-testid="location-denied"
        className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        {t("denied")}
      </span>
    );
  }

  return (
    <Button
      type="button"
      onClick={share}
      isLoading={isBusy}
      loadingLabel={t("locating")}
      startIcon={<MdMyLocation aria-hidden />}
      size={size}
      className={className}
      data-testid="share-location"
    >
      {t("share")}
    </Button>
  );
}
