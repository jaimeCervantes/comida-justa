import type { getTranslations } from "next-intl/server";
import type { OutreachChannelFormat } from "~/domain/outreach/channelFormats";
import { CHANNEL_FORMAT_LABELS } from "./formatLabels";

type Translate = Awaited<ReturnType<typeof getTranslations<"outreach">>>;

/** «Compraventa · cada 7 días»: lo que hace falta saber de un grupo de un vistazo. */
export function channelSummary(
  t: Translate,
  channel: { format: OutreachChannelFormat; minDaysBetween: number },
): string {
  return t("channelSummary", {
    format: t(CHANNEL_FORMAT_LABELS[channel.format]),
    days: channel.minDaysBetween,
  });
}
