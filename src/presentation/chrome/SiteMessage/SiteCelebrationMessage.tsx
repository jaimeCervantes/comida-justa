import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import {
  CELEBRATION_DISMISSAL_COOKIE,
  isCelebrationDismissed,
} from "~/infra/habits/celebrationDismissalCookie";
import { readLatestPublicCelebration } from "~/infra/habits/readLatestPublicCelebration";
import { getHabitPublicTheme } from "~/presentation/habits/habitPublicThemes";
import { dismissSiteCelebration } from "./actions";

export default async function SiteCelebrationMessage(): Promise<React.ReactNode> {
  const celebration = await readLatestPublicCelebration();
  if (!celebration) return null;

  const dismissedId = (await cookies()).get(
    CELEBRATION_DISMISSAL_COOKIE,
  )?.value;
  if (isCelebrationDismissed(dismissedId, celebration.id)) return null;

  const t = await getTranslations("atomicSleepChallenge");
  const habitT = await getTranslations("atomicChallenges");
  const nutrition = celebration.challengeKey === "nutrition-one-plant-v1";
  const movement = celebration.challengeKey === "movement-two-minutes-v1";
  const mind = celebration.challengeKey === "mind-one-connection-v1";
  const name =
    celebration.displayName ??
    (nutrition || movement || mind
      ? habitT("experienceCommon.communityAnonymous")
      : t("communityAnonymous"));
  const final = celebration.milestone === "challenge_completed";
  const copy = nutrition
    ? {
        body: final
          ? habitT("nutritionExperience.siteMessageFinalBody", { name })
          : habitT("nutritionExperience.siteMessageBody", { name }),
        href: pillarHref("alimentacion"),
        link: habitT("nutritionExperience.publicLink"),
      }
    : movement
      ? {
          body: final
            ? habitT("movementExperience.siteMessageFinalBody", { name })
            : habitT("movementExperience.siteMessageBody", { name }),
          href: pillarHref("movimiento"),
          link: habitT("movementExperience.publicLink"),
        }
      : mind
        ? {
            body: final
              ? habitT("mindExperience.siteMessageFinalBody", { name })
              : habitT("mindExperience.siteMessageBody", { name }),
            href: pillarHref("mente-espiritu"),
            link: habitT("mindExperience.publicLink"),
          }
        : {
            body: final
              ? t("siteMessageFinalBody", { name })
              : t("siteMessageBody", { name }),
            href: pillarHref("sueno"),
            link: t("communityLink"),
          };
  const theme = getHabitPublicTheme(
    nutrition ? "nutrition" : movement ? "movement" : mind ? "mind" : "sleep",
  );

  return (
    <aside className={`border-b text-text-base ${theme.aside}`}>
      <div className="container-width flex items-center justify-between gap-4 py-3">
        <p className="m-0 text-sm sm:text-base">
          <strong>{habitT("experienceCommon.siteMessageLabel")}:</strong>{" "}
          {copy.body}{" "}
          <Link
            href={copy.href}
            className={`focus-ring rounded-sm font-semibold underline underline-offset-4 ${theme.ink}`}
          >
            {copy.link}
          </Link>
        </p>
        <form action={dismissSiteCelebration}>
          <input type="hidden" name="celebrationId" value={celebration.id} />
          <button
            type="submit"
            aria-label={habitT("experienceCommon.siteMessageClose")}
            title={habitT("experienceCommon.siteMessageClose")}
            className={`focus-ring grid size-8 shrink-0 place-items-center rounded-full border text-lg hover:bg-surface-elevation-2 ${theme.border}`}
          >
            <span aria-hidden="true">×</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
