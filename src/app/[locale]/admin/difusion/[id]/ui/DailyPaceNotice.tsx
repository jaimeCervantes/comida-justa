import { getTranslations } from "next-intl/server";
import type { DailyPace, PauseStatus } from "~/domain/outreach/rhythm";
import { dailyPaceMessage, pauseMessage } from "../paceMessages";

const WARNING =
  "rounded-card border border-brand-clay-700 p-3 text-sm font-semibold text-brand-clay-700";

/**
 * El ritmo del día, arriba de la publicación: cuántas van contra el tope y, si se acaba de marcar
 * algo, cuánto conviene esperar antes de la siguiente.
 *
 * Los dos avisos dicen con todas sus letras por qué —muchas el mismo día, o en ráfaga, se parecen a
 * spam—, pero no quitan nada de la pantalla: avisan, no impiden.
 */
export default async function DailyPaceNotice({
  pace,
  pause,
}: {
  pace: DailyPace;
  pause: PauseStatus;
}) {
  const t = await getTranslations("outreach");
  const waitMessage = pauseMessage(t, pause);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <p
        data-testid="outreach-daily-pace"
        role="status"
        className={pace.reached ? WARNING : "text-sm text-text-support"}
      >
        {dailyPaceMessage(t, pace)}
      </p>

      {waitMessage ? (
        <p data-testid="outreach-pause" role="status" className={WARNING}>
          {waitMessage}
        </p>
      ) : null}
    </div>
  );
}
