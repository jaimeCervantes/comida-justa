import { getTranslations } from "next-intl/server";
import type { DailyPace } from "~/domain/outreach/rhythm";

/**
 * Cuántas publicaciones van hoy en grupos, contra el tope. Al llegar a él lo dice con todas sus
 * letras —muchas el mismo día se parecen a spam—, pero no quita nada de la pantalla: avisa, no
 * impide.
 */
export default async function DailyPaceNotice({ pace }: { pace: DailyPace }) {
  const t = await getTranslations("outreach");
  const values = { count: pace.count, limit: pace.limit };

  return (
    <p
      data-testid="outreach-daily-pace"
      role="status"
      className={
        pace.reached
          ? "mb-4 rounded-card border border-brand-clay-700 p-3 text-sm font-semibold text-brand-clay-700"
          : "mb-4 text-sm text-text-support"
      }
    >
      {pace.reached ? t("dailyPaceReached", values) : t("dailyPace", values)}
    </p>
  );
}
