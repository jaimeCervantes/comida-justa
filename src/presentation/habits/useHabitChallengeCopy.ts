"use client";

import { useTranslations } from "next-intl";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

/**
 * Las palabras del panel de seguimiento para un reto.
 *
 * Sueño escribe las suyas en su propio espacio de nombres, con nombres heredados del piloto
 * (`nightCheckbox`, `morningDate`); los otros tres comparten forma y solo cambia el espacio. Por eso
 * hay dos lecturas y no cuatro: la de Sueño traduce sus nombres viejos al vocabulario común, y la de
 * los demás se escribe una vez y sirve para los tres. Antes eran cuatro bloques casi idénticos de
 * veintitantas líneas y cada palabra nueva había que añadirla cuatro veces.
 *
 * Los cuatro `useTranslations` se piden siempre, no dentro del `if`: son hooks, y saltárselos según
 * el reto rompería el orden entre renderizados.
 */
export type HabitChallengeCopy = {
  alreadyCounted: string;
  alreadyCountedBody: string;
  badgeFirst: string;
  badgeHarvest: string;
  celebrationBody: string;
  celebrationEyebrow: string;
  celebrationTitle: string;
  comebackBody: string;
  comebackTitle: string;
  complete: string;
  continueWeek: string;
  cueCheckbox: string;
  cycleDate: string;
  cycleRecorded: string;
  cycleRecordedBody: string;
  dateUnavailable: string;
  dateUnavailableBody: string;
  dayCompleted: string;
  dayLabel: (day: number) => string;
  dayPending: string;
  finalBody: string;
  finalEyebrow: string;
  finalTitle: string;
  gardenSharingBody: string;
  gardenSharingEnable: string;
  gardenSharingTitle: string;
  gardenSharingWithdraw: string;
  incomplete: string;
  levelHarvest: string;
  levelLabel: string;
  levelSprout: string;
  loading: string;
  minimumCheckbox: string;
  minimumHeading: string;
  noHabitClaim: string;
  progressCounter: (completed: number, total: number) => string;
  recordCycle: string;
  share: string;
  shared: string;
  shareNote: string;
  signInStart: string;
  start: string;
  sustainedWeeks: (weeks: number) => string;
  weekClosed: string;
  weekClosedBody: string;
  weekEyebrow: string;
  weekTarget: (target: number, total: number) => string;
  withdraw: string;
  xp: (xp: number) => string;
};

type SleepTranslator = ReturnType<
  typeof useTranslations<"atomicSleepChallenge">
>;
type CommonTranslator = ReturnType<
  typeof useTranslations<"atomicChallenges.experienceCommon">
>;

/**
 * Lo que el panel le pide a un reto, escrito como unión y no derivado del espacio de nombres de
 * Alimentación.
 *
 * Derivarlo de Alimentación funcionaba solo mientras los tres retos fueran idénticos: en cuanto uno
 * estrenó una clave propia (`ritualStep6`, del ritual de seis pasos), Movimiento y Mente dejaron de
 * ser asignables a un traductor que prometía esa clave, y el error salía aquí —lejos de la línea
 * que lo causó—. La unión explícita dice lo que el panel realmente lee, que es lo que los tres sí
 * comparten.
 */
type ExperiencePanelKey =
  | "badgeHarvest"
  | "celebrationBody"
  | "celebrationEyebrow"
  | "celebrationTitle"
  | "comebackBody"
  | "comebackTitle"
  | "complete"
  | "continueWeek"
  | "cueCheckbox"
  | "cycleDate"
  | "cycleRecorded"
  | "cycleRecordedBody"
  | "finalBody"
  | "finalEyebrow"
  | "finalTitle"
  | "incomplete"
  | "minimumCheckbox"
  | "minimumHeading"
  | "noHabitClaim"
  | "progressCounter"
  | "recordCycle"
  | "start"
  | "weekEyebrow";

type ExperienceTranslator = (
  key: ExperiencePanelKey,
  values?: Record<string, number | string>,
) => string;

export function useHabitChallengeCopy(
  challenge: HabitChallengeExperienceKey,
): HabitChallengeCopy {
  const sleepT = useTranslations("atomicSleepChallenge");
  const commonT = useTranslations("atomicChallenges.experienceCommon");
  const nutritionT = useTranslations("atomicChallenges.nutritionExperience");
  const movementT = useTranslations("atomicChallenges.movementExperience");
  const mindT = useTranslations("atomicChallenges.mindExperience");

  if (challenge === "sleep") return sleepCopy(sleepT);

  const experienceT: ExperienceTranslator = {
    nutrition: nutritionT,
    movement: movementT,
    mind: mindT,
  }[challenge];

  return { ...commonCopy(commonT), ...experienceCopy(experienceT) };
}

function sleepCopy(t: SleepTranslator): HabitChallengeCopy {
  return {
    alreadyCounted: t("alreadyCounted"),
    alreadyCountedBody: t("alreadyCountedBody"),
    badgeFirst: t("badgeFirst"),
    badgeHarvest: t("badgeHarvest"),
    celebrationBody: t("celebrationBody"),
    celebrationEyebrow: t("celebrationEyebrow"),
    celebrationTitle: t("celebrationTitle"),
    comebackBody: t("comebackBody"),
    comebackTitle: t("comebackTitle"),
    complete: t("complete"),
    continueWeek: t("continueWeek"),
    cueCheckbox: t("nightCheckbox"),
    cycleDate: t("morningDate"),
    cycleRecorded: t("cycleRecorded"),
    cycleRecordedBody: t("cycleRecordedBody"),
    dateUnavailable: t("dateUnavailable"),
    dateUnavailableBody: t("dateUnavailableBody"),
    dayCompleted: t("dayCompleted"),
    dayLabel: (day: number): string => t("dayLabel", { day }),
    dayPending: t("dayPending"),
    finalBody: t("finalBody"),
    finalEyebrow: t("finalEyebrow"),
    finalTitle: t("finalTitle"),
    gardenSharingBody: t("gardenSharingBody"),
    gardenSharingEnable: t("gardenSharingEnable"),
    gardenSharingTitle: t("gardenSharingTitle"),
    gardenSharingWithdraw: t("gardenSharingWithdraw"),
    incomplete: t("incomplete"),
    levelHarvest: t("levelHarvest"),
    levelLabel: t("levelLabel"),
    levelSprout: t("levelSprout"),
    loading: t("loading"),
    minimumCheckbox: t("morningCheckbox"),
    minimumHeading: t("minimumHeading"),
    noHabitClaim: t("noHabitClaim"),
    progressCounter: (completed: number, total: number): string =>
      t("progressCounter", { completed, total }),
    recordCycle: t("recordCycle"),
    share: t("share"),
    shared: t("shared"),
    shareNote: t("shareNote"),
    signInStart: t("signInStart"),
    start: t("start"),
    sustainedWeeks: (weeks: number): string => t("sustainedWeeks", { weeks }),
    weekClosed: t("weekClosed"),
    weekClosedBody: t("weekClosedBody"),
    weekEyebrow: t("weekEyebrow"),
    weekTarget: (target: number, total: number): string =>
      t("weekTarget", { target, total }),
    withdraw: t("withdraw"),
    xp: (xp: number): string => t("xp", { xp }),
  };
}

function commonCopy(t: CommonTranslator) {
  return {
    alreadyCounted: t("alreadyCounted"),
    alreadyCountedBody: t("alreadyCountedBody"),
    badgeFirst: t("badgeFirst"),
    dateUnavailable: t("dateUnavailable"),
    dateUnavailableBody: t("dateUnavailableBody"),
    dayCompleted: t("dayCompleted"),
    dayLabel: (day: number): string => t("dayLabel", { day }),
    dayPending: t("dayPending"),
    gardenSharingBody: t("gardenSharingBody"),
    gardenSharingEnable: t("gardenSharingEnable"),
    gardenSharingTitle: t("gardenSharingTitle"),
    gardenSharingWithdraw: t("gardenSharingWithdraw"),
    levelHarvest: t("levelHarvest"),
    levelLabel: t("levelLabel"),
    levelSprout: t("levelSprout"),
    loading: t("loading"),
    share: t("share"),
    shared: t("shared"),
    shareNote: t("shareNote"),
    signInStart: t("signInStart"),
    sustainedWeeks: (weeks: number): string => t("sustainedWeeks", { weeks }),
    weekClosed: t("weekClosed"),
    weekClosedBody: t("weekClosedBody"),
    weekTarget: (target: number, total: number): string =>
      t("weekTarget", { target, total }),
    withdraw: t("withdraw"),
    xp: (xp: number): string => t("xp", { xp }),
  };
}

function experienceCopy(t: ExperienceTranslator) {
  return {
    badgeHarvest: t("badgeHarvest"),
    celebrationBody: t("celebrationBody"),
    celebrationEyebrow: t("celebrationEyebrow"),
    celebrationTitle: t("celebrationTitle"),
    comebackBody: t("comebackBody"),
    comebackTitle: t("comebackTitle"),
    complete: t("complete"),
    continueWeek: t("continueWeek"),
    cueCheckbox: t("cueCheckbox"),
    cycleDate: t("cycleDate"),
    cycleRecorded: t("cycleRecorded"),
    cycleRecordedBody: t("cycleRecordedBody"),
    finalBody: t("finalBody"),
    finalEyebrow: t("finalEyebrow"),
    finalTitle: t("finalTitle"),
    incomplete: t("incomplete"),
    minimumCheckbox: t("minimumCheckbox"),
    minimumHeading: t("minimumHeading"),
    noHabitClaim: t("noHabitClaim"),
    progressCounter: (completed: number, total: number): string =>
      t("progressCounter", { completed, total }),
    recordCycle: t("recordCycle"),
    start: t("start"),
    weekEyebrow: t("weekEyebrow"),
  };
}
