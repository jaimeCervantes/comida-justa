import { getTranslations } from "next-intl/server";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

export type DeepHabitChallengeKey = Exclude<
  HabitChallengeExperienceKey,
  "sleep"
>;

export type DeepHabitChallengeCopy = {
  cueBody: string;
  cueTitle: string;
  eyebrow: string;
  identity: string;
  intro: string;
  minimumBody: string;
  minimumTitle: string;
  preparationBody: string;
  preparationTitle: string;
  reminderDisabled: string;
  reminderTitle: string;
  reminderUnavailable: string;
  ritualBody: string;
  ritualSteps: readonly string[];
  ritualTitle: string;
  safety: string;
  title: string;
};

export async function getDeepHabitChallengeCopy(
  challenge: DeepHabitChallengeKey,
): Promise<DeepHabitChallengeCopy> {
  const t = await getTranslations("atomicChallenges");
  const reminder = {
    reminderDisabled: t("reminderDisabled"),
    reminderTitle: t("reminderTitle"),
    reminderUnavailable: t("reminderUnavailable"),
  };

  if (challenge === "mind") {
    return {
      ...reminder,
      cueBody: t("mindExperience.cueBody"),
      cueTitle: t("mindExperience.cueTitle"),
      eyebrow: t("mindExperience.eyebrow"),
      identity: t("mindExperience.identity"),
      intro: t("mindExperience.intro"),
      minimumBody: t("mindExperience.minimumBody"),
      minimumTitle: t("mindExperience.minimumTitle"),
      preparationBody: t("mindExperience.preparationBody"),
      preparationTitle: t("mindExperience.preparationTitle"),
      ritualBody: t("mindExperience.ritualBody"),
      ritualSteps: [
        t("mindExperience.ritualStep1"),
        t("mindExperience.ritualStep2"),
        t("mindExperience.ritualStep3"),
        t("mindExperience.ritualStep4"),
        t("mindExperience.ritualStep5"),
      ],
      ritualTitle: t("mindExperience.ritualTitle"),
      safety: t("mindExperience.safety"),
      title: t("mindExperience.title"),
    };
  }
  if (challenge === "movement") {
    return {
      ...reminder,
      cueBody: t("movementExperience.cueBody"),
      cueTitle: t("movementExperience.cueTitle"),
      eyebrow: t("movementExperience.eyebrow"),
      identity: t("movementExperience.identity"),
      intro: t("movementExperience.intro"),
      minimumBody: t("movementExperience.minimumBody"),
      minimumTitle: t("movementExperience.minimumTitle"),
      preparationBody: t("movementExperience.preparationBody"),
      preparationTitle: t("movementExperience.preparationTitle"),
      ritualBody: t("movementExperience.ritualBody"),
      ritualSteps: [
        t("movementExperience.ritualStep1"),
        t("movementExperience.ritualStep2"),
        t("movementExperience.ritualStep3"),
        t("movementExperience.ritualStep4"),
        t("movementExperience.ritualStep5"),
      ],
      ritualTitle: t("movementExperience.ritualTitle"),
      safety: t("movementExperience.safety"),
      title: t("movementExperience.title"),
    };
  }
  return {
    ...reminder,
    cueBody: t("nutritionExperience.cueBody"),
    cueTitle: t("nutritionExperience.cueTitle"),
    eyebrow: t("nutritionExperience.eyebrow"),
    identity: t("nutritionExperience.identity"),
    intro: t("nutritionExperience.intro"),
    minimumBody: t("nutritionExperience.minimumBody"),
    minimumTitle: t("nutritionExperience.minimumTitle"),
    preparationBody: t("nutritionExperience.preparationBody"),
    preparationTitle: t("nutritionExperience.preparationTitle"),
    ritualBody: t("nutritionExperience.ritualBody"),
    ritualSteps: [
      t("nutritionExperience.ritualStep1"),
      t("nutritionExperience.ritualStep2"),
      t("nutritionExperience.ritualStep3"),
      t("nutritionExperience.ritualStep4"),
      t("nutritionExperience.ritualStep5"),
    ],
    ritualTitle: t("nutritionExperience.ritualTitle"),
    safety: t("nutritionExperience.safety"),
    title: t("nutritionExperience.title"),
  };
}
