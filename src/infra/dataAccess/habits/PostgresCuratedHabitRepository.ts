import { and, eq } from "drizzle-orm";
import type {
  HabitChallengePeriod,
  LocalDate,
} from "~/domain/habits/atomicSleepChallenge";
import { db } from "~/infra/dataAccess/db/connection";
import {
  habitChallengeProgress,
  habitRepetitions,
} from "~/infra/dataAccess/db/schema/habits";
import type {
  CuratedHabitRepository,
  StoredCuratedHabitProgress,
} from "~/use_cases/habits/ports/CuratedHabitRepository";

export default class PostgresCuratedHabitRepository
  implements CuratedHabitRepository
{
  async activate(
    userId: string,
    challengeKey: string,
    period: HabitChallengePeriod,
  ): Promise<void> {
    await db.transaction(async (transaction): Promise<void> => {
      await transaction
        .update(habitChallengeProgress)
        .set({ activeForOnboarding: false })
        .where(eq(habitChallengeProgress.userId, userId));
      await transaction
        .insert(habitChallengeProgress)
        .values({
          userId,
          challengeKey,
          timezone: period.timezone,
          periodStartDate: period.startDate,
          periodEndDate: period.endDate,
          activeForOnboarding: true,
        })
        .onConflictDoUpdate({
          target: [
            habitChallengeProgress.userId,
            habitChallengeProgress.challengeKey,
          ],
          set: { activeForOnboarding: true },
        });
    });
  }

  async findProgress(
    userId: string,
    challengeKey: string,
  ): Promise<StoredCuratedHabitProgress | null> {
    const [row] = await db
      .select({
        userId: habitChallengeProgress.userId,
        challengeKey: habitChallengeProgress.challengeKey,
        startDate: habitChallengeProgress.periodStartDate,
        endDate: habitChallengeProgress.periodEndDate,
        timezone: habitChallengeProgress.timezone,
        active: habitChallengeProgress.activeForOnboarding,
      })
      .from(habitChallengeProgress)
      .where(
        and(
          eq(habitChallengeProgress.userId, userId),
          eq(habitChallengeProgress.challengeKey, challengeKey),
        ),
      )
      .limit(1);
    if (!row?.startDate || !row.endDate || !row.timezone) return null;
    return {
      userId: row.userId,
      challengeKey: row.challengeKey,
      active: row.active,
      period: {
        startDate: row.startDate,
        endDate: row.endDate,
        timezone: row.timezone,
      },
      completedDates: await this.readDates(userId, challengeKey),
    };
  }

  async findActive(userId: string): Promise<StoredCuratedHabitProgress | null> {
    const [row] = await db
      .select({ challengeKey: habitChallengeProgress.challengeKey })
      .from(habitChallengeProgress)
      .where(
        and(
          eq(habitChallengeProgress.userId, userId),
          eq(habitChallengeProgress.activeForOnboarding, true),
        ),
      )
      .limit(1);
    return row ? this.findProgress(userId, row.challengeKey) : null;
  }

  async recordCycle(
    userId: string,
    challengeKey: string,
    cycleDate: LocalDate,
    completedAt: Date,
  ): Promise<boolean> {
    const progress = await this.findProgress(userId, challengeKey);
    if (!progress?.active) return false;
    const inserted = await db
      .insert(habitRepetitions)
      .values({ userId, challengeKey, cycleDate, completedAt })
      .onConflictDoNothing()
      .returning({ id: habitRepetitions.id });
    return inserted.length === 1;
  }

  private async readDates(
    userId: string,
    challengeKey: string,
  ): Promise<LocalDate[]> {
    const rows = await db
      .select({ cycleDate: habitRepetitions.cycleDate })
      .from(habitRepetitions)
      .where(
        and(
          eq(habitRepetitions.userId, userId),
          eq(habitRepetitions.challengeKey, challengeKey),
        ),
      )
      .orderBy(habitRepetitions.cycleDate);
    return rows.map(({ cycleDate }) => cycleDate);
  }
}

let instance: PostgresCuratedHabitRepository | null = null;

export function createCuratedHabitRepository(): PostgresCuratedHabitRepository {
  if (!instance) instance = new PostgresCuratedHabitRepository();
  return instance;
}
