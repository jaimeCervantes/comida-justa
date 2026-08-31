import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { posts } from "./posts";

/**
 * Espejo del esquema que administra Alembic en el backend Python. `moderation_status`,
 * `moderation_reason` y `moderation_reviewed_at` los crea la migración que añadió también
 * `comment_reports`, calcada de `posts.moderation_status` (`0040_2026_08_16`): mismo `CHECK`,
 * mismo valor por omisión.
 */
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
    /**
     * `published` | `in_review` | `rejected`, con el mismo `CHECK` que `posts`. Por omisión
     * `published`: un comentario nace visible y el clasificador lo revisa después.
     */
    moderationStatus: text("moderation_status").notNull().default("published"),
    /** Código de `MODERATION_REASONS` (de `~/domain/entities/post/moderation`), nunca prosa. */
    moderationReason: text("moderation_reason"),
    moderationReviewedAt: timestamp("moderation_reviewed_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    index("idx_comments_post_id_created_at").on(
      table.postId,
      table.createdAt.desc(),
    ),
    /* Parcial en la base sobre `<> 'published'`: sirve al panel de moderación, no al hilo. Drizzle
       solo espeja su existencia; la definición real vive en la migración de Alembic. */
    index("ix_comments_moderation_pending").on(table.moderationStatus),
  ],
);

/**
 * Las denuncias de la comunidad sobre un comentario. Mismo diseño que `postReports`: denunciar
 * avisa, no oculta, y el número solo significa algo porque `UNIQUE(comment_id, user_id)` impide
 * contar dos veces a la misma persona.
 */
export const commentReports = pgTable(
  "comment_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    commentId: text("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ix_comment_reports_comment_id").on(table.commentId),
    unique("comment_reports_one_per_person").on(table.commentId, table.userId),
  ],
);
