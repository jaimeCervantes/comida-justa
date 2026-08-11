export const ATOMIC_SLEEP_CHALLENGE_KEY =
  "sleep-evening-to-morning-v1" as const;

export const FIRST_SLEEP_CYCLE_XP = 10;
export const SLEEP_CHALLENGE_DAYS = 7;
export const SLEEP_CHALLENGE_TARGET = 5;

export type SleepCycleInput = {
  nightPrepared: boolean;
  morningLight: boolean;
};

export type SleepCycleEvaluation = "completed" | "incomplete";
export type HabitLevel = "seed" | "sprout" | "root" | "harvest";
export type HabitBadge = "first-step" | "sleep-harvest" | null;
export type CelebrationStatus = "absent" | "active" | "withdrawn";
export type LocalDate = string;

export type HabitChallengePeriod = {
  startDate: LocalDate;
  endDate: LocalDate;
  timezone: string;
};

export type CycleDateEvaluation = "available" | "future" | "outside-period";
export type CycleRecognition =
  | "first"
  | "repeat"
  | "comeback"
  | "final"
  | "duplicate";

export type SleepChallengeProgress = {
  level: HabitLevel;
  xp: number;
  badge: HabitBadge;
  completedCycles: number;
  targetCycles: number;
  totalDays: number;
  completedDates: LocalDate[];
  period: HabitChallengePeriod;
  succeeded: boolean;
};

export type FirstCycleProgress = {
  level: HabitLevel;
  xp: number;
  badge: HabitBadge;
};

export function evaluateFirstSleepCycle(
  input: SleepCycleInput,
): SleepCycleEvaluation {
  return input.nightPrepared && input.morningLight ? "completed" : "incomplete";
}

export function firstCycleProgress(completed: boolean): FirstCycleProgress {
  return completed
    ? { level: "sprout", xp: FIRST_SLEEP_CYCLE_XP, badge: "first-step" }
    : { level: "seed", xp: 0, badge: null };
}

export function isPublicCelebration(status: CelebrationStatus): boolean {
  return status === "active";
}

export function createLocalChallengePeriod(
  now: Date,
  timezone: string,
): HabitChallengePeriod {
  const startDate = localDateAt(now, timezone);
  return {
    startDate,
    endDate: addLocalDays(startDate, SLEEP_CHALLENGE_DAYS),
    timezone,
  };
}

export function evaluateCycleDate({
  cycleDate,
  period,
  now,
}: {
  cycleDate: LocalDate;
  period: HabitChallengePeriod;
  now: Date;
}): CycleDateEvaluation {
  assertLocalDate(cycleDate);
  if (cycleDate < period.startDate || cycleDate >= period.endDate) {
    return "outside-period";
  }
  return cycleDate > localDateAt(now, period.timezone) ? "future" : "available";
}

export function recognizeCycleCompletion(
  existingDates: LocalDate[],
  cycleDate: LocalDate,
  inserted: boolean,
): CycleRecognition {
  if (!inserted) return "duplicate";
  if (existingDates.length === 0) return "first";
  if (existingDates.length + 1 >= SLEEP_CHALLENGE_TARGET) return "final";

  const previousDate = addLocalDays(cycleDate, -1);
  const hasEarlierCycle = existingDates.some((date) => date < previousDate);
  return !existingDates.includes(previousDate) && hasEarlierCycle
    ? "comeback"
    : "repeat";
}

export function buildSleepChallengeProgress({
  completedDates,
  period,
}: {
  completedDates: LocalDate[];
  period: HabitChallengePeriod;
}): SleepChallengeProgress {
  const distinctDates = [...new Set(completedDates)].sort();
  const completedCycles = distinctDates.length;
  const succeeded = completedCycles >= SLEEP_CHALLENGE_TARGET;

  return {
    level: succeeded
      ? "harvest"
      : completedCycles >= 3
        ? "root"
        : completedCycles >= 1
          ? "sprout"
          : "seed",
    xp: completedCycles * FIRST_SLEEP_CYCLE_XP,
    badge: succeeded
      ? "sleep-harvest"
      : completedCycles > 0
        ? "first-step"
        : null,
    completedCycles,
    targetCycles: SLEEP_CHALLENGE_TARGET,
    totalDays: SLEEP_CHALLENGE_DAYS,
    completedDates: distinctDates,
    period,
    succeeded,
  };
}

export function listPeriodDates(period: HabitChallengePeriod): LocalDate[] {
  return Array.from({ length: SLEEP_CHALLENGE_DAYS }, (_, index) =>
    addLocalDays(period.startDate, index),
  );
}

export function localDateAt(date: Date, timezone: string): LocalDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  const localDate = `${value("year")}-${value("month")}-${value("day")}`;
  assertLocalDate(localDate);
  return localDate;
}

export function addLocalDays(localDate: LocalDate, days: number): LocalDate {
  assertLocalDate(localDate);
  const date = new Date(`${localDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function isValidTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

function assertLocalDate(localDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error(`Invalid local date: ${localDate}`);
  }
}
