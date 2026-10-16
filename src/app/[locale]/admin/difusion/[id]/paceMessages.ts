import type { getTranslations } from "next-intl/server";
import type { DailyPace, PauseStatus } from "~/domain/outreach/rhythm";

type Translate = Awaited<ReturnType<typeof getTranslations<"outreach">>>;

/** «Hoy llevas 3 de 10…», o el aviso de que ya se llegó al tope. */
export function dailyPaceMessage(t: Translate, pace: DailyPace): string {
  const values = { count: pace.count, limit: pace.limit };

  return pace.reached ? t("dailyPaceReached", values) : t("dailyPace", values);
}

/**
 * «Acabas de publicar…» o «Tu última publicación fue hace…», o nulo si no hay que esperar.
 *
 * Se separa del componente para comprobar las frases exactas contra la corrida de escritorio del
 * `.feature`, con el catálogo de verdad y sin pintar nada.
 */
export function pauseMessage(t: Translate, pause: PauseStatus): string | null {
  if (!pause.waiting) return null;

  return pause.minutesSince === 0
    ? t("pauseJustPosted", { left: pause.minutesLeft })
    : t("pauseWait", { since: pause.minutesSince, left: pause.minutesLeft });
}

/**
 * «Hoy les toca a 2 de 3 grupos.», o nulo sin grupos: entonces cada sección ya dice que no hay y
 * enlaza al alta, y un «0 de 0» arriba solo sería ruido.
 */
export function dueChannelsMessage(
  t: Translate,
  { due, total }: { due: number; total: number },
): string | null {
  if (total === 0) return null;

  return due === 0
    ? t("dueChannelsNone", { total })
    : t("dueChannels", { due, total });
}
