import { sendAnalyticsEvent } from "~/infra/analytics/sendAnalyticsEvent";

/**
 * Los eventos que mide una animación, escritos una sola vez.
 *
 * Responden a una pregunta concreta: ¿vale la pena construir la animación de cada pilar? Para eso
 * hace falta saber cuántos ven la invitación y la aceptan, cuántos le dan a reproducir, hasta qué
 * escena llegan y cuántos terminan pulsando «Elegir mi práctica».
 */
export const ANIMATION_EVENTS = [
  "animation_invite_shown",
  "animation_invite_accept",
  "animation_invite_dismiss",
  "animation_play",
  "animation_scene",
  "animation_complete",
  "animation_cta",
  "animation_sound",
] as const;

export type AnimationEventName = (typeof ANIMATION_EVENTS)[number];

/** Dónde se ve la animación: en su propia página, o abierta desde la invitación de otra. */
export type AnimationPlacement = "page" | "invite";

export function trackAnimation(
  animation: string,
  name: AnimationEventName,
  placement: AnimationPlacement,
  details: Record<string, string | number> = {},
): void {
  sendAnalyticsEvent(name, { animation, placement, ...details });
}
