import { getTranslations } from "next-intl/server";
import {
  MODERATION_REASONS,
  type ModerationStatus,
} from "~/domain/entities/post/moderation";
import { decideModeration } from "../../admin/moderacion/actions";

/** Las claves del catálogo para cada motivo, igual que en el panel y en el aviso. */
const REASON_KEYS = {
  off_topic: "reasonOffTopic",
  health_claim: "reasonHealthClaim",
  spam: "reasonSpam",
  offensive: "reasonOffensive",
  restricted_product: "reasonRestrictedProduct",
} as const;

type Props = {
  postId: string;
  status: ModerationStatus;
  /** Solo se pinta para quien puede decidir. La página ya lo resolvió con `isAdmin`. */
  isAdmin: boolean;
};

/**
 * El interruptor, donde de verdad se usa: encima de la publicación que se está mirando.
 *
 * Vive aquí y no solo en `/admin/moderacion` porque el panel es una **bandeja de revisión** —lista
 * lo que ya no está publicado— y con él solo, nada publicado se podía bajar nunca. El recorrido
 * real es al revés: el admin navega el sitio, se topa con algo que no cumple, y lo baja sin salir
 * de ahí. El panel es después: lo que se bajó, para restituirlo.
 */
export default async function ModerationControls({
  postId,
  status,
  isAdmin,
}: Props) {
  if (!isAdmin) return null;

  const t = await getTranslations("admin");
  const tModeration = await getTranslations("moderation");

  if (status !== "published") {
    return (
      <form
        action={decideModeration}
        className="w-full mb-4 flex items-center gap-2"
      >
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="action" value="approve" />
        <button
          type="submit"
          data-testid="moderation-approve"
          className="text-sm underline text-pw-green hover:text-highlight"
        >
          {t("moderationApprove")}
        </button>
      </form>
    );
  }

  return (
    <form
      action={decideModeration}
      className="w-full mb-4 flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="action" value="reject" />
      <select
        name="reason"
        required
        defaultValue=""
        aria-label={t("moderationColumnReason")}
        data-testid="moderation-reason"
        className="text-sm border rounded px-1 py-0.5 bg-transparent"
      >
        <option value="" disabled>
          {t("moderationReasonPlaceholder")}
        </option>
        {MODERATION_REASONS.map((reason) => (
          <option key={reason} value={reason}>
            {tModeration(REASON_KEYS[reason])}
          </option>
        ))}
      </select>
      <button
        type="submit"
        data-testid="moderation-reject"
        className="text-sm underline text-pw-green hover:text-highlight"
      >
        {t("moderationReject")}
      </button>
    </form>
  );
}
