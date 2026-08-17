"use client";

import { useFormatter, useTranslations } from "next-intl";
import { eventStateAt } from "~/domain/entities/post/event";
import { Badge } from "~/presentation/design_system/badges/Badge";

/** Cada estado dice lo suyo. Cerrado: un estado nuevo obliga a decidir cómo se llama. */
const STATE_KEY = {
  proximo: "eventUpcoming",
  en_curso: "eventOngoing",
  pasado: "eventPast",
} as const;

/**
 * Lo próximo lleva el verde de marca; lo que está ocurriendo el naranja, que lo distingue de un
 * vistazo —es la diferencia entre "apúntate" y "corre, que ya empezó"—; lo que pasó se apaga y deja
 * de competir por la atención, igual que hace `SoldOutBadge` con lo agotado.
 */
const STATE_TONE = {
  proximo: "brand",
  en_curso: "accent",
  pasado: "neutral",
} as const;

type Props = {
  kind?: string | null;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
};

/**
 * Cuándo ocurre un evento, y en qué momento de su vida está.
 *
 * **El estado no viene de la base, se deriva del reloj** (`eventStateAt`): que la rodada del sábado
 * deje de anunciarse el domingo no depende de que nadie apague nada. Por eso este componente es de
 * cliente — el reloj del servidor congelaría el estado en el momento de renderizar, y una página
 * cacheada seguiría diciendo "próximo" un día después.
 *
 * No pinta nada en lo que no es un evento: la regla de cuándo aplica vive en el dominio, igual que
 * en `SoldOutBadge`.
 */
export default function EventDate({ kind, startsAt, endsAt }: Props) {
  const t = useTranslations("post");
  const format = useFormatter();

  const state = eventStateAt({ kind, startsAt, endsAt });

  if (!state || !startsAt) return null;

  const starts = startsAt instanceof Date ? startsAt : new Date(startsAt);

  return (
    <span
      className="flex flex-wrap items-center gap-2"
      data-testid="event-date"
      data-state={state}
    >
      <time dateTime={starts.toISOString()} className="text-sm">
        {format.dateTime(starts, {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </time>
      <Badge tone={STATE_TONE[state]} data-testid="event-state">
        {t(STATE_KEY[state])}
      </Badge>
    </span>
  );
}
