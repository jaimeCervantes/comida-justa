import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  CURATED_CHALLENGES,
  type CuratedHabitPillar,
} from "~/domain/habits/curatedChallenges";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import { resolveLocale } from "~/i18n/routing";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createHabitLeagueRepository } from "~/infra/dataAccess/habits/PostgresHabitLeagueRepository";
import { PostgresPracticeAdoption } from "~/infra/dataAccess/practices/PostgresPracticeAdoption";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import { Heading } from "~/presentation/design_system/typography/Heading";
import HabitLeagueUseCase from "~/use_cases/habits/habitLeagueUseCase";
import PracticeAdoptionUseCase from "~/use_cases/practices/practiceAdoptionUseCase";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";
import AccountSection from "../cuenta/ui/AccountSection";
import { setHabitLeagueOptIn } from "./leagueActions";
import MyPractices from "./ui/MyPractices";

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
  const league = await new HabitLeagueUseCase(
    createHabitLeagueRepository(),
  ).getState(userId);
  /* Lo que esta persona lleva del catálogo. Se compone de dos lecturas memorizadas y no de una
     consulta nueva; sin sesión el conjunto viene vacío y la sección invita al catálogo en vez de
     desaparecer. */
  const adopted = await new PracticeAdoptionUseCase(
    new PostgresPracticeAdoption(),
  ).activeFor(userId);
  const myPractices = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).listAdopted(locale, adopted);

  /*
   * «Mis hábitos» es una entrada de `AccountNav`, y hasta aquí era un callejón sin salida: se
   * llegaba desde la cuenta y no había forma de volver. Con la sección puesta, la página se lee
   * como lo que el menú promete — una más de «lo mío»— sin dejar de ser pública: `AccountSection`
   * no monta el menú para quien no ha entrado, que es quien llega por un enlace compartido.
   */
  return (
    <AccountSection active="habits">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-pw-green">
          {t("eyebrow")}
        </p>
        <Heading level={1} size="display" className="mt-2">
          {t("indexTitle")}
        </Heading>
        <p className="mt-4 max-w-3xl text-lg text-body">{t("indexIntro")}</p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CURATED_CHALLENGES.map(({ challengeKey, pillar, slug }) => {
          const copy = pillarCopy(t, pillar);
          return (
            <Link
              key={challengeKey}
              href={pillarHref(slug)}
              className="focus-ring rounded-panel border border-separator bg-surface-elevation-1 p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-pw-green">
                {copy.pillar}
              </span>
              <Heading
                level={2}
                tone="inherit"
                className="mt-2 text-text-strong"
              >
                {copy.title}
              </Heading>
              <p className="mt-2 text-body">{copy.minimum}</p>
            </Link>
          );
        })}
      </div>

      <MyPractices practices={myPractices} />

      <section className="mt-8 rounded-panel border border-feedback-warning/40 bg-feedback-warning/10 p-6">
        <Heading
          level={2}
          size="sm"
          tone="inherit"
          className="text-text-strong"
        >
          {t("reminderTitle")}
        </Heading>
        <p className="mt-2 text-body">{t("reminderUnavailable")}</p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-control border px-4 py-2 font-bold opacity-60"
        >
          {t("reminderDisabled")}
        </button>
      </section>

      <section
        data-testid="habit-league"
        className="mt-8 rounded-panel border border-separator bg-surface-elevation-1 p-6 sm:p-8"
      >
        <Heading level={2} tone="inherit" className="text-text-strong">
          {t("league.title")}
        </Heading>
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
          /*
            Una lista **ordenada** y sin puesto escrito: el `<ol>` numera, y esa es toda la posición
            que hay. No hay corona, no hay «1er lugar» y no hay premio, porque un ganador semanal
            fabrica nueve perdedores por cada ganador y suele ganar quien tiene la vida menos
            caótica. Lo que sí se ve es el aporte de cada quien al mismo jardín.
          */
          <ol className="mt-5 space-y-2" aria-label={t("league.tableLabel")}>
            {league.contributors.map((entry) => (
              <li
                key={entry.alias}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-control border p-3"
              >
                <span>{t("league.contributor", { alias: entry.alias })}</span>
                <span className="flex items-baseline gap-3">
                  <strong>
                    {t("league.contributions", {
                      contributions: entry.contributions,
                    })}
                  </strong>
                  <span className="text-caption text-text-muted">
                    {t("league.sustainedWeeks", {
                      weeks: entry.sustainedWeeks,
                    })}
                  </span>
                </span>
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
              className="focus-ring rounded-control border px-4 py-2 font-bold"
            >
              {league.viewerOptedIn ? t("league.leave") : t("league.join")}
            </button>
          </form>
        )}
        <p className="mt-4 text-xs text-body">{t("league.ethics")}</p>
      </section>
    </AccountSection>
  );
}

type Translator = Awaited<
  ReturnType<typeof getTranslations<"atomicChallenges">>
>;

/**
 * Las tres frases de la tarjeta de un pilar. Eran tres funciones con la misma cadena de `if` —una
 * indexada además por la clave versionada del reto, que no es la del texto—, así que añadir un pilar
 * significaba acordarse de tres sitios. Las claves siguen escritas enteras: `AGENTS.md` no admite
 * componerlas en tiempo de ejecución, y así se encuentran buscando.
 */
function pillarCopy(
  t: Translator,
  pillar: CuratedHabitPillar,
): { minimum: string; pillar: string; title: string } {
  if (pillar === "sleep") {
    return {
      minimum: t("sleep.minimum"),
      pillar: t("sleep.pillar"),
      title: t("sleep.title"),
    };
  }
  if (pillar === "nutrition") {
    return {
      minimum: t("nutrition.minimum"),
      pillar: t("nutrition.pillar"),
      title: t("nutrition.title"),
    };
  }
  if (pillar === "movement") {
    return {
      minimum: t("movement.minimum"),
      pillar: t("movement.pillar"),
      title: t("movement.title"),
    };
  }
  return {
    minimum: t("mind.minimum"),
    pillar: t("mind.pillar"),
    title: t("mind.title"),
  };
}
