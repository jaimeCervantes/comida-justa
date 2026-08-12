import { useTranslations } from "next-intl";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import CommunityHabitGarden from "~/presentation/habits/CommunityHabitGarden";
import { getDeepHabitChallengeTheme } from "~/presentation/habits/deepHabitChallengeThemes";
import PillarHero from "~/presentation/habits/PillarHero";
import PublicHabitCelebrationList from "~/presentation/habits/PublicHabitCelebrationList";
import type { PublicFirstCycleCelebration } from "~/use_cases/habits/ports/AtomicSleepChallengeRepository";
import { setHabitCelebrationReaction } from "../../habitCommunityActions";
import { PILLARS, pillarColorClasses } from "./pilaresData";

export default function PilaresOverviewPage({
  celebrations,
  garden,
  viewerSignedIn,
}: {
  celebrations: PublicFirstCycleCelebration[];
  garden: CommunityGarden;
  viewerSignedIn: boolean;
}) {
  const t = useTranslations("pillarsOverview");
  const tPillars = useTranslations("pillars");
  const tPages = useTranslations("pillarPages");
  const habitT = useTranslations("atomicChallenges");

  return (
    <article>
      <section className="relative isolate overflow-hidden rounded-4xl border border-pillar-sleep-ink/20 bg-surface-base shadow-xl mb-10">
        <PillarHero
          level={2}
          eyebrow={t("heroEyebrow")}
          title={t.rich("heading", {
            brandName: PUBLIC_BRAND_NAME,
            brand: (chunks) => (
              <span className="">{chunks}</span>
            ),
          })}
          intro={t("intro")}
          identity={t("heroIdentity")}
          theme={getDeepHabitChallengeTheme("nutrition")}
          className="rounded-t-4xl"
        />

        <div className="grid gap-6 sm:grid-cols-2 px-6 py-8 sm:px-10 sm:py-10">
          {PILLARS.map((pillar) => {
            const c = pillarColorClasses[pillar.key];
            return (
              <Link
                key={pillar.slug}
                href={{
                  pathname: "/pilares/[[...slug]]",
                  params: { slug: [pillar.slug] },
                }}
                className={`focus-ring group block rounded-2xl border-2 ${c.border} ${c.bg} p-6 sm:p-8 transition-all duration-300 hover:shadow-lg ${c.hover}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${c.badge} text-white text-sm font-bold shrink-0`}
                  >
                    {pillar.number}
                  </span>
                  <h2
                    className={`text-xl sm:text-2xl font-bold ${c.text} group-hover:underline group-hover:underline-offset-4`}
                  >
                    {tPillars(`${pillar.key}.title`)}
                  </h2>
                </div>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-3">
                  {tPages(`${pillar.key}.subtitle`)}
                </p>

                <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mb-4">
                  {tPillars(`${pillar.key}.cardDescription`)}
                </p>

                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${c.text}`}
                >
                  {t("readMore")}
                  <span
                    aria-hidden="true"
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="px-6 sm:px-10 pb-8 sm:pb-10 space-y-10">
          <CommunityHabitGarden garden={garden} />
          <PublicHabitCelebrationList
            title={habitT("experienceCommon.communityCelebrationsTitle")}
            celebrations={celebrations}
            viewerSignedIn={viewerSignedIn}
            reactionAction={setHabitCelebrationReaction}
          />
        </div>
      </section>

      <section className="mt-16 text-center">
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
            {t("whyHeading")}
          </h2>
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            {t("whyBody")}
          </p>
        </div>
      </section>
    </article>
  );
}
