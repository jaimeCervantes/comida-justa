import { PRACTICE_POST_KIND } from "~/domain/entities/post/kind";

export const PRACTICE_POST_REACTION_INTENTS = ["support", "withdraw"] as const;

export type PracticePostReactionIntent =
  (typeof PRACTICE_POST_REACTION_INTENTS)[number];

export type PracticePostReactionRejection =
  | "no-user"
  | "not-found"
  | "not-practice"
  | "invalid-intent";

export interface PracticePostReactionPost {
  id: string;
  kind: string | null;
}

export interface PracticePostReactionRequest {
  userId: string | null;
  post: PracticePostReactionPost | null;
  intent: string | null;
}

export function isPracticePostReactionIntent(
  value: unknown,
): value is PracticePostReactionIntent {
  return (
    typeof value === "string" &&
    (PRACTICE_POST_REACTION_INTENTS as readonly string[]).includes(value)
  );
}

export function rejectPracticePostReactionRequest({
  userId,
  post,
  intent,
}: PracticePostReactionRequest): PracticePostReactionRejection | null {
  if (!userId) return "no-user";
  if (!post) return "not-found";
  if (post.kind !== PRACTICE_POST_KIND) return "not-practice";
  if (!isPracticePostReactionIntent(intent)) return "invalid-intent";

  return null;
}
