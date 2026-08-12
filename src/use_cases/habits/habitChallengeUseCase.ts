import {
  buildPeriodHabitProgress,
  type CelebrationStatus,
  createLocalChallengePeriod,
  evaluateCycleDate,
  evaluateHabitCheckIn,
  firstCycleProgress,
  HABIT_CHALLENGE_DAYS,
  HABIT_CHALLENGE_TARGET,
  type HabitChallengePeriod,
  type HabitCheckInAnchors,
  isValidTimeZone,
  type LocalDate,
  type PeriodHabitProgress,
  recognizeCycleCompletion,
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

  async start(
    userId: string,
    timezone: string,
  ): Promise<HabitChallengeProgress> {
    const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
    await this.repository.start(
      userId,
      createLocalChallengePeriod(this.clock.now(), safeTimezone),
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
        period: null,
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
      celebrationStatus: stored.celebrationStatus,
      finalCelebrationStatus: stored.finalCelebrationStatus,
      gardenSharingEnabled: stored.gardenSharingEnabled,
    };
  }

  private periodFrom(
    stored: StoredHabitChallengeProgress,
  ): HabitChallengePeriod | null {
    if (!stored.startDate || !stored.endDate || !stored.timezone) return null;
    return {
      startDate: stored.startDate,
      endDate: stored.endDate,
      timezone: stored.timezone,
    };
  }
}
