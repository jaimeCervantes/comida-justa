"use client";

import { useTranslations } from "next-intl";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";

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
  weekEyebrow: string;
  withdraw: string;
  xp: (xp: number) => string;
};

export function useHabitChallengeCopy(
  challenge: HabitChallengeExperienceKey,
): HabitChallengeCopy {
  const sleepT = useTranslations("atomicSleepChallenge");
  const habitT = useTranslations("atomicChallenges");

  if (challenge === "sleep") {
    return {
      alreadyCounted: sleepT("alreadyCounted"),
      alreadyCountedBody: sleepT("alreadyCountedBody"),
      badgeFirst: sleepT("badgeFirst"),
      badgeHarvest: sleepT("badgeHarvest"),
      celebrationBody: sleepT("celebrationBody"),
      celebrationEyebrow: sleepT("celebrationEyebrow"),
      celebrationTitle: sleepT("celebrationTitle"),
      comebackBody: sleepT("comebackBody"),
      comebackTitle: sleepT("comebackTitle"),
      complete: sleepT("complete"),
      continueWeek: sleepT("continueWeek"),
      cueCheckbox: sleepT("nightCheckbox"),
      cycleDate: sleepT("morningDate"),
      cycleRecorded: sleepT("cycleRecorded"),
      cycleRecordedBody: sleepT("cycleRecordedBody"),
      dateUnavailable: sleepT("dateUnavailable"),
      dateUnavailableBody: sleepT("dateUnavailableBody"),
      dayCompleted: sleepT("dayCompleted"),
      dayLabel: (day: number): string => sleepT("dayLabel", { day }),
      dayPending: sleepT("dayPending"),
      finalBody: sleepT("finalBody"),
      finalEyebrow: sleepT("finalEyebrow"),
      finalTitle: sleepT("finalTitle"),
      gardenSharingBody: sleepT("gardenSharingBody"),
      gardenSharingEnable: sleepT("gardenSharingEnable"),
      gardenSharingTitle: sleepT("gardenSharingTitle"),
      gardenSharingWithdraw: sleepT("gardenSharingWithdraw"),
      incomplete: sleepT("incomplete"),
      levelHarvest: sleepT("levelHarvest"),
      levelLabel: sleepT("levelLabel"),
      levelSprout: sleepT("levelSprout"),
      loading: sleepT("loading"),
      minimumCheckbox: sleepT("morningCheckbox"),
      minimumHeading: sleepT("minimumHeading"),
      noHabitClaim: sleepT("noHabitClaim"),
      progressCounter: (completed: number, total: number): string =>
        sleepT("progressCounter", { completed, total }),
      recordCycle: sleepT("recordCycle"),
      share: sleepT("share"),
      shared: sleepT("shared"),
      shareNote: sleepT("shareNote"),
      signInStart: sleepT("signInStart"),
      start: sleepT("start"),
      weekEyebrow: sleepT("weekEyebrow"),
      withdraw: sleepT("withdraw"),
      xp: (xp: number): string => sleepT("xp", { xp }),
    };
  }

  const common = {
    alreadyCounted: habitT("experienceCommon.alreadyCounted"),
    alreadyCountedBody: habitT("experienceCommon.alreadyCountedBody"),
    badgeFirst: habitT("experienceCommon.badgeFirst"),
    dateUnavailable: habitT("experienceCommon.dateUnavailable"),
    dateUnavailableBody: habitT("experienceCommon.dateUnavailableBody"),
    dayCompleted: habitT("experienceCommon.dayCompleted"),
    dayLabel: (day: number): string =>
      habitT("experienceCommon.dayLabel", { day }),
    dayPending: habitT("experienceCommon.dayPending"),
    gardenSharingBody: habitT("experienceCommon.gardenSharingBody"),
    gardenSharingEnable: habitT("experienceCommon.gardenSharingEnable"),
    gardenSharingTitle: habitT("experienceCommon.gardenSharingTitle"),
    gardenSharingWithdraw: habitT("experienceCommon.gardenSharingWithdraw"),
    levelHarvest: habitT("experienceCommon.levelHarvest"),
    levelLabel: habitT("experienceCommon.levelLabel"),
    levelSprout: habitT("experienceCommon.levelSprout"),
    loading: habitT("experienceCommon.loading"),
    share: habitT("experienceCommon.share"),
    shared: habitT("experienceCommon.shared"),
    shareNote: habitT("experienceCommon.shareNote"),
    signInStart: habitT("experienceCommon.signInStart"),
    withdraw: habitT("experienceCommon.withdraw"),
    xp: (xp: number): string => habitT("experienceCommon.xp", { xp }),
  };

  if (challenge === "nutrition") {
    return {
      ...common,
      badgeHarvest: habitT("nutritionExperience.badgeHarvest"),
      celebrationBody: habitT("nutritionExperience.celebrationBody"),
      celebrationEyebrow: habitT("nutritionExperience.celebrationEyebrow"),
      celebrationTitle: habitT("nutritionExperience.celebrationTitle"),
      comebackBody: habitT("nutritionExperience.comebackBody"),
      comebackTitle: habitT("nutritionExperience.comebackTitle"),
      complete: habitT("nutritionExperience.complete"),
      continueWeek: habitT("nutritionExperience.continueWeek"),
      cueCheckbox: habitT("nutritionExperience.cueCheckbox"),
      cycleDate: habitT("nutritionExperience.cycleDate"),
      cycleRecorded: habitT("nutritionExperience.cycleRecorded"),
      cycleRecordedBody: habitT("nutritionExperience.cycleRecordedBody"),
      finalBody: habitT("nutritionExperience.finalBody"),
      finalEyebrow: habitT("nutritionExperience.finalEyebrow"),
      finalTitle: habitT("nutritionExperience.finalTitle"),
      incomplete: habitT("nutritionExperience.incomplete"),
      minimumCheckbox: habitT("nutritionExperience.minimumCheckbox"),
      minimumHeading: habitT("nutritionExperience.minimumHeading"),
      noHabitClaim: habitT("nutritionExperience.noHabitClaim"),
      progressCounter: (completed: number, total: number): string =>
        habitT("nutritionExperience.progressCounter", { completed, total }),
      recordCycle: habitT("nutritionExperience.recordCycle"),
      start: habitT("nutritionExperience.start"),
      weekEyebrow: habitT("nutritionExperience.weekEyebrow"),
    };
  }
  if (challenge === "movement") {
    return {
      ...common,
      badgeHarvest: habitT("movementExperience.badgeHarvest"),
      celebrationBody: habitT("movementExperience.celebrationBody"),
      celebrationEyebrow: habitT("movementExperience.celebrationEyebrow"),
      celebrationTitle: habitT("movementExperience.celebrationTitle"),
      comebackBody: habitT("movementExperience.comebackBody"),
      comebackTitle: habitT("movementExperience.comebackTitle"),
      complete: habitT("movementExperience.complete"),
      continueWeek: habitT("movementExperience.continueWeek"),
      cueCheckbox: habitT("movementExperience.cueCheckbox"),
      cycleDate: habitT("movementExperience.cycleDate"),
      cycleRecorded: habitT("movementExperience.cycleRecorded"),
      cycleRecordedBody: habitT("movementExperience.cycleRecordedBody"),
      finalBody: habitT("movementExperience.finalBody"),
      finalEyebrow: habitT("movementExperience.finalEyebrow"),
      finalTitle: habitT("movementExperience.finalTitle"),
      incomplete: habitT("movementExperience.incomplete"),
      minimumCheckbox: habitT("movementExperience.minimumCheckbox"),
      minimumHeading: habitT("movementExperience.minimumHeading"),
      noHabitClaim: habitT("movementExperience.noHabitClaim"),
      progressCounter: (completed: number, total: number): string =>
        habitT("movementExperience.progressCounter", { completed, total }),
      recordCycle: habitT("movementExperience.recordCycle"),
      start: habitT("movementExperience.start"),
      weekEyebrow: habitT("movementExperience.weekEyebrow"),
    };
  }
  return {
    ...common,
    badgeHarvest: habitT("mindExperience.badgeHarvest"),
    celebrationBody: habitT("mindExperience.celebrationBody"),
    celebrationEyebrow: habitT("mindExperience.celebrationEyebrow"),
    celebrationTitle: habitT("mindExperience.celebrationTitle"),
    comebackBody: habitT("mindExperience.comebackBody"),
    comebackTitle: habitT("mindExperience.comebackTitle"),
    complete: habitT("mindExperience.complete"),
    continueWeek: habitT("mindExperience.continueWeek"),
    cueCheckbox: habitT("mindExperience.cueCheckbox"),
    cycleDate: habitT("mindExperience.cycleDate"),
    cycleRecorded: habitT("mindExperience.cycleRecorded"),
    cycleRecordedBody: habitT("mindExperience.cycleRecordedBody"),
    finalBody: habitT("mindExperience.finalBody"),
    finalEyebrow: habitT("mindExperience.finalEyebrow"),
    finalTitle: habitT("mindExperience.finalTitle"),
    incomplete: habitT("mindExperience.incomplete"),
    minimumCheckbox: habitT("mindExperience.minimumCheckbox"),
    minimumHeading: habitT("mindExperience.minimumHeading"),
    noHabitClaim: habitT("mindExperience.noHabitClaim"),
    progressCounter: (completed: number, total: number): string =>
      habitT("mindExperience.progressCounter", { completed, total }),
    recordCycle: habitT("mindExperience.recordCycle"),
    start: habitT("mindExperience.start"),
    weekEyebrow: habitT("mindExperience.weekEyebrow"),
  };
}
