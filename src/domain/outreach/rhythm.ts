import { daysSincePublished } from "./lastPublished";

const MINUTE_MS = 60_000;

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

/**
 * A cuántos grupos les toca hoy, de cuántos: el resumen que se lee antes de bajar a los grupos.
 * Recibe los turnos de los dos tipos juntos, porque la pregunta es «¿dónde puedo publicar hoy?».
 */
export function dueChannels(turns: readonly ChannelTurn[]): {
  due: number;
  total: number;
} {
  return {
    due: turns.filter((turn) => turn.due).length,
    total: turns.length,
  };
}

/** Cuántas van hoy, contra el tope. */
export interface DailyPace {
  count: number;
  limit: number;
  reached: boolean;
}

/** El tope sale de la configuración (`OutreachRhythm.dailyLimit`): avisa al llegar, no impide. */
export function dailyPace(count: number, limit: number): DailyPace {
  return { count, limit, reached: count >= limit };
}

/** Si conviene esperar antes de la siguiente publicación, y cuánto. */
export type PauseStatus =
  | { waiting: false }
  | { waiting: true; minutesSince: number; minutesLeft: number };

/**
 * La pausa entre publicaciones, contada desde lo último que se marcó **en cualquier grupo**.
 *
 * El tope del día no dice nada si las primeras ocho van en cinco minutos, y publicar en ráfaga es
 * otra de las cosas que Facebook toma por spam. Se cuenta en minutos enteros ya transcurridos; un
 * reloj un poco desfasado entre la base y el servidor —la hora de lo marcado la pone la base— no
 * puede dar minutos negativos. 0 minutos de pausa la apaga. Como el tope, avisa y no impide.
 */
export function pauseStatus(
  lastPublishedAt: Date | null,
  now: Date,
  pauseMinutes: number,
): PauseStatus {
  if (pauseMinutes <= 0 || !lastPublishedAt) return { waiting: false };

  const minutesSince = Math.max(
    0,
    Math.floor((now.getTime() - lastPublishedAt.getTime()) / MINUTE_MS),
  );

  if (minutesSince >= pauseMinutes) return { waiting: false };

  return {
    waiting: true,
    minutesSince,
    minutesLeft: pauseMinutes - minutesSince,
  };
}
