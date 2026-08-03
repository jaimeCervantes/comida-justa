import type { Coordinates } from "./coordinates";

/** Una tienda que se puede pintar en el mapa: tiene dónde estar y a dónde enlazar. */
export interface MappedStore {
  handle: string;
  name: string;
  coordinates: Coordinates;
  /** A cuántos metros está de quien mira, o `null` si quien mira no compartió su ubicación. */
  meters: number | null;
}

/** Cuántos pines tiene sentido pintar a la vez: más de esto es una mancha, no un mapa. */
export const MAP_STORES_LIMIT = 20;

/**
 * Cuánto acercar cuando solo hay un punto que enseñar.
 *
 * 15 es el nivel al que se distinguen las calles de un pueblo: encuadrar un único pin con un
 * rectángulo degenerado deja a Leaflet en su zoom máximo, mirando dos manzanas y sin contexto.
 */
export const SINGLE_POINT_ZOOM = 15;

export interface MapBounds {
  southWest: Coordinates;
  northEast: Coordinates;
}

/**
 * Cómo encuadrar el mapa.
 *
 * Son dos casos de verdad distintos, no uno con excepción:
 *
 * - **`bounds`** cuando hay más de un punto que enseñar —varias tiendas, o una tienda y quien
 *   mira—. Ahí la pregunta es "¿cuál me queda de camino?" y la respuesta es verlos juntos.
 * - **`center`** cuando solo hay uno. Es lo que pasa en el detalle de una publicación de alguien
 *   que no compartió su ubicación: la pregunta baja a "¿dónde está esta tienda?", y para eso un
 *   rectángulo de área cero no sirve.
 *
 * `null` cuando no hay ninguna tienda que situar: un mapa con un solo pin, el tuyo, no dice nada.
 */
export type MapView =
  | { kind: "bounds"; bounds: MapBounds }
  | { kind: "center"; center: Coordinates; zoom: number };

export function viewFor(
  visitor: Coordinates | null,
  stores: readonly MappedStore[],
): MapView | null {
  if (stores.length === 0) return null;

  const points = [
    ...(visitor ? [visitor] : []),
    ...stores.map((store) => store.coordinates),
  ];

  const bounds = boundsOf(points);

  return isSinglePoint(bounds)
    ? { kind: "center", center: points[0], zoom: SINGLE_POINT_ZOOM }
    : { kind: "bounds", bounds };
}

function boundsOf(points: readonly Coordinates[]): MapBounds {
  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);

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

function isSinglePoint({ southWest, northEast }: MapBounds): boolean {
  return (
    southWest.latitude === northEast.latitude &&
    southWest.longitude === northEast.longitude
  );
}
