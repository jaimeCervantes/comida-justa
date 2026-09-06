import { useTranslations } from "next-intl";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";
import type { WeeklyPillarPracticeProgress } from "~/use_cases/practices/practiceAdoptionUseCase";

export default function WeeklyPracticeProgress({
  progress,
  signedIn,
}: {
  progress: readonly WeeklyPillarPracticeProgress[];
  signedIn: boolean;
}): React.ReactNode {
  const t = useTranslations("atomicChallenges.weeklyDashboard");
  const tPillars = useTranslations("pillars");
  const completedToday = progress.filter(
    ({ countedToday }) => countedToday,
  ).length;

  return (
    <section
      data-testid="weekly-practice-progress"
      className="mt-8 rounded-panel border border-separator bg-surface-elevation-1 p-6 shadow-sm sm:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pw-green">
        {t("eyebrow")}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading level={2} tone="inherit" className="text-text-strong">
            {t("title")}
          </Heading>
          <p
            data-testid="weekly-practice-progress-summary"
            className="mt-2 text-2xl font-bold text-text-strong"
          >
            {t("todaySummary", {
              completed: completedToday,
              total: progress.length,
            })}
          </p>
        </div>
        <p className="max-w-xl text-sm text-body">
          {signedIn ? t("body") : t("signedOutBody")}
        </p>
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {progress.map((entry) => (
          <PillarProgressCard
            key={entry.pillar}
            entry={entry}
            label={tPillars(`${entry.pillar}.short`)}
            countedLabel={t("countedToday")}
            pendingLabel={t("pendingToday")}
            daysLabel={t("weeklyDays", { count: entry.completedDays })}
          />
        ))}
      </ol>
    </section>
  );
}

function PillarProgressCard({
  entry,
  label,
  countedLabel,
  pendingLabel,
  daysLabel,
}: {
  entry: WeeklyPillarPracticeProgress;
  label: string;
  countedLabel: string;
  pendingLabel: string;
  daysLabel: string;
}): React.ReactNode {
  const color = pillarColorClasses[entry.pillar as PillarKey];

  return (
    <li
      data-testid="weekly-pillar-progress"
      data-pillar={entry.pillar}
      data-counted-today={String(entry.countedToday)}
      className={`rounded-card border p-4 ${color.bg} ${color.border}`}
    >
      <span
        aria-hidden="true"
        className={`block h-1.5 rounded-full ${color.badge}`}
      />
      <p className={`mt-3 text-sm font-bold ${color.text}`}>{label}</p>
      <p className="mt-1 text-xl font-bold text-text-strong">{daysLabel}</p>
      <p className="mt-1 text-caption text-text-muted">
        {entry.countedToday ? countedLabel : pendingLabel}
      </p>
    </li>
  );
}
