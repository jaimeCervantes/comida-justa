import { daysSincePublished } from "./lastPublished";

/**
 * Cuántas publicaciones en grupos al día, antes de avisar.
 *
 * **No es una cifra de Facebook**: Meta no publica ningún límite, y lo que dispara su detección de
 * spam depende de la cuenta. Es un tope prudente para una cuenta personal que publica a mano, y vive
 * en un solo sitio para poder moverlo cuando la experiencia diga otra cosa. Avisa; no impide nada.
 */
export const DAILY_OUTREACH_LIMIT = 10;

/** Si a un grupo ya le toca recibir otra publicación tuya, o cuántos días faltan. */
export type ChannelTurn = { due: true } | { due: false; inDays: number };

/**
 * El turno de un grupo según cada cuántos días acepta una publicación de la misma persona.
 *
 * `lastPublishedAt` es lo último que se publicó **ahí, de cualquier texto**: la regla del grupo es
 * «una publicación tuya cada N días», no una por texto. 0 días es sin límite, y lo que nunca recibió
 * nada no tiene que esperar.
 */
export function channelTurn(
  minDaysBetween: number,
  lastPublishedAt: Date | null,
  now: Date,
  timeZone: string,
): ChannelTurn {
  if (minDaysBetween <= 0) return { due: true };

  const days = daysSincePublished(lastPublishedAt, now, timeZone);

  if (days === null || days >= minDaysBetween) return { due: true };

  return { due: false, inDays: minDaysBetween - days };
}

/**
 * El pan que toca hoy en un grupo de compraventa: el que lleva más tiempo sin publicarse ahí.
 *
 * Lo que nunca se publicó va primero, y entre iguales manda el orden de la publicación. Es lo que
 * reparte los panes entre días en vez de repetir siempre el mismo, que es justo lo que un grupo de
 * compraventa le reprocha a quien vende.
 */
export function suggestNextListing(
  postIdsInOrder: readonly string[],
  lastPublishedAt: (postId: string) => Date | null,
): string | null {
  let oldest: { postId: string; at: Date } | null = null;

  for (const postId of postIdsInOrder) {
    const at = lastPublishedAt(postId);

    if (at === null) return postId;
    if (!oldest || at < oldest.at) oldest = { postId, at };
  }

  return oldest?.postId ?? null;
}

/** Cuántas van hoy, contra el tope. */
export interface DailyPace {
  count: number;
  limit: number;
  reached: boolean;
}

export function dailyPace(
  count: number,
  limit: number = DAILY_OUTREACH_LIMIT,
): DailyPace {
  return { count, limit, reached: count >= limit };
}
