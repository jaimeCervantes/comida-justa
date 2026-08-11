import { getTranslations } from "next-intl/server";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";

export default async function CommunityHabitGarden({
  garden,
}: {
  garden: CommunityGarden;
}): Promise<React.ReactNode> {
  const t = await getTranslations("habitCommunity");
  const plots = [
    { key: "sleep", count: garden.sleep, color: "bg-pillar-sleep-solid" },
    {
      key: "nutrition",
      count: garden.nutrition,
      color: "bg-pillar-nutrition-solid",
    },
    {
      key: "movement",
      count: garden.movement,
      color: "bg-pillar-movement-solid",
    },
    {
      key: "mind",
      count: garden.mind,
      color: "bg-pillar-mind-spirit-solid",
    },
  ] as const;

  return (
    <section
      data-testid="community-habit-garden"
      className="mt-6 rounded-3xl border border-separator bg-surface-elevation-1 p-6 sm:p-8"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pw-green">
        {t("eyebrow")}
      </p>
      <h2 className="mt-1 text-2xl font-black text-text-strong">
        {t("title")}
      </h2>
      <p className="mt-2 max-w-3xl text-body">
        {t("body", { total: garden.total })}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {plots.map((plot) => (
          <div
            key={plot.key}
            data-pillar={plot.key}
            className="rounded-2xl border border-separator bg-surface-base p-4"
          >
            <span
              aria-hidden="true"
              className={`block h-2 rounded-full ${plot.color}`}
            />
            <strong className="mt-3 block text-2xl text-text-strong">
              {plot.count}
            </strong>
            <span className="text-sm text-body">{t(plot.key)}</span>
          </div>
        ))}
      </div>
      <p className="mt-5 text-sm text-body">{t("privacy")}</p>
      <p className="mt-2 rounded-xl bg-surface-elevation-2 p-3 text-sm text-body">
        {t("groupsUnavailable")}
      </p>
    </section>
  );
}
