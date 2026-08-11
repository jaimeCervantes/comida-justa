import {
  createLocalChallengePeriod,
  isValidTimeZone,
  localDateAt,
} from "~/domain/habits/atomicSleepChallenge";
import type {
  CuratedHabitRepository,
  StoredCuratedHabitProgress,
} from "./ports/CuratedHabitRepository";

export type CuratedHabitProgress = StoredCuratedHabitProgress & {
  completedCycles: number;
  completedToday: boolean;
  xp: number;
};

export interface CuratedHabitClock {
  now(): Date;
}

const systemClock: CuratedHabitClock = { now: (): Date => new Date() };

export default class CuratedHabitUseCase {
  constructor(
    private readonly repository: CuratedHabitRepository,
    private readonly clock: CuratedHabitClock = systemClock,
  ) {}

  async activate(
    userId: string,
    challengeKey: string,
    timezone: string,
  ): Promise<CuratedHabitProgress> {
    const safeTimezone = isValidTimeZone(timezone) ? timezone : "UTC";
    await this.repository.activate(
      userId,
      challengeKey,
      createLocalChallengePeriod(this.clock.now(), safeTimezone),
    );
    const progress = await this.getProgress(userId, challengeKey);
    if (!progress)
      throw new Error("Activated habit progress could not be read.");
    return progress;
  }

  async getProgress(
    userId: string,
    challengeKey: string,
  ): Promise<CuratedHabitProgress | null> {
    const progress = await this.repository.findProgress(userId, challengeKey);
    return progress ? this.toProgress(progress) : null;
  }

  async getActive(userId: string): Promise<CuratedHabitProgress | null> {
    const progress = await this.repository.findActive(userId);
    return progress ? this.toProgress(progress) : null;
  }

  async completeToday(userId: string, challengeKey: string): Promise<boolean> {
    const progress = await this.repository.findProgress(userId, challengeKey);
    if (!progress?.active) return false;
    return this.repository.recordCycle(
      userId,
      challengeKey,
      localDateAt(this.clock.now(), progress.period.timezone),
      this.clock.now(),
    );
  }

  private toProgress(
    progress: StoredCuratedHabitProgress,
  ): CuratedHabitProgress {
    const completedCycles = new Set(progress.completedDates).size;
    return {
      ...progress,
      completedCycles,
      completedToday: progress.completedDates.includes(
        localDateAt(this.clock.now(), progress.period.timezone),
      ),
      xp: completedCycles * 10,
    };
  }
}
