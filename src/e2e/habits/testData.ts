import { and, eq } from "drizzle-orm";
import {
  ATOMIC_SLEEP_CHALLENGE_KEY,
  addLocalDays,
  localDateAt,
} from "~/domain/habits/atomicSleepChallenge";
import { findSuiteUserId } from "~/e2e/testUtils/suiteAccount";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  habitChallengeProgress,
  habitLeagueOptIns,
  habitRepetitions,
} from "~/infra/dataAccess/db/schema/habits";
import type { HabitCelebrationMilestone } from "~/use_cases/habits/ports/AtomicSleepChallengeRepository";

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
    .where(
      and(
        eq(habitChallengeProgress.userId, userId),
        eq(habitChallengeProgress.challengeKey, ATOMIC_SLEEP_CHALLENGE_KEY),
      ),
    )
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
    .where(
      and(
        eq(habitRepetitions.userId, userId),
        eq(habitRepetitions.challengeKey, ATOMIC_SLEEP_CHALLENGE_KEY),
      ),
    );
  return rows.length;
}

export async function readSuiteAccountDisplayName(): Promise<string> {
  const userId = await findSuiteUserId();
  const [suiteUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!suiteUser?.name) {
    throw new Error("The E2E suite account needs a display name.");
  }
  return suiteUser.name;
}

export async function countStartedHabitRituals(): Promise<number> {
  const userId = await findSuiteUserId();
  const rows = await db
    .select({ challengeKey: habitChallengeProgress.challengeKey })
    .from(habitChallengeProgress)
    .where(eq(habitChallengeProgress.userId, userId));
  return rows.length;
}

export async function clearHabitMilestoneMarker(
  challengeKey: string,
  milestone: HabitCelebrationMilestone,
): Promise<void> {
  const userId = await findSuiteUserId();
  await db
    .update(habitChallengeProgress)
    .set(
      milestone === "first_cycle"
        ? { firstCycleCompletedAt: null }
        : { finalCompletedAt: null },
    )
    .where(
      and(
        eq(habitChallengeProgress.userId, userId),
        eq(habitChallengeProgress.challengeKey, challengeKey),
      ),
    );
}
