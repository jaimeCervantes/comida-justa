import { useLocale, useTranslations } from "next-intl";
import type { CommunityGarden } from "~/domain/habits/habitCommunity";
import { Link } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";
import { resolveLocale } from "~/i18n/routing";
import { signInPathFor } from "~/infra/auth/signInPath";
import { PUBLIC_BRAND_NAME } from "~/infra/constants";
import { Heading } from "~/presentation/design_system/typography/Heading";
import CommunityHabitGarden from "~/presentation/habits/CommunityHabitGarden";
import PillarHero from "~/presentation/habits/PillarHero";
import PublicHabitCelebrationList from "~/presentation/habits/PublicHabitCelebrationList";
import { getPillarTheme } from "~/presentation/habits/pillarThemes";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import { setHabitCelebrationReaction } from "../../habitCommunityActions";
import {
  CHALLENGE_KEY_BY_PILLAR,
  PILLARS,
  pillarColorClasses,
} from "./pilaresData";

export default function PilaresOverviewPage({
  celebrations,
  garden,
  viewerSignedIn,
}: {
  celebrations: PublicHabitCelebration[];
  garden: CommunityGarden;
  viewerSignedIn: boolean;
}) {
  const t = useTranslations("pillarsOverview");
  const tPillars = useTranslations("pillars");
  const tPages = useTranslations("pillarPages");
  const habitT = useTranslations("atomicChallenges");
  /* Quien todavía no puede celebrar vuelve **a esta misma página** tras entrar, no a la portada:
     estaba leyendo la lista, y devolverlo al inicio le hace buscar otra vez la tarjeta. */
  const signInHref = signInPathFor(
    resolveLocale(useLocale()),
    PILLARS_OVERVIEW_HREF,
  );

  return (
    <article>
      <section className="relative isolate overflow-hidden rounded-panel border border-pillar-sleep-ink/20 bg-surface-elevation-1 shadow-xl mb-10">
        <PillarHero
          level={2}
          eyebrow={t("heroEyebrow")}
          title={t.rich("heading", {
            brandName: PUBLIC_BRAND_NAME,
            brand: (chunks) => <span>{chunks}</span>,
          })}
          intro={t("intro")}
          identity={t("heroIdentity")}
          theme={getPillarTheme("nutrition")}
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
                className={`focus-ring group block rounded-card border-2 ${c.border} ${c.bg} p-6 sm:p-8 transition-all duration-300 hover:shadow-lg ${c.hover}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${c.badge} text-white text-sm font-bold shrink-0`}
                  >
                    {pillar.number}
                  </span>
                  <Heading
                    level={2}
                    size="sm"
                    tone="inherit"
                    className={`${c.text} group-hover:underline group-hover:underline-offset-4`}
                  >
                    {tPillars(`${pillar.key}.title`)}
                  </Heading>
                </div>

                <p className="text-base text-text-support mb-3">
                  {tPages(`${pillar.key}.subtitle`)}
                </p>

                <p className="text-text-support text-base leading-relaxed mb-4">
                  {tPillars(`${pillar.key}.cardDescription`)}
                </p>

                {/*
                  **La práctica, dentro de la tarjeta.** Es la primera anotación del 5.10: el hub
                  explicaba cuatro conceptos y dejaba al visitante sin nada que hacer, así que
                  «Leer más» no prometía nada concreto. Con el nombre del ritual delante —«Del
                  atardecer al amanecer»— el enlace ya tiene destino.

                  El nombre vive bajo la clave del **reto**, no la del pilar, y la equivalencia se
                  deriva de `PILLAR_KEY_BY_CHALLENGE` en vez de emparejarse aquí a mano.
                */}
                <p className="mb-4 flex flex-col gap-0.5">
                  <span className="text-caption font-semibold uppercase tracking-[0.14em] text-text-muted">
                    {t("practiceLabel")}
                  </span>
                  <span
                    data-testid={`pillar-practice-${pillar.key}`}
                    className={`text-label font-semibold ${c.text}`}
                  >
                    {habitT(`${CHALLENGE_KEY_BY_PILLAR[pillar.key]}.title`)}
                  </span>
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
            signInHref={signInHref}
          />
        </div>
      </section>

      <section className="mt-16 text-center">
        <div className="bg-surface-elevation-2 rounded-card p-8 max-w-3xl mx-auto">
          <Heading level={2} className="mb-3">
            {t("whyHeading")}
          </Heading>
          <p className="text-lg text-text-support leading-relaxed">
            {t("whyBody")}
          </p>
        </div>
      </section>
    </article>
  );
}
