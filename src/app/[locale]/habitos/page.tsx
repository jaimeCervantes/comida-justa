import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CURATED_CHALLENGES } from "~/domain/habits/curatedChallenges";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createCuratedHabitRepository } from "~/infra/dataAccess/habits/PostgresCuratedHabitRepository";
import { createHabitLeagueRepository } from "~/infra/dataAccess/habits/PostgresHabitLeagueRepository";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import CuratedHabitUseCase from "~/use_cases/habits/curatedHabitUseCase";
import HabitLeagueUseCase from "~/use_cases/habits/habitLeagueUseCase";
import { setHabitLeagueOptIn } from "./leagueActions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "atomicChallenges" });
  return {
    title: t("indexTitle"),
    description: t("indexIntro"),
    alternates: localizedAlternates("/habitos", locale),
  };
}

export default async function AtomicChallengesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactNode> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("atomicChallenges");
  const userId = await readViewerId();
  const active = userId
    ? await new CuratedHabitUseCase(createCuratedHabitRepository()).getActive(
        userId,
      )
    : null;
  const league = await new HabitLeagueUseCase(
    createHabitLeagueRepository(),
  ).getState(userId);

  return (
    <main className="mx-auto max-w-5xl pb-16">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-pw-green">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-4xl font-black text-text-strong">
          {t("indexTitle")}
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-body">{t("indexIntro")}</p>
        <p className="mt-3 font-semibold text-text-strong">
          {active
            ? t("activeSummary", {
                challenge: titleForKey(t, active.challengeKey),
              })
            : t("noActiveSummary")}
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CURATED_CHALLENGES.map((challenge) => (
          <Link
            key={challenge.challengeKey}
            href={pathForChallenge(challenge.slug)}
            className="focus-ring rounded-3xl border border-separator bg-surface-elevation-1 p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-pw-green">
              {pillarLabel(t, challenge.pillar)}
            </span>
            <h2 className="mt-2 text-2xl font-black text-text-strong">
              {titleForKey(t, challenge.challengeKey)}
            </h2>
            <p className="mt-2 text-body">
              {minimumForPillar(t, challenge.pillar)}
            </p>
            {active?.challengeKey === challenge.challengeKey && (
              <strong className="mt-4 block text-pw-green">
                {t("activePractice")}
              </strong>
            )}
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-3xl border border-feedback-warning/40 bg-feedback-warning/10 p-6">
        <h2 className="text-xl font-black text-text-strong">
          {t("reminderTitle")}
        </h2>
        <p className="mt-2 text-body">{t("reminderUnavailable")}</p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-lg border px-4 py-2 font-bold opacity-60"
        >
          {t("reminderDisabled")}
        </button>
      </section>

      <section
        data-testid="habit-league"
        className="mt-8 rounded-3xl border border-separator bg-surface-elevation-1 p-6 sm:p-8"
      >
        <h2 className="text-2xl font-black text-text-strong">
          {t("league.title")}
        </h2>
        <p className="mt-2 text-body">
          {t("league.threshold", {
            active: league.activeOptIns,
            threshold: league.threshold,
          })}
        </p>
        {!league.eligible ? (
          <p className="mt-3 font-semibold text-text-strong">
            {t("league.conditioned")}
          </p>
        ) : (
          <ol className="mt-5 space-y-2" aria-label={t("league.rankingLabel")}>
            {league.ranking.map((entry) => (
              <li
                key={entry.alias}
                className="flex justify-between rounded-xl border p-3"
              >
                <span>
                  {t("league.rank", { rank: entry.rank, alias: entry.alias })}
                </span>
                <strong>{t("league.points", { points: entry.score })}</strong>
              </li>
            ))}
          </ol>
        )}
        {userId && !league.viewerAlias && (
          <p className="mt-4 text-sm text-body">
            {t("league.aliasRequired")}{" "}
            <Link href="/cuenta">{t("league.claimAlias")}</Link>
          </p>
        )}
        {userId && league.viewerAlias && (
          <form action={setHabitLeagueOptIn} className="mt-4">
            <input
              type="hidden"
              name="intent"
              value={league.viewerOptedIn ? "leave" : "join"}
            />
            <button
              type="submit"
              className="focus-ring rounded-lg border px-4 py-2 font-bold"
            >
              {league.viewerOptedIn ? t("league.leave") : t("league.join")}
            </button>
          </form>
        )}
        <p className="mt-4 text-xs text-body">{t("league.ethics")}</p>
      </section>
    </main>
  );
}

type Translator = Awaited<ReturnType<typeof getTranslations>>;

function titleForKey(t: Translator, challengeKey: string): string {
  if (challengeKey === "sleep-evening-to-morning-v1") return t("sleep.title");
  if (challengeKey === "nutrition-one-plant-v1") return t("nutrition.title");
  if (challengeKey === "movement-two-minutes-v1") return t("movement.title");
  return t("mind.title");
}

function minimumForPillar(
  t: Translator,
  pillar: "sleep" | "nutrition" | "movement" | "mind",
): string {
  if (pillar === "sleep") return t("sleep.minimum");
  if (pillar === "nutrition") return t("nutrition.minimum");
  if (pillar === "movement") return t("movement.minimum");
  return t("mind.minimum");
}

function pillarLabel(
  t: Translator,
  pillar: "sleep" | "nutrition" | "movement" | "mind",
): string {
  if (pillar === "sleep") return t("sleep.pillar");
  if (pillar === "nutrition") return t("nutrition.pillar");
  if (pillar === "movement") return t("movement.pillar");
  return t("mind.pillar");
}

function pathForChallenge(
  slug: "sueno" | "alimentacion" | "movimiento" | "mente-espiritu",
):
  | "/habitos/sueno"
  | "/habitos/alimentacion"
  | "/habitos/movimiento"
  | "/habitos/mente-espiritu" {
  if (slug === "sueno") return "/habitos/sueno";
  if (slug === "alimentacion") return "/habitos/alimentacion";
  if (slug === "movimiento") return "/habitos/movimiento";
  return "/habitos/mente-espiritu";
}
