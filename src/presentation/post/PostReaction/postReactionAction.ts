"use server";

import { revalidatePath } from "next/cache";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createPostReactionRepository } from "~/infra/dataAccess/postReactions/PostgresPostReactionRepository";
import SetPostReactionUseCase from "~/use_cases/postReactions/setPostReactionUseCase";

export interface PostReactionActionState {
  reacted: boolean;
  reactions: number;
  needsSignIn?: boolean;
}

function revalidateReactionPath(path: string): void {
  if (!path) return;

  if (path.includes("[")) {
    revalidatePath(path, "page");
    return;
  }

  revalidatePath(path);
}

export async function setPostReaction(
  previous: PostReactionActionState,
  formData: FormData,
): Promise<PostReactionActionState> {
  const userId = await readViewerId();
  if (!userId) return { ...previous, needsSignIn: true };

  const postId = String(formData.get("postId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const path = String(formData.get("path") ?? "");
  const result = await new SetPostReactionUseCase(
    createPostReactionRepository(),
  ).execute({ userId, postId, intent });

  if (!result.ok) return previous;
  revalidateReactionPath(path);

  return { reacted: result.reacted, reactions: result.reactions };
}
