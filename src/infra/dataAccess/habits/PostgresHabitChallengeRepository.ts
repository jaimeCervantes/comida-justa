import { and, desc, eq, gte, inArray, isNull, lt, sql } from "drizzle-orm";
import {
  CURATED_CHALLENGE_KEYS,
  type CuratedChallengeKey,
  isCuratedChallengeKey,
} from "~/domain/habits/curatedChallenges";
import {
  type CommunityWeek,
  SLEEP_CHALLENGE_KEY,
} from "~/domain/habits/habitChallenge";
import {
  buildCommunityGarden,
  type CelebrationReactionIntent,
  type CommunityGarden,
  canPublishHabitCelebration,
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
  HabitCelebrationMilestone,
  HabitCelebrationQuery,
  HabitChallengeRepository,
  HabitChallengeSchedule,
  HabitCommunityRepository,
  PublicHabitCelebration,
  StoredHabitChallengeProgress,
} from "~/use_cases/habits/ports/HabitChallengeRepository";

const FIRST_CYCLE_MILESTONE: HabitCelebrationMilestone = "first_cycle";
const FINAL_MILESTONE: HabitCelebrationMilestone = "challenge_completed";

export default class PostgresHabitChallengeRepository
  implements
    HabitChallengeRepository,
    HabitCelebrationQuery,
    HabitCommunityRepository
{
  constructor(
    private readonly challengeKey: CuratedChallengeKey = SLEEP_CHALLENGE_KEY,
  ) {}

  /**
   * Guarda la ventana con la que se practica, tal como la resolvió el caso de uso.
   *
   * Escribía `coalesce(lo_guardado, lo_nuevo)`, así que la primera ventana era la única que llegaría
   * a existir y la práctica moría a los siete días. Quién puede mover una ventana y cuándo es una
   * regla de negocio: vive en `resolveOpenPeriod`, y aquí solo se escribe lo que esa regla decidió.
   */
  async start(userId: string, schedule: HabitChallengeSchedule): Promise<void> {
    await db
      .insert(habitChallengeProgress)
      .values({
        userId,
        challengeKey: this.challengeKey,
        timezone: schedule.timezone,
        periodStartDate: schedule.startDate,
        periodEndDate: schedule.endDate,
      })
      .onConflictDoUpdate({
        target: [
          habitChallengeProgress.userId,
          habitChallengeProgress.challengeKey,
        ],
        set: {
          timezone: schedule.timezone,
          periodStartDate: schedule.startDate,
          periodEndDate: schedule.endDate,
        },
      });
  }

  async findProgress(
    userId: string,
  ): Promise<StoredHabitChallengeProgress | null> {
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
    ): StoredHabitChallengeProgress["celebrationStatus"] => {
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
    const [summary] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(habitRepetitions)
      .where(
        and(
          eq(habitRepetitions.userId, userId),
          eq(habitRepetitions.challengeKey, this.challengeKey),
        ),
      );
    if (!canPublishHabitCelebration(summary?.count ?? 0, milestone))
      return false;

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

  async findRecentPublicCelebrations(
    limit: number,
    viewerId?: string | null,
  ): Promise<PublicHabitCelebration[]> {
    const rows = await db
      .select({
        id: habitCelebrations.id,
        displayName: users.name,
        username: users.username,
        image: users.image,
        publishedAt: habitCelebrations.publishedAt,
        milestone: habitCelebrations.milestone,
        challengeKey: habitCelebrations.challengeKey,
        reactionCount: sql<number>`(
          SELECT count(*)::int
          FROM ${habitCelebrationReactions}
          WHERE ${habitCelebrationReactions.celebrationId} = ${habitCelebrations.id}
        )`,
        viewerReacted: viewerId
          ? sql<boolean>`EXISTS (
              SELECT 1
              FROM ${habitCelebrationReactions}
              WHERE ${habitCelebrationReactions.celebrationId} = ${habitCelebrations.id}
                AND ${habitCelebrationReactions.userId} = ${viewerId}
            )`
          : sql<boolean>`false`,
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
      .limit(limit);

    return rows.flatMap((row): PublicHabitCelebration[] => {
      if (!isCuratedChallengeKey(row.challengeKey)) return [];
      return [
        {
          ...row,
          challengeKey: row.challengeKey,
          milestone:
            row.milestone === FINAL_MILESTONE
              ? FINAL_MILESTONE
              : FIRST_CYCLE_MILESTONE,
        },
      ];
    });
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

  /**
   * Los canteros cuentan toda la historia; el pulso, solo la semana que se le pase.
   *
   * Son dos consultas y no una con `FILTER` porque agrupan por cosas distintas: los canteros por
   * reto y el pulso por persona. `count(DISTINCT user_id)` sobre el mismo `GROUP BY challenge_key`
   * contaría a quien practica dos pilares dos veces.
   */
  async readCommunityGarden(week: CommunityWeek): Promise<CommunityGarden> {
    const sharedByThisUser = and(
      eq(habitChallengeProgress.userId, habitRepetitions.userId),
      eq(habitChallengeProgress.challengeKey, habitRepetitions.challengeKey),
    );

    const [rows, [pulse]] = await Promise.all([
      db
        .select({
          challengeKey: habitRepetitions.challengeKey,
          repetitions: sql<number>`count(*)::int`,
        })
        .from(habitRepetitions)
        .innerJoin(habitChallengeProgress, sharedByThisUser)
        .where(eq(habitChallengeProgress.gardenSharingEnabled, true))
        .groupBy(habitRepetitions.challengeKey),
      db
        .select({
          practitioners: sql<number>`count(DISTINCT ${habitRepetitions.userId})::int`,
        })
        .from(habitRepetitions)
        .innerJoin(habitChallengeProgress, sharedByThisUser)
        .where(
          and(
            eq(habitChallengeProgress.gardenSharingEnabled, true),
            gte(habitRepetitions.cycleDate, week.startDate),
            lt(habitRepetitions.cycleDate, week.endDate),
          ),
        ),
    ]);

    return buildCommunityGarden(rows, pulse?.practitioners ?? 0);
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

const challengeInstances = new Map<
  CuratedChallengeKey,
  PostgresHabitChallengeRepository
>();

export function createHabitChallengeRepository(
  challengeKey: CuratedChallengeKey,
): PostgresHabitChallengeRepository {
  const existing = challengeInstances.get(challengeKey);
  if (existing) return existing;
  const repository = new PostgresHabitChallengeRepository(challengeKey);
  challengeInstances.set(challengeKey, repository);
  return repository;
}

/**
 * El adaptador para lo que no pertenece a un reto concreto: el jardín, las celebraciones públicas de
 * los cuatro y sus reacciones. Es el de Sueño porque esas consultas ignoran la clave del reto, y
 * tener su propia instancia solo servía para mantener dos cachés de lo mismo.
 */
export function createHabitCommunityRepository(): PostgresHabitChallengeRepository {
  return createHabitChallengeRepository(SLEEP_CHALLENGE_KEY);
}
