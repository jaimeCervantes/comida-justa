"use client";
import { useFormatter, useTranslations } from "next-intl";
import { MdMyLocation } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { useShareLocation } from "~/presentation/location/useShareLocation";
import { shareDeliveryLocation } from "~/presentation/orders/orderActions";

/**
 * A dónde se entrega el pedido: si ya se compartió y cuándo, y el botón para compartirlo o
 * actualizarlo.
 *
 * Usa el mismo trámite con el navegador que `ShareLocationButton` (`useShareLocation`), pero manda
 * la posición al **pedido** y no a la cuenta: el destino de esta entrega no es "dónde estuve la
 * última vez". Tras guardar, la página se revalida sola y este bloque pasa a decir cuándo se
 * compartió.
 */
export default function DeliveryLocationShare({
  orderId,
  sharedAt,
}: {
  orderId: string;
  sharedAt: Date | null;
}) {
  const t = useTranslations("orders");
  const tDistance = useTranslations("distance");
  const format = useFormatter();
  const { state, isBusy, share } = useShareLocation(async (data) => {
    data.set("orderId", orderId);
    await shareDeliveryLocation(data);
  });

  return (
    <section data-testid="delivery-location">
      {sharedAt ? (
        <p
          className="mb-3 text-label text-text-support"
          data-testid="delivery-location-shared"
        >
          {t("deliveryLocationShared", {
            date: format.dateTime(sharedAt, {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          })}
        </p>
      ) : (
        <p
          className="mb-3 text-text-support"
          data-testid="delivery-location-missing"
        >
          {t("deliveryLocationMissing")}
        </p>
      )}

      {state === "failed" ? (
        <p
          className="text-sm text-text-support"
          data-testid="delivery-location-denied"
        >
          {t("deliveryLocationDenied")}
        </p>
      ) : (
        <Button
          type="button"
          onClick={share}
          isLoading={isBusy}
          loadingLabel={tDistance("locating")}
          startIcon={<MdMyLocation aria-hidden />}
          size="sm"
          data-testid="share-delivery-location"
        >
          {sharedAt ? t("deliveryLocationUpdate") : t("deliveryLocationShare")}
        </Button>
      )}
    </section>
  );
}
