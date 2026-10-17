import { getTranslations } from "next-intl/server";
import type { DailyPace, PauseStatus } from "~/domain/outreach/rhythm";
import {
  dailyPaceMessage,
  dueChannelsMessage,
  pauseMessage,
} from "../paceMessages";

const WARNING =
  "rounded-card border border-brand-clay-700 p-3 text-sm font-semibold text-brand-clay-700";

/**
 * Cómo va el día, arriba de la publicación: a cuántos grupos les toca, cuántas van contra el tope
 * y, si se acaba de marcar algo, cuánto conviene esperar antes de la siguiente.
 *
 * Lo primero se lee antes de bajar a los grupos: dice si hoy hay dónde publicar. Los avisos dicen
 * con todas sus letras por qué —muchas el mismo día, o en ráfaga, se parecen a spam—, pero no
 * quitan nada de la pantalla: avisan, no impiden.
 */
export default async function DailyPaceNotice({
  pace,
  pause,
  due,
}: {
  pace: DailyPace;
  pause: PauseStatus;
  due: { due: number; total: number };
}) {
  const t = await getTranslations("outreach");
  const waitMessage = pauseMessage(t, pause);
  const dueMessage = dueChannelsMessage(t, due);

  return (
    <div className="mb-4 flex flex-col gap-2">
      {dueMessage ? (
        <p
          data-testid="outreach-due-channels"
          role="status"
          className="text-body-lg font-semibold"
        >
          {dueMessage}
        </p>
      ) : null}

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
