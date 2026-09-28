"use client";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import { useEffect } from "react";
import { describeDistance } from "~/domain/entities/seller/distance";
import type { DeliveryProgress } from "~/domain/order/delivery";
import type { CourierLocation, DeliveryLocation } from "~/domain/order/order";
import { routeMinutes } from "~/domain/routing/route";
import { useRouter } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";
import MapboxAttribution from "./MapboxAttribution";
import { useDeliveryRoute } from "./useDeliveryRoute";

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
 *
 * **El camino por calles se pide aparte** (`useDeliveryRoute`, una vez por minuto) y no viaja con la
 * página: los términos de Mapbox prohíben guardarlo, así que vive solo aquí. Mientras llega —o si no
 * llega— todo queda como antes: recta punteada y estimación en línea recta.
 */
export default function CourierMap({
  orderId,
  location,
  progress = null,
  destination = null,
  staleMinutes = null,
  canRoute = false,
}: {
  orderId: string;
  location: CourierLocation | null;
  /** Distancia y tiempo aproximado; `null` sin destino guardado, y el mapa queda como antes. */
  progress?: DeliveryProgress | null;
  /** A dónde se entrega: con él, el mapa enseña los dos puntos unidos por una recta. */
  destination?: DeliveryLocation | null;
  /**
   * Cuánto hace de la posición del repartidor **si ya es vieja** (`staleMinutes` del dominio), o
   * `null`. Se calcula en el servidor, que es quien vuelve a pintar esto en cada `refresh`.
   */
  staleMinutes?: number | null;
  /** Si vale la pena pedir el camino por calles (`shouldRequestRoute`, decidido en el servidor). */
  canRoute?: boolean;
}) {
  const t = useTranslations("orders");
  const tDistance = useTranslations("distance");
  const route = useDeliveryRoute(orderId, canRoute);
  /* Con camino, la distancia es la del camino por calles; sin él, la recta que calculó PostGIS. */
  const meters = route?.distanceMeters ?? progress?.distanceMeters ?? null;
  const distance = meters === null ? null : describeDistance(meters);
  const distanceLabel = !distance
    ? ""
    : distance.unit === "meters"
      ? tDistance("meters", { value: distance.value })
      : tDistance("kilometers", { value: distance.value });
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
          {route && distance ? (
            <div className="mb-2" data-testid="delivery-progress">
              <p
                className="font-medium text-text-base"
                data-testid="delivery-progress-distance"
                data-source="route"
              >
                {t("deliveryRouteDistance", { distance: distanceLabel })}
              </p>
              <p
                className="text-label text-text-support"
                data-testid="delivery-progress-eta"
              >
                {t("deliveryRouteEta", { minutes: routeMinutes(route) })}
              </p>
            </div>
          ) : progress && distance ? (
            <div className="mb-2" data-testid="delivery-progress">
              <p
                className="font-medium text-text-base"
                data-testid="delivery-progress-distance"
                data-source="straight"
                data-stale={progress.staleMinutes !== null}
              >
                {progress.staleMinutes !== null
                  ? t("deliveryProgressDistanceStale", {
                      minutes: progress.staleMinutes,
                      distance: distanceLabel,
                    })
                  : t("deliveryProgressDistance", { distance: distanceLabel })}
              </p>
              {/* Sin tiempo estimado sobre una posición vieja: sería inventarlo. */}
              {progress.etaMinutes !== null ? (
                <p
                  className="text-label text-text-support"
                  data-testid="delivery-progress-eta"
                >
                  {t("deliveryProgressEta", { minutes: progress.etaMinutes })}
                </p>
              ) : null}
            </div>
          ) : null}
          <CourierMapCanvas
            location={location}
            destination={destination}
            routePath={route?.path ?? null}
          />
          {route ? <MapboxAttribution /> : null}
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
          {staleMinutes !== null ? (
            <p
              className="mt-1 text-label text-pw-orange"
              data-testid="courier-map-stale"
            >
              {t("courierMapStale", { minutes: staleMinutes })}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-text-support" data-testid="courier-map-empty">
          {t("courierMapEmpty")}
        </p>
      )}
    </section>
  );
}
