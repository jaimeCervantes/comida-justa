"use client";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect } from "react";
import type { CourierLocation } from "~/domain/order/order";
import { useRouter } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";

/** Mismo motivo que `StoresMapCanvas`: Leaflet toca `window` al importarse. */
const CourierMapCanvas = dynamic(() => import("./CourierMapCanvas"), {
  ssr: false,
});

/**
 * Cada cuánto se pregunta de nuevo. No hace falta menos: un pedido de comida no necesita
 * actualización al segundo, y el sitio no tiene conexiones persistentes hoy — es *polling*, no un
 * websocket.
 */
const POLL_INTERVAL_MS = 15_000;

/**
 * Dónde va el pedido, mientras está Enviado.
 *
 * **Se refresca solo.** `router.refresh()` vuelve a correr el Server Component de la página, que
 * relee `courierLocation` de la base — es la misma vía por la que llegó la primera vez, y la única
 * que existe: el repartidor no tiene sesión con la que abrir un canal en tiempo real.
 */
export default function CourierMap({
  location,
}: {
  location: CourierLocation | null;
}) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => router.refresh(), POLL_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [router]);

  return (
    <section data-testid="courier-map">
      <Heading level={2} size="xs" className="mb-2">
        {t("courierMapHeading")}
      </Heading>

      {location ? (
        <>
          <CourierMapCanvas location={location} />
          <p
            className="mt-2 text-label text-text-support"
            data-testid="courier-map-updated"
          >
            {t("courierMapUpdated", {
              date: format.dateTime(location.updatedAt, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        </>
      ) : (
        <p className="text-text-support" data-testid="courier-map-empty">
          {t("courierMapEmpty")}
        </p>
      )}
    </section>
  );
}
