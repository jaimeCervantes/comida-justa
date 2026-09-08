import { and, eq, sql } from "drizzle-orm";
import {
  addLocalDays,
  COMMUNITY_TIMEZONE,
  currentCommunityWeek,
  localDateAt,
  SLEEP_CHALLENGE_KEY,
} from "~/domain/habits/habitChallenge";
import { findSuiteUserId } from "~/e2e/testUtils/suiteAccount";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  habitCelebrations,
  habitChallengeProgress,
  habitLeagueOptIns,
  habitRepetitions,
} from "~/infra/dataAccess/db/schema/habits";
import type { HabitCelebrationMilestone } from "~/use_cases/habits/ports/HabitChallengeRepository";

export async function deleteHabitChallengeTestData(): Promise<void> {
  const userId = await findSuiteUserId();
  await deletePracticeEvidencePostsForSuite();
  await db.execute(sql`DELETE FROM user_practices WHERE user_id = ${userId}`);
  await db
    .delete(habitLeagueOptIns)
    .where(eq(habitLeagueOptIns.userId, userId));
  await db
    .delete(habitChallengeProgress)
    .where(eq(habitChallengeProgress.userId, userId));
}

export async function deletePracticeEvidencePostsForSuite(): Promise<void> {
  const userId = await findSuiteUserId();
  await db.execute(sql`
    DELETE FROM posts p
    USING post_translations t
    WHERE t.post_id = p.id
      AND p.user_id = ${userId}
      AND p.kind = 'practica'
      AND t.slug LIKE 'practica-%'
  `);
}

export async function countPracticeEvidencePostsForSuite(
  practiceKey: string,
): Promise<number> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    SELECT count(DISTINCT p.id)::int AS total
    FROM posts p
    JOIN post_translations t ON t.post_id = p.id
    WHERE p.user_id = ${userId}
      AND p.kind = 'practica'
      AND t.slug LIKE ${`practica-${practiceKey}-%`}
  `);
  const row = result.rows[0] as { total?: number | string } | undefined;
  return Number(row?.total ?? 0);
}

export async function adoptPracticeForSuite(
  practiceKey: string,
  sharingEnabled = false,
): Promise<void> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    INSERT INTO user_practices (user_id, practice_id, source, sharing_enabled)
    SELECT ${userId}, p.id, 'web', ${sharingEnabled}
    FROM practices p
    WHERE p.key = ${practiceKey} AND p.status = 'published'
    ON CONFLICT (user_id, practice_id) DO UPDATE
      SET stopped_at = NULL,
          source = EXCLUDED.source,
          sharing_enabled = EXCLUDED.sharing_enabled
  `);
  if ((result.rowCount ?? 0) < 1) {
    throw new Error(`The E2E practice ${practiceKey} is not published.`);
  }
}

export type SuiteProfileUsernameLease = {
  username: string;
  restore(): Promise<void>;
};

export async function useSuiteProfileUsername(
  username = "e2e-practicas-ana",
): Promise<SuiteProfileUsernameLease> {
  const userId = await findSuiteUserId();
  const [suiteUser] = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await db.execute(sql`
    UPDATE users SET username = NULL
    WHERE username = ${username} AND id <> ${userId}
  `);
  await db.update(users).set({ username }).where(eq(users.id, userId));

  return {
    username,
    async restore(): Promise<void> {
      await db
        .update(users)
        .set({ username: suiteUser?.username ?? null })
        .where(eq(users.id, userId));
    },
  };
}

export async function readPracticeSharingForSuite(
  practiceKey: string,
): Promise<boolean> {
  const userId = await findSuiteUserId();
  const result = await db.execute(sql`
    SELECT up.sharing_enabled
    FROM user_practices up
    JOIN practices p ON p.id = up.practice_id
    WHERE up.user_id = ${userId} AND p.key = ${practiceKey}
  `);
  const row = result.rows[0] as { sharing_enabled: boolean } | undefined;
  if (!row) {
    throw new Error(`The E2E practice ${practiceKey} was not adopted.`);
  }
  return row.sharing_enabled;
}

export async function seedTodaySleepRepetition(): Promise<void> {
  const userId = await findSuiteUserId();
  const today = localDateAt(new Date(), COMMUNITY_TIMEZONE);
  const week = currentCommunityWeek(new Date());

  await db
    .insert(habitChallengeProgress)
    .values({
      userId,
      challengeKey: SLEEP_CHALLENGE_KEY,
      timezone: COMMUNITY_TIMEZONE,
      periodStartDate: week.startDate,
      periodEndDate: week.endDate,
    })
    .onConflictDoUpdate({
      target: [
        habitChallengeProgress.userId,
        habitChallengeProgress.challengeKey,
      ],
      set: {
        timezone: COMMUNITY_TIMEZONE,
        periodStartDate: week.startDate,
        periodEndDate: week.endDate,
      },
    });

  await db
    .insert(habitRepetitions)
    .values({ userId, challengeKey: SLEEP_CHALLENGE_KEY, cycleDate: today })
    .onConflictDoNothing();
}

export async function seedPublicCelebrationForSuite(
  challengeKey: string = SLEEP_CHALLENGE_KEY,
): Promise<void> {
  const userId = await findSuiteUserId();
  await seedTodaySleepRepetition();

  await db
    .insert(habitCelebrations)
    .values({
      userId,
      challengeKey,
      milestone: "first_cycle",
      publishedAt: new Date(),
      withdrawnAt: null,
    })
    .onConflictDoUpdate({
      target: [
        habitCelebrations.userId,
        habitCelebrations.challengeKey,
        habitCelebrations.milestone,
      ],
      set: { publishedAt: new Date(), withdrawnAt: null },
    });
}

export async function seedSharedGardenPulseForSuite(): Promise<void> {
  const userId = await findSuiteUserId();
  await seedTodaySleepRepetition();

  await db
    .update(habitChallengeProgress)
    .set({ gardenSharingEnabled: true })
    .where(
      and(
        eq(habitChallengeProgress.userId, userId),
        eq(habitChallengeProgress.challengeKey, SLEEP_CHALLENGE_KEY),
      ),
    );
}

export async function countWeeklyGardenPractitioners(): Promise<number> {
  const week = currentCommunityWeek(new Date());
  const result = await db.execute(sql`
    SELECT count(DISTINCT r.user_id)::int AS practitioners
    FROM habit_repetitions r
    JOIN habit_challenge_progress p
      ON p.user_id = r.user_id
      AND p.challenge_key = r.challenge_key
    WHERE p.garden_sharing_enabled = true
      AND r.cycle_date >= ${week.startDate}
      AND r.cycle_date < ${week.endDate}
  `);
  const row = result.rows[0] as { practitioners?: number | string } | undefined;
  return Number(row?.practitioners ?? 0);
}

/**
 * Retrasa la ventana de siete días de UN ritual para poder registrar cinco fechas seguidas.
 *
 * El reto entra por parámetro desde que los cuatro pueden estar iniciados a la vez: antes esto
 * tocaba siempre el de Sueño, así que los escenarios de Alimentación, Movimiento y Mente pedían
 * retrasar una ventana que nunca habían abierto y morían en la comprobación de abajo.
 */
export async function backdateHabitChallengeForSevenDayTest(
  challengeKey: string = SLEEP_CHALLENGE_KEY,
): Promise<string[]> {
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
        eq(habitChallengeProgress.challengeKey, challengeKey),
      ),
    )
    .returning({ userId: habitChallengeProgress.userId });
  if (updated.length !== 1) {
    throw new Error(
      `The E2E ritual ${challengeKey} was not started before backdating it.`,
    );
  }
  return Array.from({ length: 5 }, (_, index) =>
    addLocalDays(startDate, index),
  );
}

/**
 * Cierra la ventana de un ritual dejándola dos semanas atrás.
 *
 * Es el estado en el que estaban las nueve inscripciones reales el 23 de agosto de 2026: una semana
 * guardada que ya venció y ninguna forma de registrar nada. No se puede llegar a él esperando, así
 * que se escribe.
 */
export async function closeHabitChallengeWindow(
  challengeKey: string = SLEEP_CHALLENGE_KEY,
): Promise<{ startDate: string; endDate: string }> {
  const userId = await findSuiteUserId();
  const timezone = "America/Mexico_City";
  const startDate = addLocalDays(localDateAt(new Date(), timezone), -14);
  const endDate = addLocalDays(startDate, 7);
  const updated = await db
    .update(habitChallengeProgress)
    .set({ timezone, periodStartDate: startDate, periodEndDate: endDate })
    .where(
      and(
        eq(habitChallengeProgress.userId, userId),
        eq(habitChallengeProgress.challengeKey, challengeKey),
      ),
    )
    .returning({ userId: habitChallengeProgress.userId });
  if (updated.length !== 1) {
    throw new Error(
      `The E2E ritual ${challengeKey} was not started before closing its window.`,
    );
  }
  return { startDate, endDate };
}

/**
 * Siembra una repetición en la **semana anterior** de la comunidad y devuelve su fecha.
 *
 * Se escribe en la base y no por la pantalla porque **por la pantalla es imposible**, a propósito: la
 * semana anterior siempre está cerrada, y desde el slice 1 una ventana cerrada no acepta fechas. Es
 * la única forma de montar a alguien que practicó dos semanas distintas.
 *
 * Retrasar la ventana unos días tampoco sirve: si hoy es domingo, cuatro días atrás sigue siendo la
 * misma semana. El lunes anterior sale de `currentCommunityWeek`, así que cae en otra semana
 * cualquier día que se corra la prueba.
 */
export async function seedRepetitionInPreviousWeek(
  challengeKey: string = SLEEP_CHALLENGE_KEY,
): Promise<string> {
  const userId = await findSuiteUserId();
  const cycleDate = addLocalDays(
    currentCommunityWeek(new Date()).startDate,
    -7,
  );
  const inserted = await db
    .insert(habitRepetitions)
    .values({ userId, challengeKey, cycleDate })
    .onConflictDoNothing()
    .returning({ id: habitRepetitions.id });
  if (inserted.length !== 1) {
    throw new Error(
      `The E2E ritual ${challengeKey} was not started before seeding last week.`,
    );
  }
  return cycleDate;
}

export async function readHabitChallengeWindow(
  challengeKey: string = SLEEP_CHALLENGE_KEY,
): Promise<{ startDate: string | null; endDate: string | null }> {
  const userId = await findSuiteUserId();
  const [row] = await db
    .select({
      startDate: habitChallengeProgress.periodStartDate,
      endDate: habitChallengeProgress.periodEndDate,
    })
    .from(habitChallengeProgress)
    .where(
      and(
        eq(habitChallengeProgress.userId, userId),
        eq(habitChallengeProgress.challengeKey, challengeKey),
      ),
    )
    .limit(1);
  if (!row)
    throw new Error(`The E2E ritual ${challengeKey} was never started.`);
  return row;
}

export async function countSleepRepetitions(): Promise<number> {
  const userId = await findSuiteUserId();
  const rows = await db
    .select({ id: habitRepetitions.id })
    .from(habitRepetitions)
    .where(
      and(
        eq(habitRepetitions.userId, userId),
        eq(habitRepetitions.challengeKey, SLEEP_CHALLENGE_KEY),
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
