import {
  buildPeriodHabitProgress,
  type CelebrationStatus,
  countSustainedWeeks,
  evaluateCycleDate,
  evaluateHabitCheckIn,
  firstCycleProgress,
  HABIT_CHALLENGE_DAYS,
  HABIT_CHALLENGE_TARGET,
  type HabitChallengePeriod,
  type HabitCheckInAnchors,
  isPeriodClosed,
  isValidTimeZone,
  type LocalDate,
  type PeriodHabitProgress,
  recognizeCycleCompletion,
  resolveOpenPeriod,
} from "~/domain/habits/habitChallenge";
import type {
  HabitCelebrationMilestone,
  HabitChallengeRepository,
  StoredHabitChallengeProgress,
} from "./ports/HabitChallengeRepository";

/**
 * El progreso tal como lo consume la interfaz, para cualquiera de los cuatro rituales.
 *
 * Se distingue de `PeriodHabitProgress` en el `period`: el dominio calcula sobre una ventana que
 * existe, y aquí puede no haberla todavía —alguien que abrió el pilar y aún no empezó—. Lo demás
 * que se suma son decisiones de la persona, no del cálculo: si compartió sus celebraciones y si
 * aporta sus repeticiones al jardín.
 */
export type HabitChallengeProgress = Omit<PeriodHabitProgress, "period"> & {
  period: HabitChallengePeriod | null;
  /**
   * La ventana guardada ya cerró y hay que sumarse a la semana en curso para volver a registrar.
   *
   * Lo decide el servidor y no el panel: el panel solo conoce la hora del navegador, y la ventana
   * cierra en la zona de quien practica, no en la de quien mira.
   */
  periodClosed: boolean;
  celebrationStatus: CelebrationStatus;
  finalCelebrationStatus: CelebrationStatus;
  gardenSharingEnabled: boolean;
};

export type CompleteCycleResult =
  | {
      ok: false;
      reason:
        | "incomplete"
        | "not-started"
        | "not-scheduled"
        | "future"
        | "outside-period";
    }
  | {
      ok: true;
      newlyCompleted: boolean;
      recognition: ReturnType<typeof recognizeCycleCompletion>;
      progress: HabitChallengeProgress;
    };

export interface Clock {
  now(): Date;
}

export type HabitCheckInInput = HabitCheckInAnchors & {
  cycleDate: LocalDate;
};

const systemClock: Clock = { now: (): Date => new Date() };

/**
 * Empezar un ritual, registrar una repetición, compartir un hito y aportar al jardín.
 *
 * Uno solo para los cuatro pilares: el reto no entra por aquí, entra en el repositorio con el que
 * se construye. Se llamaba `AtomicSleepChallengeUseCase` desde el piloto, y para cuando servía a
 * los cuatro el nombre ya solo servía para hacer dudar de si Alimentación estaba usando el caso de
 * uso correcto.
 */
export default class HabitChallengeUseCase {
  constructor(
    private readonly repository: HabitChallengeRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  /**
   * Sumarse a la semana en curso: abre una ventana nueva si la anterior cerró y respeta la que sigue
   * abierta.
   *
   * La decisión vive aquí y no en el `INSERT ... ON CONFLICT` del repositorio, donde estuvo escrita
   * como un `coalesce` que hacía imposible mover la ventana: la primera que se guardaba era la única
   * que existiría. Una regla de negocio en SQL es una regla que nadie encuentra cuando deja de valer.
   */
  async start(
    userId: string,
    timezone: string,
  ): Promise<HabitChallengeProgress> {
    const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
    const stored = await this.repository.findProgress(userId);
    await this.repository.start(
      userId,
      resolveOpenPeriod({
        stored: stored ? this.periodFrom(stored) : null,
        now: this.clock.now(),
        timezone: safeTimezone,
      }),
    );
    return this.requiredProgress(userId);
  }

  async getProgress(userId: string): Promise<HabitChallengeProgress | null> {
    const stored = await this.repository.findProgress(userId);
    if (!stored) return null;

    return this.toProgress(stored);
  }

  async completeCheckIn(
    userId: string,
    input: HabitCheckInInput,
  ): Promise<CompleteCycleResult> {
    if (evaluateHabitCheckIn(input) === "incomplete") {
      return { ok: false, reason: "incomplete" };
    }
    const stored = await this.repository.findProgress(userId);
    if (!stored) {
      return { ok: false, reason: "not-started" };
    }
    const period = this.periodFrom(stored);
    if (!period) return { ok: false, reason: "not-scheduled" };

    const dateEvaluation = evaluateCycleDate({
      cycleDate: input.cycleDate,
      period,
      now: this.clock.now(),
    });
    if (dateEvaluation !== "available") {
      return { ok: false, reason: dateEvaluation };
    }

    const newlyCompleted = await this.repository.recordCycle(
      userId,
      input.cycleDate,
      this.clock.now(),
    );
    return {
      ok: true,
      newlyCompleted,
      recognition: recognizeCycleCompletion(
        stored.completedDates,
        input.cycleDate,
        newlyCompleted,
      ),
      progress: await this.requiredProgress(userId),
    };
  }

  async shareCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<boolean> {
    return this.repository.publishCelebration(userId, milestone);
  }

  async withdrawCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<void> {
    await this.repository.withdrawCelebration(userId, milestone);
  }

  async setGardenSharing(userId: string, enabled: boolean): Promise<void> {
    await this.repository.setGardenSharing(userId, enabled);
  }

  private async requiredProgress(
    userId: string,
  ): Promise<HabitChallengeProgress> {
    const progress = await this.getProgress(userId);
    if (!progress) {
      throw new Error(
        "El progreso del reto no se pudo leer después de guardarlo.",
      );
    }
    return progress;
  }

  private toProgress(
    stored: StoredHabitChallengeProgress,
  ): HabitChallengeProgress {
    const period = this.periodFrom(stored);
    if (!period) {
      const first = firstCycleProgress(stored.firstCycleCompletedAt !== null);
      return {
        ...first,
        completedCycles: stored.firstCycleCompletedAt ? 1 : 0,
        targetCycles: HABIT_CHALLENGE_TARGET,
        totalDays: HABIT_CHALLENGE_DAYS,
        completedDates: stored.completedDates,
        repetitions: stored.completedDates.length,
        sustainedWeeks: countSustainedWeeks(stored.completedDates),
        period: null,
        periodClosed: false,
        succeeded: false,
        celebrationStatus: stored.celebrationStatus,
        finalCelebrationStatus: stored.finalCelebrationStatus,
        gardenSharingEnabled: stored.gardenSharingEnabled,
      };
    }

    return {
      ...buildPeriodHabitProgress({
        completedDates: stored.completedDates,
        period,
      }),
      periodClosed: isPeriodClosed(period, this.clock.now()),
      celebrationStatus: stored.celebrationStatus,
      finalCelebrationStatus: stored.finalCelebrationStatus,
      gardenSharingEnabled: stored.gardenSharingEnabled,
    };
  }

  /**
   * La ventana guardada, con el huso saneado al entrar.
   *
   * `Intl.DateTimeFormat` **lanza** con un huso que no reconoce, y desde que la ventana puede estar
   * cerrada ese huso se lee en **cada render** de la página del pilar: antes solo se tocaba al
   * registrar una repetición. Un valor raro en la columna dejó de ser un check-in fallido para
   * pasar a ser un pilar que no abre.
   *
   * Se cae a UTC, que es la misma red que `start()` tiende sobre el huso que manda el navegador.
   * Nadie escribe esa columna sin pasar por ahí hoy —los nueve valores en producción son
   * `America/Mexico_City`—, pero la columna es de texto y la base la comparte otro backend.
   */
  private periodFrom(
    stored: StoredHabitChallengeProgress,
  ): HabitChallengePeriod | null {
    if (!stored.startDate || !stored.endDate || !stored.timezone) return null;
    return {
      startDate: stored.startDate,
      endDate: stored.endDate,
      timezone: isValidTimeZone(stored.timezone) ? stored.timezone : "UTC",
    };
  }
}
