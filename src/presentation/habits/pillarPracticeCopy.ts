import { getTranslations } from "next-intl/server";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import type { PillarPracticeCopy } from "./PillarPracticeSection";
import { getPillarTheme } from "./pillarThemes";

/**
 * La copia de la práctica de un pilar, leída del catálogo.
 *
 * Sueño nombra sus anclas por el momento del día (`nightHeading`, `morningHeading`) y los otros tres
 * por su función (`cueTitle`, `minimumTitle`). Son dos vocabularios de verdad, no un descuido, así
 * que aquí hay dos lecturas y una sola forma de salida; el componente ya no distingue.
 *
 * Cada clave se escribe entera y a mano: una clave compuesta en tiempo de ejecución es una clave
 * que no aparece al buscarla, y `AGENTS.md` lo prohíbe fuera de uniones cerradas.
 *
 * Los pasos del ritual salen aparte (`experienceRitualSteps`) y no de esta unión: Alimentación
 * tiene seis y los demás cinco, así que un traductor común que prometiera `ritualStep6` dejaría de
 * aceptar a Movimiento y a Mente. La forma que comparten los tres es todo lo demás.
 */
type ExperienceKey = Exclude<HabitChallengeExperienceKey, "sleep">;

type ExperienceCopyKey =
  | "cueBody"
  | "cueTitle"
  | "eyebrow"
  | "intro"
  | "minimumBody"
  | "minimumTitle"
  | "preparationBody"
  | "preparationTitle"
  | "ritualBody"
  | "ritualTitle"
  | "safety"
  | "title";

type ExperienceTranslator = (key: ExperienceCopyKey) => string;

export async function getPillarPracticeCopy(
  challenge: HabitChallengeExperienceKey,
): Promise<PillarPracticeCopy> {
  const common = await getTranslations("atomicChallenges.experienceCommon");
  const [cueSymbol, minimumSymbol] = getPillarTheme(challenge).anchorSymbols;
  const ritualEyebrow = common("ritualEyebrow");

  if (challenge === "sleep") {
    const t = await getTranslations("atomicSleepChallenge");
    return {
      eyebrow: t("practiceEyebrow"),
      title: t("title"),
      intro: t("intro"),
      lead: { heading: t("minimumHeading"), body: t("minimumBody") },
      anchors: [
        {
          symbol: cueSymbol,
          title: t("nightHeading"),
          body: t("nightDescription"),
        },
        {
          symbol: minimumSymbol,
          title: t("morningHeading"),
          body: t("morningDescription"),
        },
      ],
      ritual: {
        eyebrow: ritualEyebrow,
        title: t("recommendedHeading"),
        body: t("recommendedBody"),
        steps: [
          t("eveningLight"),
          t("dinner"),
          t("clothes"),
          t("room"),
          t("movement"),
        ],
        safety: t("safety"),
      },
    };
  }

  const [t, steps] = await Promise.all([
    experienceTranslator(challenge),
    experienceRitualSteps(challenge),
  ]);
  return {
    eyebrow: t("eyebrow"),
    title: t("title"),
    intro: t("intro"),
    anchors: [
      { symbol: cueSymbol, title: t("cueTitle"), body: t("cueBody") },
      {
        symbol: minimumSymbol,
        title: t("minimumTitle"),
        body: t("minimumBody"),
      },
    ],
    note: { title: t("preparationTitle"), body: t("preparationBody") },
    ritual: {
      eyebrow: ritualEyebrow,
      title: t("ritualTitle"),
      body: t("ritualBody"),
      steps,
      safety: t("safety"),
    },
  };
}

async function experienceTranslator(
  challenge: ExperienceKey,
): Promise<ExperienceTranslator> {
  if (challenge === "nutrition") {
    return getTranslations("atomicChallenges.nutritionExperience");
  }
  if (challenge === "movement") {
    return getTranslations("atomicChallenges.movementExperience");
  }
  return getTranslations("atomicChallenges.mindExperience");
}

/**
 * Los pasos del ritual, uno por uno y por reto.
 *
 * Alimentación tiene seis —abastecer, anclar, cocinar, servir, estar y notar— y los otros dos
 * cinco. El número no es un detalle de redacción que se pueda deducir: es el catálogo quien decide
 * cuántos pasos existen, y la sección los pinta todos sin contarlos.
 */
async function experienceRitualSteps(
  challenge: ExperienceKey,
): Promise<readonly string[]> {
  if (challenge === "nutrition") {
    const t = await getTranslations("atomicChallenges.nutritionExperience");
    return [
      t("ritualStep1"),
      t("ritualStep2"),
      t("ritualStep3"),
      t("ritualStep4"),
      t("ritualStep5"),
      t("ritualStep6"),
    ];
  }
  if (challenge === "movement") {
    const t = await getTranslations("atomicChallenges.movementExperience");
    return [
      t("ritualStep1"),
      t("ritualStep2"),
      t("ritualStep3"),
      t("ritualStep4"),
      t("ritualStep5"),
    ];
  }
  const t = await getTranslations("atomicChallenges.mindExperience");
  return [
    t("ritualStep1"),
    t("ritualStep2"),
    t("ritualStep3"),
    t("ritualStep4"),
    t("ritualStep5"),
  ];
}
