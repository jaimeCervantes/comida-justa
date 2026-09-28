/** Un punto en el mapa. */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Un camino calculado entre dos puntos por un servicio de rutas.
 *
 * Genérico a propósito: no sabe de pedidos ni de repartidores, para que lo use cualquier negocio que
 * necesite "cómo se llega de aquí a allá".
 */
export interface Route {
  distanceMeters: number;
  durationSeconds: number;
  /** El trazo, en orden, del origen al destino. */
  path: GeoPoint[];
}

/**
 * Los minutos que da el servicio, hacia arriba y nunca menos de uno — mismo criterio que
 * `etaMinutes`: "0 min" se leería como "ya llegó".
 */
export function routeMinutes(route: Pick<Route, "durationSeconds">): number {
  return Math.max(1, Math.ceil(route.durationSeconds / 60));
}
