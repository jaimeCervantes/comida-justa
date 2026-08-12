"use server";

import { revalidatePath } from "next/cache";
import type { CycleRecognition } from "~/domain/habits/habitChallenge";
import { findHabitChallengeExperience } from "~/domain/habits/habitChallengeExperiences";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { pillarHref } from "~/i18n/routes";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";
import type {
  HabitChallengeActionState,
  HabitChallengeStatus,
} from "~/presentation/habits/habitChallengeAction";
import HabitChallengeUseCase from "~/use_cases/habits/habitChallengeUseCase";
import type { HabitCelebrationMilestone } from "~/use_cases/habits/ports/HabitChallengeRepository";

/**
 * La única acción de los cuatro rituales.
 *
 * Antes había dos casi idénticas —una para Sueño, otra para los otros tres— y la diferencia real
 * era ninguna: el panel manda siempre `challenge`, las dos anclas viajan en los mismos campos y las
 * dos revalidaban casi las mismas rutas. Mantenerlas separadas significaba arreglar cada cosa dos
 * veces, y ya habían empezado a divergir (solo una revalidaba `/habitos`).
 *
 * El pilar sale del formulario, no de la ruta: así la misma acción sirve a `/pilares/<lo-que-sea>`
 * sin que la página tenga que atarse a un reto concreto.
 */
const STATUS_BY_RECOGNITION = {
  first: "completed",
  comeback: "comeback",
  final: "final",
  duplicate: "duplicate",
  repeat: "recorded",
} as const satisfies Record<CycleRecognition, HabitChallengeStatus>;

export async function manageHabitChallenge(
  previous: HabitChallengeActionState,
  formData: FormData,
): Promise<HabitChallengeActionState> {
  const userId = await readViewerId();
  if (!userId) return { ...previous, needsSignIn: true };

  const experience = findHabitChallengeExperience(
    String(formData.get("challenge") ?? ""),
  );
  if (!experience) return previous;

  const useCase = new HabitChallengeUseCase(
    createHabitChallengeRepository(experience.challengeKey),
  );
  const pillarPath = pillarHref(experience.slug);
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
      cueCompleted: formData.get("cueCompleted") === "on",
      minimumCompleted: formData.get("minimumCompleted") === "on",
      cycleDate: String(formData.get("cycleDate") ?? ""),
    });
    if (!result.ok) {
      return {
        status: result.reason === "incomplete" ? "incomplete" : "unavailable",
        progress: await useCase.getProgress(userId),
      };
    }
    revalidatePillarSurfaces(pillarPath);
    return {
      status: STATUS_BY_RECOGNITION[result.recognition],
      progress: result.progress,
    };
  }

  if (intent === "share" || intent === "withdraw") {
    const milestone: HabitCelebrationMilestone =
      String(formData.get("milestone")) === "challenge_completed"
        ? "challenge_completed"
        : "first_cycle";
    if (intent === "share") await useCase.shareCelebration(userId, milestone);
    else await useCase.withdrawCelebration(userId, milestone);
    /* La celebración también se asoma en el mensaje del sitio, que vive en el layout. */
    revalidatePillarSurfaces(pillarPath, { layout: true });
    return {
      status: intent === "share" ? "shared" : "withdrawn",
      progress: await useCase.getProgress(userId),
    };
  }

  if (intent === "garden-share" || intent === "garden-withdraw") {
    await useCase.setGardenSharing(userId, intent === "garden-share");
    revalidatePillarSurfaces(pillarPath);
    return {
      status: intent === "garden-share" ? "garden-shared" : "garden-withdrawn",
      progress: await useCase.getProgress(userId),
    };
  }

  return previous;
}

function revalidatePillarSurfaces(
  pillarPath: ReturnType<typeof pillarHref>,
  { layout = false }: { layout?: boolean } = {},
): void {
  revalidateLocalizedPath("/");
  revalidateLocalizedPath("/habitos");
  revalidateLocalizedPath(pillarPath);
  if (layout) revalidatePath("/", "layout");
}
