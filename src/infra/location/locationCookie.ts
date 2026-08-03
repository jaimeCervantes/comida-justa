import {
  areValidCoordinates,
  type Coordinates,
} from "~/domain/entities/seller/coordinates";

/** La comparte el navegador y la lee el servidor: por eso una cookie y no `localStorage`. */
export const VISITOR_LOCATION_COOKIE = "hs_location";

/** Un año: la ubicación de alguien cambia, pero no cada sesión, y siempre puede volver a darla. */
export const VISITOR_LOCATION_MAX_AGE = 60 * 60 * 24 * 365;

export function serializeCoordinates(value: Coordinates): string {
  return `${value.latitude},${value.longitude}`;
}

/** Una cookie la escribe cualquiera: lo que venga se valida antes de creerle. */
export function parseCoordinates(
  raw: string | null | undefined,
): Coordinates | null {
  if (!raw) return null;

  const [latitude, longitude] = raw.split(",").map(Number);
  const parsed = { latitude, longitude };

  return areValidCoordinates(parsed) ? parsed : null;
}
