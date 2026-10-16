import { useTranslations } from "next-intl";
import type { ChannelTurn } from "~/domain/outreach/rhythm";
import {
  Badge,
  type BadgeTone,
} from "~/presentation/design_system/badges/Badge";

/**
 * El turno de un grupo como insignia: verde de marca cuando ya le toca, neutra cuando todavía no.
 * Se distingue por el color y también por la frase, para quien no ve el color.
 */
export default function TurnBadge({ turn }: { turn: ChannelTurn }) {
  const t = useTranslations("outreach");
  const tone: BadgeTone = turn.due ? "brand" : "neutral";

  return (
    <Badge
      data-testid="outreach-channel-turn"
      data-tone={tone}
      tone={tone}
      emphasis={turn.due ? "strong" : "soft"}
    >
      {turn.due ? t("turnDue") : t("turnWait", { days: turn.inDays })}
    </Badge>
  );
}
