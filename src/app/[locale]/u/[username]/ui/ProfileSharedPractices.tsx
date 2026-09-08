import { useLocale, useTranslations } from "next-intl";
import { PILLAR_KEYS, type PillarKey } from "~/domain/pillars/pillarKey";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";
import type { ProfileSharedPractice } from "../types";

export default function ProfileSharedPractices({
  practices,
}: {
  practices: readonly ProfileSharedPractice[];
}) {
  const t = useTranslations("profile");
  const pillarT = useTranslations("publicationPillars");
  const locale = useLocale();

  if (practices.length === 0) return null;

  const groups = groupByPrimaryPillar(practices);

  return (
    <section
      data-testid="public-shared-practices"
      className="mb-10 border-y border-border-subtle py-6"
      aria-labelledby="shared-practices-title"
    >
      <div className="mb-5 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wide text-text-support">
          {t("sharedPracticesEyebrow")}
        </p>
        <h2 id="shared-practices-title" className="mt-1 text-2xl font-bold">
          {t("sharedPracticesTitle")}
        </h2>
        <p className="mt-2 text-sm text-text-support">
          {t("sharedPracticesIntro")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(({ pillar, practices: pillarPractices }) => {
          const colors = pillarColorClasses[pillar];
          return (
            <section
              key={pillar}
              data-testid="public-shared-practices-pillar"
              data-pillar={pillar}
              className={`rounded-card border ${colors.border} ${colors.bg} p-4`}
              aria-labelledby={`shared-practices-${pillar}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3
                  id={`shared-practices-${pillar}`}
                  className={`text-lg font-bold ${colors.text}`}
                >
                  {pillarT(pillar)}
                </h3>
                <span className="rounded-full bg-surface-elevation-1 px-3 py-1 text-xs font-bold text-text-support">
                  {t("sharedPracticeCount", {
                    count: pillarPractices.length,
                  })}
                </span>
              </div>

              <ul className="space-y-3">
                {pillarPractices.map((practice) => (
                  <li
                    key={practice.key}
                    data-practice={practice.key}
                    className="rounded-card border border-border-subtle bg-surface-elevation-1 p-4"
                  >
                    <h4 className="font-bold text-text-main">
                      {practice.title}
                    </h4>
                    <p className="mt-1 text-sm text-text-support">
                      {practice.summary}
                    </p>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      {practice.cue ? (
                        <div>
                          <dt className="font-bold text-text-main">
                            {t("sharedPracticeCueLabel")}
                          </dt>
                          <dd className="text-text-support">{practice.cue}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="font-bold text-text-main">
                          {t("sharedPracticeMinimumLabel")}
                        </dt>
                        <dd className="text-text-support">
                          {practice.minimum ?? t("sharedPracticeMinimumWhole")}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs font-bold text-text-support">
                      {t("sharedPracticeSince", {
                        date: formatStartedAt(practice.startedAt, locale),
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function groupByPrimaryPillar(
  practices: readonly ProfileSharedPractice[],
): Array<{ pillar: PillarKey; practices: readonly ProfileSharedPractice[] }> {
  const groups = new Map<PillarKey, ProfileSharedPractice[]>();
  for (const practice of practices) {
    const pillar = primaryPillarOf(practice);
    const group = groups.get(pillar);
    if (group) group.push(practice);
    else groups.set(pillar, [practice]);
  }

  return PILLAR_KEYS.flatMap((pillar) => {
    const pillarPractices = groups.get(pillar);
    return pillarPractices ? [{ pillar, practices: pillarPractices }] : [];
  });
}

function formatStartedAt(startedAt: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(startedAt);
}
