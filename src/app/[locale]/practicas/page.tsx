import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CHALLENGE_KEY_BY_PILLAR } from "~/app/[locale]/pilares/components/pilaresData";
import {
  HABIT_CHALLENGE_EXPERIENCES,
  type HabitChallengeExperienceKey,
} from "~/domain/habits/habitChallengeExperiences";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import { resolveLocale } from "~/i18n/routing";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import { localizedAlternates } from "~/infra/UI/metadata/alternates";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";
import PracticeCardItem from "./ui/PracticeCardItem";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "practicesIndex" });
  return {
    title: t("title"),
    description: t("intro"),
    alternates: localizedAlternates("/practicas", locale),
  };
}

/**
 * El índice de las prácticas de los cuatro pilares.
 *
 * Las 45 estaban en la base desde que se sembró el catálogo y sólo se asomaban como el nombre que
 * acompaña a un estudio en la bibliografía. Aquí tienen su casa: agrupadas por pilar, cada una con
 * su ancla, lo que basta para que cuente y en cuántos estudios se apoya.
 *
 * **Cada práctica aparece una sola vez**, bajo el pilar del que es portada, aunque sirva a tres.
 * Repetirla contaría como tres lo que es una — exactamente lo que el modelo N:N vino a arreglar—, y
 * su tarjeta dice a qué otros pilares sirve.
 *
 * La identidad la pone el **pilar** y no la práctica: «soy una persona que respeta los ritmos
 * naturales de su cuerpo» vale igual para atenuar la casa que para la descarga mental, y las cuatro
 * frases ya existen en el catálogo de idiomas.
 */
export default async function PracticesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<React.ReactNode> {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);

  const t = await getTranslations("practicesIndex");
  const tPillars = await getTranslations("pillars");
  const habitT = await getTranslations("atomicChallenges");
  const sleepT = await getTranslations("atomicSleepChallenge");
  const groups = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).listByPillar(locale);

  return (
    <article>
      <header className="mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-pw-green">
          {t("eyebrow")}
        </p>
        <Heading level={1} size="display" className="mt-2">
          {t("title")}
        </Heading>
        <p className="mt-4 max-w-3xl text-lg text-body">{t("intro")}</p>
      </header>

      {groups.length === 0 ? (
        <p className="text-body">{t("empty")}</p>
      ) : (
        <div className="space-y-12">
          {groups.map(({ pillar, practices }) => {
            const color = pillarColorClasses[pillar];
            const challenge = CHALLENGE_KEY_BY_PILLAR[pillar];
            const identity = identityOf(challenge, habitT, sleepT);

            return (
              <section key={pillar} data-testid={`practices-${pillar}`}>
                <Heading level={2} className={color.text}>
                  {tPillars(`${pillar}.title`)}
                </Heading>

                <p className="mt-2 max-w-3xl text-body">
                  <span className="font-semibold">{t("identityLabel")}</span>{" "}
                  <em>{identity}</em>
                </p>

                <p className="mt-1 text-caption text-text-muted">
                  {t("pillarPracticeCount", { count: practices.length })} ·{" "}
                  {/* El slug sale del catálogo de retos, que ya lo guarda. Escribirlo aquí sería
                      la quinta lista que empareja pilares con rutas a mano. */}
                  <Link
                    href={pillarHref(
                      HABIT_CHALLENGE_EXPERIENCES[challenge].slug,
                    )}
                    className={color.link}
                  >
                    {t("readPillar")}
                  </Link>
                </p>

                <ul className="mt-6 grid gap-4 lg:grid-cols-2">
                  {practices.map((practice) => (
                    <PracticeCardItem
                      key={practice.key}
                      practice={practice}
                      pillar={pillar}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </article>
  );
}

type HabitTranslator = Awaited<
  ReturnType<typeof getTranslations<"atomicChallenges">>
>;
type SleepTranslator = Awaited<
  ReturnType<typeof getTranslations<"atomicSleepChallenge">>
>;

/**
 * La frase en primera persona de cada pilar: quién es alguien que lo practica.
 *
 * **La identidad es del pilar, no de la práctica.** «Soy una persona que respeta los ritmos
 * naturales de su cuerpo» vale igual para atenuar la casa que para la descarga mental, y por eso no
 * hay una columna `identity` en `practice_translations`: habría pedido escribir 45 identidades donde
 * hay 4 verdaderas.
 *
 * Vive en dos sitios y no es un descuido: el pilar del descanso tiene su propio espacio de nombres
 * desde el piloto y los otros tres comparten `atomicChallenges.*Experience`. Cada clave se escribe
 * entera porque una clave compuesta en tiempo de ejecución no aparece al buscarla.
 */
function identityOf(
  challenge: HabitChallengeExperienceKey,
  habitT: HabitTranslator,
  sleepT: SleepTranslator,
): string {
  if (challenge === "sleep") return sleepT("identity");
  if (challenge === "nutrition") return habitT("nutritionExperience.identity");
  if (challenge === "movement") return habitT("movementExperience.identity");
  return habitT("mindExperience.identity");
}
