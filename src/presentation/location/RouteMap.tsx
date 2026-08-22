"use client";
import dynamic from "next/dynamic";
import { useFormatter, useTranslations } from "next-intl";
import type { RoutePoint } from "~/domain/entities/post/gpx";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * `next/dynamic` con `ssr: false` por el mismo motivo que en `StoresMap`: Leaflet toca `window` al
 * importarse y renderizarlo en el servidor revienta la página. Por eso el lienzo vive en su propio
 * módulo en vez de detrás de un `if` aquí dentro.
 */
const RouteMapCanvas = dynamic(() => import("./RouteMapCanvas"), {
  ssr: false,
});

type Props = {
  points: readonly RoutePoint[];
  lengthMeters: number;
  className?: string;
};

/**
 * El recorrido de un evento: por dónde se va y cuánto mide.
 *
 * Los kilómetros van en el encabezado y no solo en el mapa porque son la pregunta que se hace
 * **antes** de mirar el trazo: quien corre decide si va según si son 5 km o 21, y eso tiene que
 * leerse sin abrir nada.
 */
export default function RouteMap({
  points,
  lengthMeters,
  className = "mb-4",
}: Props) {
  const t = useTranslations("post");
  const format = useFormatter();

  if (points.length < 2) return null;

  /* Por debajo de un kilómetro se dicen metros, igual que hace `describeDistance` con la distancia
     a una tienda: "0,8 km" se lee peor que "800 m". */
  const distance =
    lengthMeters < 1_000
      ? t("routeMeters", { meters: Math.round(lengthMeters) })
      : t("routeKilometers", {
          km: format.number(lengthMeters / 1_000, {
            maximumFractionDigits: 1,
          }),
        });

  return (
    <section className={className} data-testid="route-map">
      <Heading level={2} size="xs" className="mb-2">
        {t("routeHeading")}{" "}
        <span className="font-normal text-body" data-testid="route-length">
          {distance}
        </span>
      </Heading>
      <RouteMapCanvas
        points={points}
        startLabel={t("routeStart")}
        finishLabel={t("routeFinish")}
      />
    </section>
  );
}
