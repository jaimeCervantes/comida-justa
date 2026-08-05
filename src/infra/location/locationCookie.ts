import {
  areValidCoordinates,
  type Coordinates,
} from "~/domain/entities/seller/coordinates";
import type { VisitorFix } from "~/domain/entities/seller/locationFreshness";

/** La comparte el navegador y la lee el servidor: por eso una cookie y no `localStorage`. */
export const VISITOR_LOCATION_COOKIE = "hs_location";

/**
 * Un año, igual que antes — pero ahora la cookie **también dice cuándo se escribió**, así que su
 * duración deja de ser una afirmación sobre la vigencia del dato. Vivir mucho y ser reciente son
 * dos cosas distintas, y hasta ahora la cookie solo sabía decir la primera.
 */
export const VISITOR_LOCATION_MAX_AGE = 60 * 60 * 24 * 365;

/** `lat,lng,ts`, con `ts` en milisegundos desde el epoch. */
export function serializeFix(fix: VisitorFix): string {
  const { latitude, longitude } = fix.coordinates;
  const stamp = fix.fixedAt ? `,${fix.fixedAt.getTime()}` : "";

  return `${latitude},${longitude}${stamp}`;
}

/**
 * Una cookie la escribe cualquiera: lo que venga se valida antes de creerle.
 *
 * El tercer campo es opcional **a propósito y para siempre**. Las cookies del formato anterior se
 * escribieron con un año de vida y no hay forma de alcanzarlas para migrarlas: hay navegadores
 * reales con una puesta ayer que solo trae dos campos. Se leen igual que antes, con `fixedAt` en
 * `null`, y `null` ya significa "vieja" en `isStale`, que es exactamente lo que son.
 */
export function parseFix(raw: string | null | undefined): VisitorFix | null {
  if (!raw) return null;

  const [latitude, longitude, stamp] = raw.split(",");
  const coordinates = {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  if (!areValidCoordinates(coordinates)) return null;

  return { coordinates, fixedAt: parseStamp(stamp) };
}

/** Las coordenadas a secas, para quien no necesita saber de cuándo son. */
export function parseCoordinates(
  raw: string | null | undefined,
): Coordinates | null {
  return parseFix(raw)?.coordinates ?? null;
}

/* Una fecha ilegible se descarta sin arrastrar las coordenadas: el dato bueno sigue sirviendo, y
   quedarse sin fecha solo significa volver a preguntar antes. */
function parseStamp(raw: string | undefined): Date | null {
  if (!raw) return null;

  const milliseconds = Number(raw);

  return Number.isFinite(milliseconds) && milliseconds > 0
    ? new Date(milliseconds)
    : null;
}
