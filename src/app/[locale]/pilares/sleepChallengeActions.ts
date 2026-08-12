"use server";

import { revalidatePath } from "next/cache";
import type { SleepCycleInput } from "~/domain/habits/atomicSleepChallenge";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { pillarHref } from "~/i18n/routes";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createAtomicSleepChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import AtomicSleepChallengeUseCase, {
  type AtomicSleepProgress,
} from "~/use_cases/habits/atomicSleepChallengeUseCase";

export type AtomicSleepActionState = {
  status:
    | "idle"
    | "started"
    | "completed"
    | "shared"
    | "withdrawn"
    | "incomplete"
    | "recorded"
    | "comeback"
    | "final"
    | "duplicate"
    | "unavailable"
    | "garden-shared"
    | "garden-withdrawn";
  progress: AtomicSleepProgress | null;
  needsSignIn?: boolean;
};

function createUseCase(): AtomicSleepChallengeUseCase {
  return new AtomicSleepChallengeUseCase(
    createAtomicSleepChallengeRepository(),
  );
}

export async function manageAtomicSleepChallenge(
  previous: AtomicSleepActionState,
  formData: FormData,
): Promise<AtomicSleepActionState> {
  const userId = await readViewerId();
  if (!userId) return { ...previous, needsSignIn: true };

  const intent = String(formData.get("intent") ?? "");
  const challenge = createUseCase();

  if (intent === "start") {
    const timezone = String(formData.get("timezone") ?? "UTC");
    return {
      status: "started",
      progress: await challenge.start(userId, timezone),
    };
  }

  if (intent === "complete") {
    const input: SleepCycleInput = {
      nightPrepared: formData.get("cueCompleted") === "on",
      morningLight: formData.get("minimumCompleted") === "on",
    };
    const result = await challenge.completeCycle(userId, {
      ...input,
      cycleDate: String(formData.get("cycleDate") ?? ""),
    });
    if (!result.ok) {
      return {
        status: result.reason === "incomplete" ? "incomplete" : "unavailable",
        progress: await challenge.getProgress(userId),
      };
    }

    revalidateSleepPillar();
    return {
      status:
        result.recognition === "first"
          ? "completed"
          : result.recognition === "comeback"
            ? "comeback"
            : result.recognition === "final"
              ? "final"
              : result.recognition === "duplicate"
                ? "duplicate"
                : "recorded",
      progress: result.progress,
    };
  }

  if (intent === "share") {
    const milestone = String(formData.get("milestone") ?? "first_cycle");
    if (milestone === "challenge_completed") {
      await challenge.shareFinalCelebration(userId);
    } else {
      await challenge.shareFirstCelebration(userId);
    }
    revalidateHabitCelebration();
    return { status: "shared", progress: await challenge.getProgress(userId) };
  }

  if (intent === "withdraw") {
    const milestone = String(formData.get("milestone") ?? "first_cycle");
    if (milestone === "challenge_completed") {
      await challenge.withdrawFinalCelebration(userId);
    } else {
      await challenge.withdrawFirstCelebration(userId);
    }
    revalidateHabitCelebration();
    return {
      status: "withdrawn",
      progress: await challenge.getProgress(userId),
    };
  }

  if (intent === "garden-share" || intent === "garden-withdraw") {
    await challenge.setGardenSharing(userId, intent === "garden-share");
    revalidateLocalizedPath("/");
    revalidateSleepPillar();
    return {
      status: intent === "garden-share" ? "garden-shared" : "garden-withdrawn",
      progress: await challenge.getProgress(userId),
    };
  }

  return previous;
}

function revalidateHabitCelebration(): void {
  revalidateLocalizedPath("/");
  revalidateSleepPillar();
  revalidatePath("/", "layout");
}

function revalidateSleepPillar(): void {
  revalidateLocalizedPath(pillarHref("sueno"));
}
