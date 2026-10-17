import { useTranslations } from "next-intl";
import type { ChannelTurn } from "~/domain/outreach/rhythm";
import type { OutreachChannel } from "~/use_cases/outreach/ports/IOutreachChannelRepository";
import TurnBadge from "./TurnBadge";

/** Un grupo para abrir: su turno y, en compraventa, el pan que toca hoy ahí. */
export interface ChannelLinkItem {
  channel: OutreachChannel;
  turn: ChannelTurn;
  /** Solo en compraventa; nulo si no queda nada disponible que sugerir. */
  suggestionTitle?: string | null;
  /** Solo en grupos normales con varias versiones: la que le toca hoy, contando desde 1. */
  versionNumber?: number;
}

/**
 * Lo que hay que tener a la vista para publicar en un grupo sin que te saque: el enlace para
 * abrirlo, su turno, la versión o el pan que toca y sus reglas. El turno avisa y no impide nada.
 *
 * No lleva el nombre: quien la usa ya lo pinta, en la casilla de marcar o como título del renglón.
 */
export default function ChannelDetails({
  channel,
  turn,
  suggestionTitle,
  versionNumber,
}: ChannelLinkItem) {
  const t = useTranslations("outreach");

  return (
    <>
      <TurnBadge turn={turn} />
      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("openGroupLabel", { name: channel.name })}
        className="text-sm font-semibold text-highlight hover:underline"
      >
        {t("openGroup")}
      </a>
      {versionNumber ? (
        <span
          data-testid="outreach-channel-version"
          className="text-sm font-semibold"
        >
          {t("versionTurn", { n: versionNumber })}
        </span>
      ) : null}
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
    </>
  );
}
