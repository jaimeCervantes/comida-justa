import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";

export default function HomePracticePulse({
  weeklyPractitioners,
}: {
  weeklyPractitioners: number;
}): React.ReactNode {
  const t = useTranslations("home.practicePulse");
  const hasActivity = weeklyPractitioners > 0;

  return (
    <aside
      data-testid="home-practice-pulse"
      aria-label={t("label")}
      className="border-y border-separator bg-surface-elevation-1 px-4 py-3 sm:px-5"
    >
      <Link
        href={PILLARS_OVERVIEW_HREF}
        className="focus-ring flex flex-wrap items-center justify-between gap-2 rounded-control text-sm"
      >
        <span className="font-semibold text-text-strong">
          {hasActivity
            ? t("active", { count: weeklyPractitioners })
            : t("empty")}
        </span>
        <span className="font-bold text-highlight underline underline-offset-4">
          {t("cta")}
        </span>
      </Link>
    </aside>
  );
}
