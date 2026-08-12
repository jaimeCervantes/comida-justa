import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const habitChallengeProgress = pgTable(
  "habit_challenge_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeKey: text("challenge_key").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    firstCycleCompletedAt: timestamp("first_cycle_completed_at", {
      withTimezone: true,
    }),
    timezone: text("timezone"),
    periodStartDate: date("period_start_date"),
    periodEndDate: date("period_end_date"),
    finalCompletedAt: timestamp("final_completed_at", { withTimezone: true }),
    gardenSharingEnabled: boolean("garden_sharing_enabled")
      .notNull()
      .default(false),
    activeForOnboarding: boolean("active_for_onboarding")
      .notNull()
      .default(false),
  },
  (table) => [primaryKey({ columns: [table.userId, table.challengeKey] })],
);

export const habitCelebrations = pgTable(
  "habit_celebrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    challengeKey: text("challenge_key").notNull(),
    milestone: text("milestone").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.challengeKey],
      foreignColumns: [
        habitChallengeProgress.userId,
        habitChallengeProgress.challengeKey,
      ],
    }).onDelete("cascade"),
    uniqueIndex("uq_habit_celebrations_milestone").on(
      table.userId,
      table.challengeKey,
      table.milestone,
    ),
    check(
      "habit_celebrations_known_milestone",
      sql`${table.milestone} IN ('first_cycle', 'challenge_completed')`,
    ),
    index("ix_habit_celebrations_active")
      .on(table.publishedAt.desc(), table.id.desc())
      .where(sql`${table.withdrawnAt} IS NULL`),
  ],
);

export const habitRepetitions = pgTable(
  "habit_repetitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    challengeKey: text("challenge_key").notNull(),
    cycleDate: date("cycle_date").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.challengeKey],
      foreignColumns: [
        habitChallengeProgress.userId,
        habitChallengeProgress.challengeKey,
      ],
    }).onDelete("cascade"),
    uniqueIndex("uq_habit_repetitions_local_cycle").on(
      table.userId,
      table.challengeKey,
      table.cycleDate,
    ),
    index("ix_habit_repetitions_challenge_date").on(
      table.challengeKey,
      table.cycleDate,
    ),
  ],
);

export const habitCelebrationReactions = pgTable(
  "habit_celebration_reactions",
  {
    celebrationId: uuid("celebration_id")
      .notNull()
      .references(() => habitCelebrations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reactedAt: timestamp("reacted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.celebrationId, table.userId] })],
);

export const habitLeagueOptIns = pgTable("habit_league_opt_ins", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  optedInAt: timestamp("opted_in_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
});
