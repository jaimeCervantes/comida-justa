"use client";
import { useTranslations } from "next-intl";
import { MdMyLocation } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareLocation } from "./useShareLocation";

/**
 * El botón suelto que acompaña a una publicación cuando no se le puede poner distancia.
 *
 * Al negar el permiso se retira en silencio y deja una línea corta. La explicación larga y la
 * invitación a abrir tienda las da `LocationNotice`, ahora desde la barra del chrome: repetirlas
 * junto a cada tarjeta sería insistirle a quien ya contestó que no.
 *
 * **Su `data-testid` es `share-location-inline`, y no `share-location`.** Desde que el aviso vive
 * en el chrome, los dos botones conviven en la misma pantalla: este va **en la fila de datos, justo
 * donde iría la distancia** —«no hay distancia aquí, dame la tuya»—, y el de la barra es el
 * ofrecimiento general del sitio. Son dos controles con dos trabajos, así que se llaman distinto.
 * Compartiendo nombre, cualquier `getByTestId` sobre una ficha resolvía a dos elementos y fallaba
 * en modo estricto — que es exactamente como se descubrió.
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
        className={`text-sm text-text-support ${className}`}
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
      data-testid="share-location-inline"
    >
      {t("share")}
    </Button>
  );
}
