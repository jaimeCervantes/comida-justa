export const POST_REACTION_INTENTS = ["support", "withdraw"] as const;

export type PostReactionIntent = (typeof POST_REACTION_INTENTS)[number];

export type PostReactionRejection = "no-user" | "not-found" | "invalid-intent";

export interface PostReactionPost {
  id: string;
  kind: string | null;
}

export interface PostReactionRequest {
  userId: string | null;
  post: PostReactionPost | null;
  intent: string | null;
}

export function isPostReactionIntent(
  value: unknown,
): value is PostReactionIntent {
  return (
    typeof value === "string" &&
    (POST_REACTION_INTENTS as readonly string[]).includes(value)
  );
}

export function rejectPostReactionRequest({
  userId,
  post,
  intent,
}: PostReactionRequest): PostReactionRejection | null {
  if (!userId) return "no-user";
  if (!post) return "not-found";
  if (!isPostReactionIntent(intent)) return "invalid-intent";

  return null;
}
