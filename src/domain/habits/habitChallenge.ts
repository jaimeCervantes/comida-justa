/**
 * Las reglas de un ritual: su ventana dentro de la semana de la comunidad, qué hace contar una
 * repetición, cómo se reconoce cada una y en qué nivel deja a quien la practica.
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
 * La zona en la que la comunidad comparte su semana.
 *
 * La ventana dejó de nacer el día que cada quien empezó: ahora **todas cierran el mismo lunes**, y
 * una semana compartida solo significa algo si es la misma semana. Hazlo Sano es una comunidad
 * mexicana, así que el lunes es el de aquí y no el de UTC —que en México caería a las 18:00 del
 * domingo, cerrando la semana con la tarde todavía por delante.
 */
export const COMMUNITY_TIMEZONE = "America/Mexico_City";

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
  /** Las repeticiones de esta semana: lo que mide la meta. */
  completedCycles: number;
  targetCycles: number;
  totalDays: number;
  completedDates: LocalDate[];
  /**
   * Las repeticiones de toda la historia: lo que mide el crecimiento.
   *
   * Sin ella, «tu primera repetición» habría que deducirla de los puntos, y las celebraciones se
   * dispararían por la escala equivocada: la primera de cada lunes felicitaría por una semilla que
   * despertó hace meses.
   */
  repetitions: number;
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

/**
 * La ventana que se abre al sumarse: desde hoy hasta el lunes en que cierra la semana común.
 *
 * Empieza **hoy** y no el lunes pasado porque los días que ya pasaron no se pueden practicar; una
 * ventana que los incluyera pediría cinco repeticiones con tres días de vida, que es exactamente
 * cómo se estrena perdiendo. Termina en el lunes de la comunidad porque el ritmo compartido es el
 * punto: todas las ventanas cierran juntas aunque hayan abierto en días distintos.
 *
 * El inicio se mide en la zona de quien se suma —es *su* día— y el cierre en la de la comunidad. Si
 * alguien vive tan al este que su lunes llegó antes que el de México, manda el suyo: si no, se
 * quedaría con una ventana vacía.
 */
export function openCommunityWeek(
  now: Date,
  timezone: string,
): HabitChallengePeriod {
  const startDate = localDateAt(now, timezone);
  const anchor = latestLocalDate(
    startDate,
    localDateAt(now, COMMUNITY_TIMEZONE),
  );
  return { startDate, endDate: nextCommunityWeekStart(anchor), timezone };
}

/** La ventana guardada ya cerró: para volver a registrar hay que sumarse a la semana en curso. */
export function isPeriodClosed(
  period: HabitChallengePeriod,
  now: Date,
): boolean {
  return localDateAt(now, period.timezone) >= period.endDate;
}

/**
 * La ventana con la que se practica ahora mismo.
 *
 * Solo se reescribe la que ya cerró. Reabrir una semana en curso convertiría «empezar de nuevo» en
 * el botón para borrar un mal miércoles, y la meta dejaría de significar nada.
 */
export function resolveOpenPeriod({
  stored,
  now,
  timezone,
}: {
  stored: HabitChallengePeriod | null;
  now: Date;
  timezone: string;
}): HabitChallengePeriod {
  if (stored && !isPeriodClosed(stored, now)) return stored;
  return openCommunityWeek(now, timezone);
}

/**
 * La meta de una ventana, proporcional a los días que caben en ella.
 *
 * Una semana entera pide cinco de siete, o sea que perdonar dos días es parte del trato. Toparla con
 * `min(5, días)` se lo quitaría justo a quien llega tarde: sumarse un jueves pediría cuatro de
 * cuatro, una semana perfecta o nada. La proporción conserva el mismo margen sea cual sea el tamaño.
 */
export function periodTarget(period: HabitChallengePeriod): number {
  const days = listPeriodDates(period).length;
  if (days >= HABIT_CHALLENGE_DAYS) return HABIT_CHALLENGE_TARGET;
  return Math.max(
    1,
    Math.round((days * HABIT_CHALLENGE_TARGET) / HABIT_CHALLENGE_DAYS),
  );
}

/** El lunes que sigue a una fecha; si la fecha es lunes, el de la semana siguiente. */
function nextCommunityWeekStart(localDate: LocalDate): LocalDate {
  const weekday = new Date(`${localDate}T12:00:00Z`).getUTCDay();
  return addLocalDays(localDate, HABIT_CHALLENGE_DAYS - ((weekday + 6) % 7));
}

function latestLocalDate(left: LocalDate, right: LocalDate): LocalDate {
  return left >= right ? left : right;
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

/**
 * El progreso, leído en dos escalas a la vez.
 *
 * **La meta mira la semana; el crecimiento mira la historia entera.** `completedCycles`, `succeeded`
 * y el calendario cuentan solo lo que cae dentro de la ventana vigente, porque una meta que arrastra
 * lo de semanas pasadas nace cumplida. Los puntos, el nivel y la insignia cuentan todas las
 * repeticiones: son la evidencia acumulada de «soy una persona que practica», y reiniciarlos cada
 * lunes borraría la única señal duradera que tiene quien lleva meses.
 *
 * Mientras existió una sola ventana por vida las dos escalas coincidían, así que esto no cambia
 * ningún número de quien nunca renovó.
 */
export function buildPeriodHabitProgress({
  completedDates,
  period,
}: {
  completedDates: LocalDate[];
  period: HabitChallengePeriod;
}): PeriodHabitProgress {
  const everyDate = [...new Set(completedDates)].sort();
  const periodDates = everyDate.filter(
    (date) => date >= period.startDate && date < period.endDate,
  );
  const completedCycles = periodDates.length;
  const targetCycles = periodTarget(period);
  const repetitions = everyDate.length;

  return {
    level: growthLevel(repetitions),
    xp: repetitions * HABIT_REPETITION_XP,
    badge:
      repetitions >= HABIT_CHALLENGE_TARGET
        ? "harvest"
        : repetitions > 0
          ? "first-step"
          : null,
    completedCycles,
    targetCycles,
    totalDays: listPeriodDates(period).length,
    completedDates: periodDates,
    repetitions,
    period,
    succeeded: completedCycles >= targetCycles,
  };
}

export function listPeriodDates(period: HabitChallengePeriod): LocalDate[] {
  const dates: LocalDate[] = [];
  for (
    let date = period.startDate;
    date < period.endDate;
    date = addLocalDays(date, 1)
  ) {
    dates.push(date);
  }
  return dates;
}

function growthLevel(repetitions: number): HabitLevel {
  if (repetitions >= HABIT_CHALLENGE_TARGET) return "harvest";
  if (repetitions >= 3) return "root";
  if (repetitions >= 1) return "sprout";
  return "seed";
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
