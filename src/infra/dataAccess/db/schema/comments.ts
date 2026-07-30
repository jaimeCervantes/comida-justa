import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { posts } from "./posts";

export const comments = pgTable(
  "comments",
  {
    // Firestore document IDs are random strings (not UUIDs).
    // Use text to preserve them during migration.
    // New comments get crypto.randomUUID() in the repository.
    id: text("id").primaryKey(),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_comments_post_id_created_at").on(
      table.postId,
      table.createdAt.desc(),
    ),
  ],
);
