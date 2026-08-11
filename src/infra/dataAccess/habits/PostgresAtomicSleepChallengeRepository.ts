import { and, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { ATOMIC_SLEEP_CHALLENGE_KEY } from "~/domain/habits/atomicSleepChallenge";
import {
  CURATED_CHALLENGE_KEYS,
  type CuratedChallengeKey,
  isCuratedChallengeKey,
} from "~/domain/habits/curatedChallenges";
import {
  buildCommunityGarden,
  type CelebrationReactionIntent,
  type CommunityGarden,
} from "~/domain/habits/habitCommunity";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  habitCelebrationReactions,
  habitCelebrations,
  habitChallengeProgress,
  habitRepetitions,
} from "~/infra/dataAccess/db/schema/habits";
import type {
  AtomicSleepCelebrationQuery,
  AtomicSleepChallengeRepository,
  HabitCelebrationMilestone,
  HabitChallengeSchedule,
  HabitCommunityRepository,
  PublicFirstCycleCelebration,
  StoredAtomicSleepProgress,
} from "~/use_cases/habits/ports/AtomicSleepChallengeRepository";

const FIRST_CYCLE_MILESTONE: HabitCelebrationMilestone = "first_cycle";
const FINAL_MILESTONE: HabitCelebrationMilestone = "challenge_completed";

export default class PostgresAtomicSleepChallengeRepository
  implements
    AtomicSleepChallengeRepository,
    AtomicSleepCelebrationQuery,
    HabitCommunityRepository
{
  constructor(
    private readonly challengeKey: CuratedChallengeKey = ATOMIC_SLEEP_CHALLENGE_KEY,
  ) {}

  async start(userId: string, schedule: HabitChallengeSchedule): Promise<void> {
    await db.transaction(async (transaction): Promise<void> => {
      await transaction
        .update(habitChallengeProgress)
        .set({ activeForOnboarding: false })
        .where(eq(habitChallengeProgress.userId, userId));
      await transaction
        .insert(habitChallengeProgress)
        .values({
          userId,
          challengeKey: this.challengeKey,
          timezone: schedule.timezone,
          periodStartDate: schedule.startDate,
          periodEndDate: schedule.endDate,
          activeForOnboarding: true,
        })
        .onConflictDoUpdate({
          target: [
            habitChallengeProgress.userId,
            habitChallengeProgress.challengeKey,
          ],
          set: {
            timezone: sql`coalesce(${habitChallengeProgress.timezone}, ${schedule.timezone})`,
            periodStartDate: sql`coalesce(${habitChallengeProgress.periodStartDate}, ${schedule.startDate})`,
            periodEndDate: sql`coalesce(${habitChallengeProgress.periodEndDate}, ${schedule.endDate})`,
            activeForOnboarding: true,
          },
        });
    });
  }

  async findProgress(
    userId: string,
  ): Promise<StoredAtomicSleepProgress | null> {
    const [row] = await db
      .select({
        userId: habitChallengeProgress.userId,
        challengeKey: habitChallengeProgress.challengeKey,
        startedAt: habitChallengeProgress.startedAt,
        timezone: habitChallengeProgress.timezone,
        startDate: habitChallengeProgress.periodStartDate,
        endDate: habitChallengeProgress.periodEndDate,
        firstCycleCompletedAt: habitChallengeProgress.firstCycleCompletedAt,
        finalCompletedAt: habitChallengeProgress.finalCompletedAt,
        gardenSharingEnabled: habitChallengeProgress.gardenSharingEnabled,
        activeForOnboarding: habitChallengeProgress.activeForOnboarding,
      })
      .from(habitChallengeProgress)
      .where(
        and(
          eq(habitChallengeProgress.userId, userId),
          eq(habitChallengeProgress.challengeKey, this.challengeKey),
        ),
      )
      .limit(1);

    if (!row) return null;

    const [repetitions, celebrations] = await Promise.all([
      db
        .select({ cycleDate: habitRepetitions.cycleDate })
        .from(habitRepetitions)
        .where(
          and(
            eq(habitRepetitions.userId, userId),
            eq(habitRepetitions.challengeKey, this.challengeKey),
          ),
        )
        .orderBy(habitRepetitions.cycleDate),
      db
        .select({
          milestone: habitCelebrations.milestone,
          withdrawnAt: habitCelebrations.withdrawnAt,
        })
        .from(habitCelebrations)
        .where(
          and(
            eq(habitCelebrations.userId, userId),
            eq(habitCelebrations.challengeKey, this.challengeKey),
          ),
        ),
    ]);
    const celebrationStatus = (
      milestone: HabitCelebrationMilestone,
    ): StoredAtomicSleepProgress["celebrationStatus"] => {
      const celebration = celebrations.find(
        (candidate) => candidate.milestone === milestone,
      );
      return !celebration
        ? "absent"
        : celebration.withdrawnAt
          ? "withdrawn"
          : "active";
    };

    return {
      ...row,
      completedDates: repetitions.map((item) => item.cycleDate),
      celebrationStatus: celebrationStatus(FIRST_CYCLE_MILESTONE),
      finalCelebrationStatus: celebrationStatus(FINAL_MILESTONE),
    };
  }

  async recordCycle(
    userId: string,
    cycleDate: string,
    completedAt: Date,
  ): Promise<boolean> {
    return db.transaction(async (transaction): Promise<boolean> => {
      const inserted = await transaction
        .insert(habitRepetitions)
        .values({
          userId,
          challengeKey: this.challengeKey,
          cycleDate,
          completedAt,
        })
        .onConflictDoNothing()
        .returning({ id: habitRepetitions.id });
      if (inserted.length === 0) return false;

      const [summary] = await transaction
        .select({ count: sql<number>`count(*)::int` })
        .from(habitRepetitions)
        .where(
          and(
            eq(habitRepetitions.userId, userId),
            eq(habitRepetitions.challengeKey, this.challengeKey),
          ),
        );
      await transaction
        .update(habitChallengeProgress)
        .set({
          firstCycleCompletedAt: sql`coalesce(${habitChallengeProgress.firstCycleCompletedAt}, ${completedAt})`,
          ...((summary?.count ?? 0) >= 5
            ? {
                finalCompletedAt: sql`coalesce(${habitChallengeProgress.finalCompletedAt}, ${completedAt})`,
              }
            : {}),
        })
        .where(
          and(
            eq(habitChallengeProgress.userId, userId),
            eq(habitChallengeProgress.challengeKey, this.challengeKey),
          ),
        );
      return true;
    });
  }

  async publishCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<boolean> {
    const completionColumn =
      milestone === FIRST_CYCLE_MILESTONE
        ? habitChallengeProgress.firstCycleCompletedAt
        : habitChallengeProgress.finalCompletedAt;
    const completed = await db
      .select({ userId: habitChallengeProgress.userId })
      .from(habitChallengeProgress)
      .where(
        and(
          eq(habitChallengeProgress.userId, userId),
          eq(habitChallengeProgress.challengeKey, this.challengeKey),
          isNotNull(completionColumn),
        ),
      )
      .limit(1);
    if (completed.length === 0) return false;

    await db
      .insert(habitCelebrations)
      .values({
        userId,
        challengeKey: this.challengeKey,
        milestone,
      })
      .onConflictDoUpdate({
        target: [
          habitCelebrations.userId,
          habitCelebrations.challengeKey,
          habitCelebrations.milestone,
        ],
        set: { publishedAt: new Date(), withdrawnAt: null },
      });

    return true;
  }

  async withdrawCelebration(
    userId: string,
    milestone: HabitCelebrationMilestone,
  ): Promise<void> {
    await db
      .update(habitCelebrations)
      .set({ withdrawnAt: new Date() })
      .where(
        and(
          eq(habitCelebrations.userId, userId),
          eq(habitCelebrations.challengeKey, this.challengeKey),
          eq(habitCelebrations.milestone, milestone),
          isNull(habitCelebrations.withdrawnAt),
        ),
      );
  }

  async findLatestPublicCelebration(
    viewerId?: string | null,
  ): Promise<PublicFirstCycleCelebration | null> {
    const [row] = await db
      .select({
        id: habitCelebrations.id,
        displayName: users.name,
        username: users.username,
        image: users.image,
        publishedAt: habitCelebrations.publishedAt,
        milestone: habitCelebrations.milestone,
        challengeKey: habitCelebrations.challengeKey,
      })
      .from(habitCelebrations)
      .innerJoin(users, eq(users.id, habitCelebrations.userId))
      .where(
        and(
          inArray(habitCelebrations.challengeKey, [...CURATED_CHALLENGE_KEYS]),
          isNull(habitCelebrations.withdrawnAt),
        ),
      )
      .orderBy(desc(habitCelebrations.publishedAt), desc(habitCelebrations.id))
      .limit(1);

    if (!row || !isCuratedChallengeKey(row.challengeKey)) return null;
    const challengeKey = row.challengeKey;
    const [reactionSummary, viewerReaction] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(habitCelebrationReactions)
        .where(eq(habitCelebrationReactions.celebrationId, row.id)),
      viewerId
        ? db
            .select({ userId: habitCelebrationReactions.userId })
            .from(habitCelebrationReactions)
            .where(
              and(
                eq(habitCelebrationReactions.celebrationId, row.id),
                eq(habitCelebrationReactions.userId, viewerId),
              ),
            )
            .limit(1)
        : Promise.resolve([]),
    ]);
    return {
      ...row,
      challengeKey,
      milestone:
        row.milestone === FINAL_MILESTONE
          ? FINAL_MILESTONE
          : FIRST_CYCLE_MILESTONE,
      reactionCount: reactionSummary[0]?.count ?? 0,
      viewerReacted: viewerReaction.length === 1,
    };
  }

  async setGardenSharing(userId: string, enabled: boolean): Promise<void> {
    await db
      .update(habitChallengeProgress)
      .set({ gardenSharingEnabled: enabled })
      .where(
        and(
          eq(habitChallengeProgress.userId, userId),
          eq(habitChallengeProgress.challengeKey, this.challengeKey),
        ),
      );
  }

  async readCommunityGarden(): Promise<CommunityGarden> {
    const rows = await db
      .select({
        challengeKey: habitRepetitions.challengeKey,
        repetitions: sql<number>`count(*)::int`,
      })
      .from(habitRepetitions)
      .innerJoin(
        habitChallengeProgress,
        and(
          eq(habitChallengeProgress.userId, habitRepetitions.userId),
          eq(
            habitChallengeProgress.challengeKey,
            habitRepetitions.challengeKey,
          ),
        ),
      )
      .where(eq(habitChallengeProgress.gardenSharingEnabled, true))
      .groupBy(habitRepetitions.challengeKey);
    return buildCommunityGarden(rows);
  }

  async setCelebrationReaction(
    userId: string,
    celebrationId: string,
    intent: CelebrationReactionIntent,
  ): Promise<void> {
    if (intent === "celebrate") {
      await db
        .insert(habitCelebrationReactions)
        .values({ userId, celebrationId })
        .onConflictDoNothing();
      return;
    }
    await db
      .delete(habitCelebrationReactions)
      .where(
        and(
          eq(habitCelebrationReactions.userId, userId),
          eq(habitCelebrationReactions.celebrationId, celebrationId),
        ),
      );
  }
}

let instance: PostgresAtomicSleepChallengeRepository | null = null;
const challengeInstances = new Map<
  CuratedChallengeKey,
  PostgresAtomicSleepChallengeRepository
>();

export function createAtomicSleepChallengeRepository(): PostgresAtomicSleepChallengeRepository {
  if (!instance) instance = new PostgresAtomicSleepChallengeRepository();
  return instance;
}

export function createHabitChallengeRepository(
  challengeKey: CuratedChallengeKey,
): PostgresAtomicSleepChallengeRepository {
  const existing = challengeInstances.get(challengeKey);
  if (existing) return existing;
  const repository = new PostgresAtomicSleepChallengeRepository(challengeKey);
  challengeInstances.set(challengeKey, repository);
  return repository;
}
