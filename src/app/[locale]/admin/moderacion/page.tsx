import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MODERATION_REASONS } from "~/domain/entities/post/moderation";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { createModeratePostUseCase } from "~/infra/dataAccess/moderatePost/factory";
import ModerationQueue, { type QueueLabels } from "./ui/ModerationQueue";

/** Las claves de motivo viven en el namespace `moderation`, junto al aviso que ve el autor. */
const REASON_KEYS = {
  off_topic: "reasonOffTopic",
  health_claim: "reasonHealthClaim",
  spam: "reasonSpam",
  offensive: "reasonOffensive",
  restricted_product: "reasonRestrictedProduct",
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");

  return {
    title: t("moderationMetaTitle", { brand: PUBLIC_BRAND_NAME }),
    description: t("moderationMetaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function ModeracionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(resolveLocale(locale));
  const t = await getTranslations("admin");
  const tModeration = await getTranslations("moderation");

  const session = await auth();

  // 404 en vez de 403: una página interna no tiene por qué revelar que existe.
  if (!isAdmin(session?.user?.email)) {
    notFound();
  }

  const posts = await createModeratePostUseCase().pendingReview();

  const labels: QueueLabels = {
    empty: t("moderationEmpty"),
    columnPost: t("moderationColumnPost"),
    columnAuthor: t("moderationColumnAuthor"),
    columnStatus: t("moderationColumnStatus"),
    columnReason: t("moderationColumnReason"),
    columnDate: t("moderationColumnDate"),
    approve: t("moderationApprove"),
    reject: t("moderationReject"),
    reasonPlaceholder: t("moderationReasonPlaceholder"),
    statusInReview: t("moderationStatusInReview"),
    statusRejected: t("moderationStatusRejected"),
    statusPublished: t("moderationStatusPublished"),
    reportCount: (count: number) => tModeration("reportCount", { count }),
    reasons: Object.fromEntries(
      MODERATION_REASONS.map((reason) => [
        reason,
        tModeration(REASON_KEYS[reason]),
      ]),
    ),
  };

  return (
    <main>
      <h1 className="text-xl font-bold mb-2">{t("moderationHeading")}</h1>

      <p className="mb-6 text-text-support">{t("moderationIntro")}</p>

      <ModerationQueue posts={posts} labels={labels} />
    </main>
  );
}
