import { useTranslations } from "next-intl";
import PillarHero, {
  SLEEP_PILLAR_HERO_THEME,
} from "~/presentation/habits/PillarHero";
import type { AtomicSleepProgress } from "~/use_cases/habits/atomicSleepChallengeUseCase";
import SleepChallengePanel from "./SleepChallengePanel";

export default function SleepPracticeContent({
  initialProgress,
  signedIn,
  signInHref,
}: {
  initialProgress: AtomicSleepProgress | null;
  signedIn: boolean;
  signInHref: string;
}): React.ReactNode {
  const t = useTranslations("atomicSleepChallenge");

  return (
    <section
      id="practica"
      aria-labelledby="sleep-practice-title"
      className="relative isolate overflow-hidden rounded-[2rem] border border-pillar-sleep-ink/20 bg-surface-base shadow-xl"
    >
      <PillarHero
        level={2}
        id="sleep-practice-title"
        eyebrow={t("practiceEyebrow")}
        title={t("title")}
        intro={t("intro")}
        theme={SLEEP_PILLAR_HERO_THEME}
      />

      <div className="px-6 py-10 sm:px-10 sm:py-12">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-pillar-sleep-ink">
            {t("minimumHeading")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-body">
            {t("minimumBody")}
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <AnchorCard
            symbol="☾"
            title={t("nightHeading")}
            body={t("nightDescription")}
          />
          <AnchorCard
            symbol="☀"
            title={t("morningHeading")}
            body={t("morningDescription")}
          />
        </div>
        <SleepChallengePanel
          key={`${initialProgress?.level ?? "visitor"}-${initialProgress?.celebrationStatus ?? "private"}`}
          initialProgress={initialProgress}
          signedIn={signedIn}
          signInHref={signInHref}
        />

        <div className="mt-16 rounded-3xl bg-surface-elevation-2 p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-pillar-sleep-ink">
            {t("recommendedHeading")}
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-text-strong">
            {t("recommendedHeading")}
          </h2>
          <p className="mt-3 max-w-3xl text-body">{t("recommendedBody")}</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              t("eveningLight"),
              t("dinner"),
              t("clothes"),
              t("room"),
              t("movement"),
            ].map((step, index) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-separator bg-surface-base p-5"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-pillar-sleep-solid font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-body">{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 border-l-4 border-feedback-warning bg-feedback-warning/10 p-4 text-sm text-body">
            {t("safety")}
          </p>
        </div>
      </div>
    </section>
  );
}

function AnchorCard({
  symbol,
  title,
  body,
}: {
  symbol: string;
  title: string;
  body: string;
}): React.ReactNode {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-pillar-sleep-ink/25 bg-pillar-sleep-soft p-6 sm:p-8">
      <span
        aria-hidden="true"
        className="absolute -right-4 -top-8 text-8xl text-pillar-sleep-ink opacity-10"
      >
        {symbol}
      </span>
      <span className="text-4xl" aria-hidden="true">
        {symbol}
      </span>
      <h3 className="mt-4 text-2xl font-extrabold text-text-strong">{title}</h3>
      <p className="mt-2 text-body">{body}</p>
    </article>
  );
}
