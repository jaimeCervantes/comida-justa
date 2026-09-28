import type { RouteProvider } from "~/domain/routing/ports";
import MapboxRouteProvider from "./MapboxRouteProvider";

/** Sin clave no hay camino: la ficha se queda con la recta, igual que antes de Mapbox. */
const noRoutes: RouteProvider = { routeBetween: async () => null };

/**
 * El servicio de rutas del sitio. `MAPBOX_ACCESS_TOKEN` se lee aquí y **solo en el servidor**: nunca
 * lleva el prefijo `NEXT_PUBLIC_`, así que no llega al navegador. `MAPBOX_DIRECTIONS_BASE_URL` solo
 * existe para los e2e (un Mapbox falso local).
 */
export function createRouteProvider(): RouteProvider {
  const accessToken = process.env.MAPBOX_ACCESS_TOKEN?.trim();

  if (!accessToken) return noRoutes;

  return new MapboxRouteProvider({
    accessToken,
    baseUrl: process.env.MAPBOX_DIRECTIONS_BASE_URL || undefined,
  });
}
