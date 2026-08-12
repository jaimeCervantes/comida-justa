import {
  buildSleepChallengeProgress,
  type CelebrationStatus,
  createLocalChallengePeriod,
  evaluateCycleDate,
  evaluateFirstSleepCycle,
  firstCycleProgress,
  type HabitChallengePeriod,
  isValidTimeZone,
  type LocalDate,
  recognizeCycleCompletion,
  type SleepChallengeProgress,
  type SleepCycleInput,
} from "~/domain/habits/atomicSleepChallenge";
import type {
  AtomicSleepChallengeRepository,
  StoredAtomicSleepProgress,
} from "./ports/AtomicSleepChallengeRepository";

export type AtomicSleepProgress = Omit<SleepChallengeProgress, "period"> & {
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
      progress: AtomicSleepProgress;
    };

export interface Clock {
  now(): Date;
}

export type HabitCheckInInput = {
  minimumCompleted: boolean;
  cycleDate: LocalDate;
};

const systemClock: Clock = { now: (): Date => new Date() };

export default class AtomicSleepChallengeUseCase {
  constructor(
    private readonly repository: AtomicSleepChallengeRepository,
    private readonly clock: Clock = systemClock,
  ) {}

  async start(userId: string, timezone: string): Promise<AtomicSleepProgress> {
    const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
    await this.repository.start(
      userId,
      createLocalChallengePeriod(this.clock.now(), safeTimezone),
    );
    return this.requiredProgress(userId);
  }

  async getProgress(userId: string): Promise<AtomicSleepProgress | null> {
    const stored = await this.repository.findProgress(userId);
    if (!stored) return null;

    return this.toProgress(stored);
  }

  async completeCycle(
    userId: string,
    input: SleepCycleInput & { cycleDate: LocalDate },
  ): Promise<CompleteCycleResult> {
    if (evaluateFirstSleepCycle(input) === "incomplete") {
      return { ok: false, reason: "incomplete" };
    }
    return this.completeCheckIn(userId, {
      minimumCompleted: true,
      cycleDate: input.cycleDate,
    });
  }

  async completeCheckIn(
    userId: string,
    input: HabitCheckInInput,
  ): Promise<CompleteCycleResult> {
    if (!input.minimumCompleted) {
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

  async completeFirstCycle(
    userId: string,
    input: SleepCycleInput & { cycleDate: LocalDate },
  ): Promise<CompleteCycleResult> {
    return this.completeCycle(userId, input);
  }

  async shareFirstCelebration(userId: string): Promise<boolean> {
    return this.repository.publishCelebration(userId, "first_cycle");
  }

  async withdrawFirstCelebration(userId: string): Promise<void> {
    await this.repository.withdrawCelebration(userId, "first_cycle");
  }

  async shareFinalCelebration(userId: string): Promise<boolean> {
    return this.repository.publishCelebration(userId, "challenge_completed");
  }

  async withdrawFinalCelebration(userId: string): Promise<void> {
    await this.repository.withdrawCelebration(userId, "challenge_completed");
  }

  async setGardenSharing(userId: string, enabled: boolean): Promise<void> {
    await this.repository.setGardenSharing(userId, enabled);
  }

  private async requiredProgress(userId: string): Promise<AtomicSleepProgress> {
    const progress = await this.getProgress(userId);
    if (!progress) {
      throw new Error(
        "El progreso del reto no se pudo leer después de guardarlo.",
      );
    }
    return progress;
  }

  private toProgress(stored: StoredAtomicSleepProgress): AtomicSleepProgress {
    const period = this.periodFrom(stored);
    if (!period) {
      const first = firstCycleProgress(stored.firstCycleCompletedAt !== null);
      return {
        ...first,
        completedCycles: stored.firstCycleCompletedAt ? 1 : 0,
        targetCycles: 5,
        totalDays: 7,
        completedDates: stored.completedDates,
        period: null,
        succeeded: false,
        celebrationStatus: stored.celebrationStatus,
        finalCelebrationStatus: stored.finalCelebrationStatus,
        gardenSharingEnabled: stored.gardenSharingEnabled,
      };
    }

    return {
      ...buildSleepChallengeProgress({
        completedDates: stored.completedDates,
        period,
      }),
      celebrationStatus: stored.celebrationStatus,
      finalCelebrationStatus: stored.finalCelebrationStatus,
      gardenSharingEnabled: stored.gardenSharingEnabled,
    };
  }

  private periodFrom(
    stored: StoredAtomicSleepProgress,
  ): HabitChallengePeriod | null {
    if (!stored.startDate || !stored.endDate || !stored.timezone) return null;
    return {
      startDate: stored.startDate,
      endDate: stored.endDate,
      timezone: stored.timezone,
    };
  }
}
