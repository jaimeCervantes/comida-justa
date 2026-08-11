import type {
  HabitChallengePeriod,
  LocalDate,
} from "~/domain/habits/atomicSleepChallenge";

export type StoredCuratedHabitProgress = {
  userId: string;
  challengeKey: string;
  period: HabitChallengePeriod;
  active: boolean;
  completedDates: LocalDate[];
};

export interface CuratedHabitRepository {
  activate(
    userId: string,
    challengeKey: string,
    period: HabitChallengePeriod,
  ): Promise<void>;
  findProgress(
    userId: string,
    challengeKey: string,
  ): Promise<StoredCuratedHabitProgress | null>;
  findActive(userId: string): Promise<StoredCuratedHabitProgress | null>;
  recordCycle(
    userId: string,
    challengeKey: string,
    cycleDate: LocalDate,
    completedAt: Date,
  ): Promise<boolean>;
}
