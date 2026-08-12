"use server";

import { revalidatePath } from "next/cache";
import { findHabitChallengeExperience } from "~/domain/habits/habitChallengeExperiences";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { pillarHref } from "~/i18n/routes";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresAtomicSleepChallengeRepository";
import type { HabitChallengeActionState } from "~/presentation/habits/HabitChallengePanel";
import AtomicSleepChallengeUseCase from "~/use_cases/habits/atomicSleepChallengeUseCase";

export async function manageCuratedHabitChallenge(
  previous: HabitChallengeActionState,
  formData: FormData,
): Promise<HabitChallengeActionState> {
  const userId = await readViewerId();
  if (!userId) return { ...previous, needsSignIn: true };
  const experience = findHabitChallengeExperience(
    String(formData.get("challenge") ?? ""),
  );
  if (!experience || experience.experienceKey === "sleep") return previous;

  const useCase = new AtomicSleepChallengeUseCase(
    createHabitChallengeRepository(experience.challengeKey),
  );
  const path = pillarHref(experience.slug);
  const intent = String(formData.get("intent") ?? "");
  if (intent === "start") {
    return {
      status: "started",
      progress: await useCase.start(
        userId,
        String(formData.get("timezone") ?? "UTC"),
      ),
    };
  }
  if (intent === "complete") {
    const result = await useCase.completeCheckIn(userId, {
      minimumCompleted:
        formData.get("cueCompleted") === "on" &&
        formData.get("minimumCompleted") === "on",
      cycleDate: String(formData.get("cycleDate") ?? ""),
    });
    if (!result.ok) {
      return {
        status: result.reason === "incomplete" ? "incomplete" : "unavailable",
        progress: await useCase.getProgress(userId),
      };
    }
    revalidateExperience(path);
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
  const milestone =
    String(formData.get("milestone")) === "challenge_completed"
      ? "challenge_completed"
      : "first_cycle";
  if (intent === "share") {
    if (milestone === "challenge_completed") {
      await useCase.shareFinalCelebration(userId);
    } else {
      await useCase.shareFirstCelebration(userId);
    }
    revalidateExperience(path, true);
    return { status: "shared", progress: await useCase.getProgress(userId) };
  }
  if (intent === "withdraw") {
    if (milestone === "challenge_completed") {
      await useCase.withdrawFinalCelebration(userId);
    } else {
      await useCase.withdrawFirstCelebration(userId);
    }
    revalidateExperience(path, true);
    return { status: "withdrawn", progress: await useCase.getProgress(userId) };
  }
  if (intent === "garden-share" || intent === "garden-withdraw") {
    await useCase.setGardenSharing(userId, intent === "garden-share");
    revalidateExperience(path);
    return {
      status: intent === "garden-share" ? "garden-shared" : "garden-withdrawn",
      progress: await useCase.getProgress(userId),
    };
  }
  return previous;
}

function revalidateExperience(
  path: ReturnType<typeof pillarHref>,
  layout = false,
): void {
  revalidateLocalizedPath("/");
  revalidateLocalizedPath("/habitos");
  revalidateLocalizedPath(path);
  if (layout) revalidatePath("/", "layout");
}
