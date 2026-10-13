import { getTranslations } from "next-intl/server";
import type { ChannelTurn } from "~/domain/outreach/rhythm";
import type { OutreachChannel } from "~/use_cases/outreach/ports/IOutreachChannelRepository";

/** Un grupo para abrir: su turno y, en compraventa, el pan que toca hoy ahí. */
export interface ChannelLinkItem {
  channel: OutreachChannel;
  turn: ChannelTurn;
  /** Solo en compraventa; nulo si no queda nada disponible que sugerir. */
  suggestionTitle?: string | null;
}

/**
 * Los grupos de un tipo, para abrirlos y publicar a mano. Cada uno lleva a la vista lo que hay que
 * respetar para que el grupo no saque a quien publica: su turno —«ya le toca» o cuántos días
 * faltan— y sus reglas. El turno avisa y no impide nada.
 */
export default async function ChannelLinks({
  items,
}: {
  items: readonly ChannelLinkItem[];
}) {
  const t = await getTranslations("outreach");

  return (
    <ul
      data-testid="outreach-channel-links"
      className="mb-4 flex flex-col gap-2"
    >
      {items.map(({ channel, turn, suggestionTitle }) => (
        <li
          key={channel.id}
          data-testid="outreach-channel-link"
          className="flex flex-wrap items-baseline gap-x-3"
        >
          <span className="font-semibold">{channel.name}</span>
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("openGroupLabel", { name: channel.name })}
            className="text-sm font-semibold text-highlight hover:underline"
          >
            {t("openGroup")}
          </a>
          <span
            data-testid="outreach-channel-turn"
            className={
              turn.due
                ? "text-sm font-semibold text-pw-green"
                : "text-sm text-text-support"
            }
          >
            {turn.due ? t("turnDue") : t("turnWait", { days: turn.inDays })}
          </span>
          {suggestionTitle ? (
            <span
              data-testid="outreach-channel-suggestion"
              className="w-full text-sm"
            >
              {t("suggestedToday", { title: suggestionTitle })}
            </span>
          ) : null}
          {channel.notes ? (
            <span className="w-full whitespace-pre-line text-sm text-text-support">
              {channel.notes}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
