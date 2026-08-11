import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import Avatar from "~/presentation/user/Avatar/Avatar";
import type { PublicFirstCycleCelebration } from "~/use_cases/habits/ports/AtomicSleepChallengeRepository";
import { getHabitPublicTheme } from "./habitPublicThemes";

export default async function PublicHabitCelebrationCard({
  celebration,
  viewerSignedIn = false,
  reactionAction,
}: {
  celebration: PublicFirstCycleCelebration;
  viewerSignedIn?: boolean;
  reactionAction?: (formData: FormData) => Promise<void>;
}): Promise<React.ReactNode> {
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
        eyebrow: habitT("nutritionExperience.publicCardEyebrow"),
        title: final
          ? habitT("nutritionExperience.publicFinalCardTitle", { name })
          : habitT("nutritionExperience.publicCardTitle", { name }),
        body: final
          ? habitT("nutritionExperience.publicFinalCardBody")
          : habitT("nutritionExperience.publicCardBody"),
        link: habitT("nutritionExperience.publicLink"),
        href: "/habitos/alimentacion" as const,
      }
    : movement
      ? {
          eyebrow: habitT("movementExperience.publicCardEyebrow"),
          title: final
            ? habitT("movementExperience.publicFinalCardTitle", { name })
            : habitT("movementExperience.publicCardTitle", { name }),
          body: final
            ? habitT("movementExperience.publicFinalCardBody")
            : habitT("movementExperience.publicCardBody"),
          link: habitT("movementExperience.publicLink"),
          href: "/habitos/movimiento" as const,
        }
      : mind
        ? {
            eyebrow: habitT("mindExperience.publicCardEyebrow"),
            title: final
              ? habitT("mindExperience.publicFinalCardTitle", { name })
              : habitT("mindExperience.publicCardTitle", { name }),
            body: final
              ? habitT("mindExperience.publicFinalCardBody")
              : habitT("mindExperience.publicCardBody"),
            link: habitT("mindExperience.publicLink"),
            href: "/habitos/mente-espiritu" as const,
          }
        : {
            eyebrow: t("communityCardEyebrow"),
            title: final
              ? t("communityFinalCardTitle", { name })
              : t("communityCardTitle", { name }),
            body: final ? t("communityFinalCardBody") : t("communityCardBody"),
            link: t("communityLink"),
            href: "/habitos/sueno" as const,
          };
  const theme = getHabitPublicTheme(
    nutrition ? "nutrition" : movement ? "movement" : mind ? "mind" : "sleep",
  );

  return (
    <article
      data-testid="public-habit-celebration"
      data-pillar={theme.pillar}
      className={`relative mt-6 overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 ${theme.article}`}
    >
      <div
        aria-hidden="true"
        className="absolute -right-8 -top-10 text-[9rem] leading-none opacity-10"
      >
        {theme.symbol}
      </div>
      <div className="relative flex items-start gap-4">
        <div className={`rounded-full p-1 ring-4 ${theme.soft}`}>
          <Avatar user={{ name, image: celebration.image }} />
        </div>
        <div className="min-w-0">
          <p
            className={`mb-1 text-xs font-bold uppercase tracking-[0.18em] ${theme.ink}`}
          >
            {copy.eyebrow}
          </p>
          <h2 className="text-xl font-extrabold text-text-strong sm:text-2xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-body">{copy.body}</p>
          <Link
            href={copy.href}
            className={`focus-ring mt-4 inline-flex rounded-lg font-semibold underline underline-offset-4 ${theme.ink}`}
          >
            {copy.link} →
          </Link>
          <div className="mt-4 flex items-center gap-3">
            {viewerSignedIn && reactionAction ? (
              <form action={reactionAction}>
                <input
                  type="hidden"
                  name="celebrationId"
                  value={celebration.id}
                />
                <input
                  type="hidden"
                  name="intent"
                  value={celebration.viewerReacted ? "withdraw" : "celebrate"}
                />
                <button
                  type="submit"
                  className={`focus-ring rounded-full border bg-surface-base px-4 py-2 text-sm font-bold ${theme.border} ${theme.ink}`}
                >
                  {celebration.viewerReacted
                    ? habitT("experienceCommon.reactionWithdraw")
                    : habitT("experienceCommon.reactionCelebrate")}
                </button>
              </form>
            ) : (
              <Link
                href={{ pathname: "/auth/signin", query: { callbackUrl: "/" } }}
                className={`focus-ring rounded-full font-semibold underline ${theme.ink}`}
              >
                {habitT("experienceCommon.reactionSignIn")}
              </Link>
            )}
            <span className="text-sm text-body">
              {habitT("experienceCommon.reactionCount", {
                count: celebration.reactionCount,
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
