"use client";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { MdMyLocation } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { shareLocation } from "./actions";

type GeolocationState = "idle" | "locating" | "failed";

/**
 * Le pide al navegador dónde está quien mira, y lo manda al servidor.
 *
 * Es el mismo trámite que ya hacía `AddBranchForm` para la sucursal, con una diferencia: aquí no
 * hay formulario que enviar después, así que la respuesta se guarda sola y la página se vuelve a
 * pintar con las distancias puestas.
 *
 * **Negar el permiso no es un error que haya que remediar.** Se dice una vez, en seco, y el sitio
 * sigue funcionando igual que antes: sin distancias y con lo más reciente primero. Insistir sería
 * castigar a quien contestó que no.
 */
export default function ShareLocationButton({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "xs" | "sm" | "md";
}) {
  const t = useTranslations("distance");
  const [state, setState] = useState<GeolocationState>("idle");
  const [isPending, startTransition] = useTransition();

  const share = (): void => {
    if (!navigator.geolocation) {
      setState("failed");
      return;
    }

    setState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const data = new FormData();
        data.set("latitude", String(position.coords.latitude));
        data.set("longitude", String(position.coords.longitude));

        startTransition(async () => {
          await shareLocation(data);
        });
      },
      () => setState("failed"),
    );
  };

  if (state === "failed") {
    return (
      <p
        data-testid="location-denied"
        className={`text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        {t("denied")}
      </p>
    );
  }

  return (
    <Button
      type="button"
      onClick={share}
      isLoading={state === "locating" || isPending}
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
