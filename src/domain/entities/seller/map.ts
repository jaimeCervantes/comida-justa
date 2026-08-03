import type { Coordinates } from "./coordinates";

/** Una tienda que se puede pintar en el mapa: tiene dónde estar y a dónde enlazar. */
export interface MappedStore {
  handle: string;
  name: string;
  coordinates: Coordinates;
  meters: number;
}

/** Cuántos pines tiene sentido pintar a la vez: más de esto es una mancha, no un mapa. */
export const MAP_STORES_LIMIT = 20;

export interface MapBounds {
  southWest: Coordinates;
  northEast: Coordinates;
}

/**
 * El rectángulo que encuadra a quien mira **y** a las tiendas que se le muestran.
 *
 * Encuadrar solo las tiendas dejaría fuera al visitante, y un mapa donde no te ves no sirve para
 * decidir por cercanía: la pregunta que contesta es "¿cuál me queda de camino?", no "¿dónde están".
 *
 * Devuelve `null` sin tiendas que situar, porque un mapa con un solo pin —el tuyo— no dice nada.
 */
export function boundsFor(
  visitor: Coordinates,
  stores: readonly MappedStore[],
): MapBounds | null {
  if (stores.length === 0) return null;

  const latitudes = [
    visitor.latitude,
    ...stores.map((s) => s.coordinates.latitude),
  ];
  const longitudes = [
    visitor.longitude,
    ...stores.map((s) => s.coordinates.longitude),
  ];

  return {
    southWest: {
      latitude: Math.min(...latitudes),
      longitude: Math.min(...longitudes),
    },
    northEast: {
      latitude: Math.max(...latitudes),
      longitude: Math.max(...longitudes),
    },
  };
}
