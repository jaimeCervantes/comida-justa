/**
 * Cuándo ocurre una publicación, y en qué momento de su vida está.
 *
 * Espeja `posts.starts_at` / `posts.ends_at` (migración `0042_2026_08_16`). Ver
 * `docs/features/wellbeing/013-2026-08-16-cuatro-pilares-vivos.md`.
 */

import { EVENT_KIND } from "./kind";

export const EVENT_STATES = ["proximo", "en_curso", "pasado"] as const;

export type EventState = (typeof EVENT_STATES)[number];

export type EventDates = {
  /** Cuándo empieza. Nula en todo lo que no es un evento. */
  startsAt?: Date | string | null;
  /** Cuándo termina. Nula también en un evento que no lo declara. */
  endsAt?: Date | string | null;
};

type EventFields = EventDates & { kind?: string | null };

/** Una fecha que vino de la base puede llegar como texto; una rota no cuenta como fecha. */
function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Solo un evento ocurre en un momento. En lo demás, la fecha no significa nada. */
export function isEvent(post: { kind?: string | null }): boolean {
  return post.kind === EVENT_KIND;
}

/**
 * ¿Cuándo termina de verdad?
 *
 * Sin `ends_at`, un evento caduca en su hora de inicio. Se prefirió eso a inventarle una duración
 * por omisión, que sería adivinar cuánto dura una cosa que no sabemos qué es.
 */
function closesAt(dates: EventDates): Date | null {
  return toDate(dates.endsAt) ?? toDate(dates.startsAt);
}

/**
 * En qué momento de su vida está el evento **según el reloj**.
 *
 * Es la regla que más se puede diseñar mal, y por eso se deriva en vez de declararse: que la rodada
 * del sábado deje de anunciarse el domingo no lo decide nadie apagando una bandera, y una bandera
 * exigiría que algo o alguien la apagara a tiempo.
 *
 * Son **tres** estados y no dos porque una rodada de 6:00 a 8:00 no está "pasada" a las 7:00 — está
 * ocurriendo, que es justo cuando alguien mira el móvil para ver si todavía llega.
 *
 * Devuelve `null` cuando no hay evento del que hablar: sin `kind = evento` o sin fecha, no hay
 * estado, y eso es distinto de "ya pasó".
 */
export function eventStateAt(
  post: EventFields,
  now: Date = new Date(),
): EventState | null {
  if (!isEvent(post)) return null;

  const starts = toDate(post.startsAt);
  if (!starts) return null;

  if (now < starts) return "proximo";

  const closes = closesAt(post);
  // `closes` no puede ser nulo aquí: si hay `starts`, cae a él.
  return closes && now <= closes ? "en_curso" : "pasado";
}

/**
 * ¿Se anuncia como algo a lo que todavía se puede ir?
 *
 * Lo que ya pasó **no desaparece** —es historia, y suele ser la que tiene las fotos—: lo que deja de
 * hacer es presentarse como próximo.
 */
export function isUpcoming(post: EventFields, now: Date = new Date()): boolean {
  const state = eventStateAt(post, now);

  return state === "proximo" || state === "en_curso";
}

/** Ya ocurrió y se acabó. Falso en lo que no es un evento: un producto no "pasa". */
export function hasPassed(post: EventFields, now: Date = new Date()): boolean {
  return eventStateAt(post, now) === "pasado";
}
