import { eq, sql } from "drizzle-orm";
import {
  addLocalDays,
  localDateAt,
} from "~/domain/habits/atomicSleepChallenge";
import { findSuiteUserId } from "~/e2e/testUtils/suiteAccount";
import { db } from "~/infra/dataAccess/db/connection";
import {
  habitChallengeProgress,
  habitLeagueOptIns,
  habitRepetitions,
} from "~/infra/dataAccess/db/schema/habits";

export async function deleteAtomicSleepChallengeTestData(): Promise<void> {
  const userId = await findSuiteUserId();
  await db
    .delete(habitLeagueOptIns)
    .where(eq(habitLeagueOptIns.userId, userId));
  await db
    .delete(habitChallengeProgress)
    .where(eq(habitChallengeProgress.userId, userId));
}

export async function backdateAtomicSleepChallengeForSevenDayTest(): Promise<
  string[]
> {
  const userId = await findSuiteUserId();
  const timezone = "America/Mexico_City";
  const today = localDateAt(new Date(), timezone);
  const startDate = addLocalDays(today, -4);
  const updated = await db
    .update(habitChallengeProgress)
    .set({
      timezone,
      periodStartDate: startDate,
      periodEndDate: addLocalDays(startDate, 7),
    })
    .where(eq(habitChallengeProgress.userId, userId))
    .returning({ userId: habitChallengeProgress.userId });
  if (updated.length !== 1) {
    throw new Error(
      "The E2E sleep challenge was not started before backdating it.",
    );
  }
  return Array.from({ length: 5 }, (_, index) =>
    addLocalDays(startDate, index),
  );
}

export async function countAtomicSleepRepetitions(): Promise<number> {
  const userId = await findSuiteUserId();
  const rows = await db
    .select({ id: habitRepetitions.id })
    .from(habitRepetitions)
    .where(eq(habitRepetitions.userId, userId));
  return rows.length;
}

export async function readHabitOnboardingTestState(): Promise<{
  active: number;
  progress: number;
}> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    SELECT
      count(*) FILTER (WHERE active_for_onboarding = true)::int AS active,
      count(*)::int AS progress
    FROM habit_challenge_progress
    WHERE user_id = ${userId}
  `);
  return result.rows[0] as { active: number; progress: number };
}
