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
  | "ritualStep1"
  | "ritualStep2"
  | "ritualStep3"
  | "ritualStep4"
  | "ritualStep5"
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

  const t = await experienceTranslator(challenge);
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
      steps: [
        t("ritualStep1"),
        t("ritualStep2"),
        t("ritualStep3"),
        t("ritualStep4"),
        t("ritualStep5"),
      ],
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
