"use client";
import { useEffect, useRef, useState } from "react";
import type { Route } from "~/domain/routing/route";
import { routeToDestination } from "~/presentation/orders/orderActions";

/**
 * Cada cuánto se vuelve a pedir el camino, como mínimo.
 *
 * El mapa se refresca cada 15 s, pero el camino no: cada consulta a Mapbox cuenta contra la cuota y
 * **no se puede guardar** (cláusula 2.10.1 de sus términos). Un repartidor en moto recorre unos
 * 300 m por minuto; volver a trazar más seguido no cambia lo que se ve.
 */
export const ROUTE_REFRESH_MS = 60_000;

/**
 * El camino por calles que le falta al repartidor, mientras `enabled` (lo decide el servidor con
 * `shouldRequestRoute`: Enviado, con destino y con posición fresca).
 *
 * Vive **solo en el estado de este componente** —nunca en la base, ni en `localStorage`—, que es lo
 * que permiten los términos de Mapbox. Al dejar de estar habilitado se descarta.
 */
export function useDeliveryRoute(
  orderId: string,
  enabled: boolean,
): Route | null {
  const [route, setRoute] = useState<Route | null>(null);
  /* La última consulta, para que un cambio de `enabled` (fresca → vieja → fresca) no dispare una
     consulta de más dentro del mismo minuto. */
  const lastRequestedAt = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (!enabled) {
      setRoute(null);
      return;
    }

    let cancelled = false;

    const request = (): void => {
      const now = Date.now();

      if (now - lastRequestedAt.current < ROUTE_REFRESH_MS) return;

      lastRequestedAt.current = now;
      routeToDestination(orderId)
        .then((next) => {
          if (!cancelled) setRoute(next);
        })
        .catch(() => {
          if (!cancelled) setRoute(null);
        });
    };

    request();
    const id = window.setInterval(request, ROUTE_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId, enabled]);

  return route;
}
