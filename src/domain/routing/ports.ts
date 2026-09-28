import type { GeoPoint, Route } from "./route";

/**
 * Quien sabe calcular un camino por calles.
 *
 * Devuelve `null` cuando no hay camino que dar —sin servicio configurado, sin ruta posible, o el
 * servicio no contestó—: para quien lo usa, las tres son "sigue sin camino", y ninguna es un error
 * que deba verse.
 */
export interface RouteProvider {
  routeBetween(from: GeoPoint, to: GeoPoint): Promise<Route | null>;
}
