"use server";

import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function setHabitCelebrationReaction(
  formData: FormData,
): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;
  const celebrationId = String(formData.get("celebrationId") ?? "");
  const intent = String(formData.get("intent") ?? "");
  if (!UUID_PATTERN.test(celebrationId)) return;
  if (intent !== "celebrate" && intent !== "withdraw") return;

  await createAtomicSleepChallengeRepository().setCelebrationReaction(
    userId,
    celebrationId,
    intent,
  );
  revalidateLocalizedPath("/");
}
