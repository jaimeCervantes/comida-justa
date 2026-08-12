/**
 * Las reglas de un ritual: su ventana local de siete días, qué hace contar una repetición, cómo se
 * reconoce cada una y en qué nivel deja a quien la practica.
 *
 * Son las mismas para los cuatro pilares. El archivo se llamaba `atomicSleepChallenge` y todo aquí
 * dentro hablaba de Sueño porque Sueño fue el piloto; cuando Alimentación, Movimiento y Mente
 * llegaron, heredaron estas reglas sin que los nombres se enteraran. Un `SLEEP_CHALLENGE_TARGET`
 * gobernando la meta de los cuatro no es un detalle cosmético: es una pista falsa para quien venga
 * a cambiar solo el de Sueño.
 *
 * Lo único que sigue siendo de Sueño es su clave, y por eso es lo único que la nombra.
 */
export const SLEEP_CHALLENGE_KEY = "sleep-evening-to-morning-v1" as const;

/** Diez puntos por repetición, en los cuatro rituales. Registrar más de una al día no suma. */
export const HABIT_REPETITION_XP = 10;
export const HABIT_CHALLENGE_DAYS = 7;
export const HABIT_CHALLENGE_TARGET = 5;

/**
 * Las dos anclas que confirma una repetición: la señal que la dispara y el mínimo que cuenta.
 *
 * Los cuatro rituales piden lo mismo aunque lo llamen distinto —cerrar la noche y abrir la mañana,
 * cenar al atardecer y servir la triada—, así que la regla es una y vive aquí. Estuvo duplicada:
 * el dominio la aplicaba para Sueño y la acción de los otros tres repetía el `&&` a mano.
 */
export type HabitCheckInAnchors = {
  cueCompleted: boolean;
  minimumCompleted: boolean;
};

export type HabitCheckInEvaluation = "completed" | "incomplete";
export type HabitLevel = "seed" | "sprout" | "root" | "harvest";
export type HabitBadge = "first-step" | "harvest" | null;
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

export type PeriodHabitProgress = {
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

export function evaluateHabitCheckIn(
  anchors: HabitCheckInAnchors,
): HabitCheckInEvaluation {
  return anchors.cueCompleted && anchors.minimumCompleted
    ? "completed"
    : "incomplete";
}

export function firstCycleProgress(completed: boolean): FirstCycleProgress {
  return completed
    ? { level: "sprout", xp: HABIT_REPETITION_XP, badge: "first-step" }
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
    endDate: addLocalDays(startDate, HABIT_CHALLENGE_DAYS),
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
  if (existingDates.length + 1 >= HABIT_CHALLENGE_TARGET) return "final";

  const previousDate = addLocalDays(cycleDate, -1);
  const hasEarlierCycle = existingDates.some((date) => date < previousDate);
  return !existingDates.includes(previousDate) && hasEarlierCycle
    ? "comeback"
    : "repeat";
}

export function buildPeriodHabitProgress({
  completedDates,
  period,
}: {
  completedDates: LocalDate[];
  period: HabitChallengePeriod;
}): PeriodHabitProgress {
  const distinctDates = [...new Set(completedDates)].sort();
  const completedCycles = distinctDates.length;
  const succeeded = completedCycles >= HABIT_CHALLENGE_TARGET;

  return {
    level: succeeded
      ? "harvest"
      : completedCycles >= 3
        ? "root"
        : completedCycles >= 1
          ? "sprout"
          : "seed",
    xp: completedCycles * HABIT_REPETITION_XP,
    badge: succeeded ? "harvest" : completedCycles > 0 ? "first-step" : null,
    completedCycles,
    targetCycles: HABIT_CHALLENGE_TARGET,
    totalDays: HABIT_CHALLENGE_DAYS,
    completedDates: distinctDates,
    period,
    succeeded,
  };
}

export function listPeriodDates(period: HabitChallengePeriod): LocalDate[] {
  return Array.from({ length: HABIT_CHALLENGE_DAYS }, (_, index) =>
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
