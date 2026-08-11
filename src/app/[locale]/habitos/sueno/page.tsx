import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { SIGNIN_PATH } from "~/infra/constants";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import AtomicSleepChallengeUseCase from "~/use_cases/habits/atomicSleepChallengeUseCase";
import SleepChallengePanel from "./ui/SleepChallengePanel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({
    locale,
    namespace: "atomicSleepChallenge",
  });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates("/habitos/sueno", locale),
  };
}

export default async function AtomicSleepChallengePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactNode> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("atomicSleepChallenge");
  const userId = await readViewerId();
  const progress = userId
    ? await new AtomicSleepChallengeUseCase(
        createAtomicSleepChallengeRepository(),
      ).getProgress(userId)
    : null;
  const returnPath = getPathname({ locale, href: "/habitos/sueno" });
  const signInPath = getPathname({ locale, href: SIGNIN_PATH });
  const signInHref = `${signInPath}?callbackUrl=${encodeURIComponent(returnPath)}`;

  return (
    <main className="pb-16">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#17112f_0%,#35245f_48%,#e98a45_140%)] px-6 py-14 text-white shadow-xl sm:px-12 sm:py-20">
        <div className="absolute inset-0 -z-10 opacity-45 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,.2)_0_1px,transparent_1.5px),radial-gradient(circle_at_80%_45%,rgba(255,255,255,.18)_0_1px,transparent_1.5px)] [background-size:54px_54px,76px_76px]" />
        <div className="absolute -right-12 -top-20 -z-10 size-72 rounded-full bg-orange-300/20 blur-3xl" />
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-violet-200">
          {t("minimumHeading")}
        </p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-violet-100 sm:text-xl">
          {t("intro")}
        </p>
        <blockquote className="mt-8 max-w-2xl border-l-4 border-orange-300 pl-5 text-xl font-semibold italic text-white">
          “{t("identity")}”
        </blockquote>
      </header>

      <section className="mx-auto mt-12 max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-text-strong">
            {t("minimumHeading")}
          </h2>
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
          key={`${progress?.level ?? "visitor"}-${progress?.celebrationStatus ?? "private"}`}
          initialProgress={progress}
          signedIn={userId !== null}
          signInHref={signInHref}
        />
      </section>

      <section className="mx-auto mt-16 max-w-5xl rounded-3xl bg-surface-elevation-2 p-6 sm:p-10">
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
      </section>
    </main>
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
