import { getTranslations } from "next-intl/server";
import type { OutreachChannel } from "~/use_cases/outreach/ports/IOutreachChannelRepository";

/**
 * Los grupos de un tipo, para abrirlos y publicar a mano. Cada uno lleva sus reglas a la vista: es
 * lo que hay que respetar para que el grupo no saque a quien publica.
 */
export default async function ChannelLinks({
  channels,
}: {
  channels: readonly OutreachChannel[];
}) {
  const t = await getTranslations("outreach");

  return (
    <ul
      data-testid="outreach-channel-links"
      className="mb-4 flex flex-col gap-2"
    >
      {channels.map((channel) => (
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
