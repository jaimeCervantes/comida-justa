"use server";

import { revalidatePath } from "next/cache";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createPracticePostReactionRepository } from "~/infra/dataAccess/practicePostReactions/PostgresPracticePostReactionRepository";
import SetPracticePostReactionUseCase from "~/use_cases/practicePostReactions/setPracticePostReactionUseCase";

export interface PracticePostReactionActionState {
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

export async function setPracticePostReaction(
  previous: PracticePostReactionActionState,
  formData: FormData,
): Promise<PracticePostReactionActionState> {
  const userId = await readViewerId();
  if (!userId) return { ...previous, needsSignIn: true };

  const postId = String(formData.get("postId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  const path = String(formData.get("path") ?? "");
  const result = await new SetPracticePostReactionUseCase(
    createPracticePostReactionRepository(),
  ).execute({ userId, postId, intent });

  if (!result.ok) return previous;
  revalidateReactionPath(path);

  return { reacted: result.reacted, reactions: result.reactions };
}
