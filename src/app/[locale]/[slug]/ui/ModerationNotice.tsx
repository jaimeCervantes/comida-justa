import { getTranslations } from "next-intl/server";
import {
  isModerationReason,
  type ModerationStatus,
} from "~/domain/entities/post/moderation";
import { Alert } from "~/presentation/design_system/feedback/Alert";

/** La clave del catálogo para cada motivo. Cerrada: un motivo desconocido no pinta nada. */
const REASON_KEYS = {
  off_topic: "reasonOffTopic",
  health_claim: "reasonHealthClaim",
  spam: "reasonSpam",
  offensive: "reasonOffensive",
  restricted_product: "reasonRestrictedProduct",
} as const;

type Props = {
  status: ModerationStatus;
  reason: string | null | undefined;
};

/**
 * El aviso que solo ve el autor (y el admin) de una publicación que no está publicada.
 *
 * Es el **único mensajero** que tiene el sitio: no hay correo ni notificaciones, así que si esto no
 * lo dijera, a nadie le constaría nunca que se le retiró algo.
 *
 * El texto sale entero del catálogo, elegido por el código a partir de un motivo de lista cerrada.
 * Nunca se pinta prosa que venga de la base: desde el slice 2 esa columna la escribe un
 * clasificador, y lo que un modelo redacta a partir del contenido de un desconocido no puede
 * acabar como texto de la interfaz.
 */
export default async function ModerationNotice({ status, reason }: Props) {
  if (status === "published") return null;

  const t = await getTranslations("moderation");
  const rejected = status === "rejected";

  return (
    <Alert
      tone={rejected ? "error" : "warning"}
      label={t(rejected ? "rejectedLabel" : "inReviewLabel")}
      className="w-full mb-4"
      data-testid="moderation-notice"
      data-status={status}
    >
      {t(rejected ? "rejectedBody" : "inReviewBody")}
      {isModerationReason(reason) ? ` ${t(REASON_KEYS[reason])}` : null}
    </Alert>
  );
}
