"use server";

import { CHALLENGE_KEY_BY_PILLAR } from "~/app/[locale]/pilares/components/pilaresData";
import {
  COMMUNITY_TIMEZONE,
  localDateAt,
} from "~/domain/habits/habitChallenge";
import { HABIT_CHALLENGE_EXPERIENCES } from "~/domain/habits/habitChallengeExperiences";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";
import { PostgresPracticeAdoption } from "~/infra/dataAccess/practices/PostgresPracticeAdoption";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import HabitChallengeUseCase from "~/use_cases/habits/habitChallengeUseCase";
import PracticeAdoptionUseCase from "~/use_cases/practices/practiceAdoptionUseCase";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";

/**
 * Empezar o dejar una práctica del catálogo.
 *
 * **Sin sesión no hace nada y no explota.** Ocultar el botón es cortesía; quien decide es el
 * servidor, que resuelve la identidad de la sesión y nunca del formulario — la misma regla que
 * siguen el reto atómico y la tabla del jardín.
 *
 * La clave viaja en el formulario, pero el repositorio sólo la acepta si existe y está publicada,
 * así que mandarla a mano no inscribe a nadie en nada.
 */
export async function manageOwnPractice(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") return;

  const useCase = new PracticeAdoptionUseCase(new PostgresPracticeAdoption());
  if (formData.get("intent") === "stop") {
    await useCase.stop(userId, practiceKey);
  } else {
    await useCase.start(userId, practiceKey, "web");
  }

  revalidateLocalizedPath("/practicas");
}

/**
 * Marcar que hoy se practicó.
 *
 * **La unidad de conteo es el pilar y el día, no la práctica.** Marcar *Penumbra total* es haber
 * practicado el descanso, así que la repetición se escribe en `habit_repetitions` con el reto del
 * pilar, y su índice único por persona, reto y fecha hace el resto: marcar doce prácticas un martes
 * sigue siendo un día. Sin esa regla, la tabla del jardín premiaría a quien marca más casillas.
 *
 * El pilar se resuelve **contra la base** y no contra el formulario: quien manda la clave no decide
 * a qué pilar apunta su repetición.
 *
 * `start` va antes y es idempotente: abre la ventana de la semana si estaba cerrada y respeta la que
 * siga abierta. Marcar una práctica del descanso inscribe a esa persona en el ritual del descanso, y
 * es a propósito — el ritual es la práctica insignia del pilar, y es lo que el jardín ya mide.
 *
 * La zona horaria es la de la comunidad y no la del navegador: esta página no la recoge, y la semana
 * de la práctica ya está anclada ahí. Inventar una del cliente daría dos definiciones de «hoy».
 */
export async function markPracticeDone(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") return;

  const pillar = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).primaryPillarOf(practiceKey);
  if (!pillar) return;

  const { challengeKey } =
    HABIT_CHALLENGE_EXPERIENCES[CHALLENGE_KEY_BY_PILLAR[pillar]];
  const useCase = new HabitChallengeUseCase(
    createHabitChallengeRepository(challengeKey),
  );

  await useCase.start(userId, COMMUNITY_TIMEZONE);
  await useCase.recordPracticeDay(
    userId,
    localDateAt(new Date(), COMMUNITY_TIMEZONE),
  );

  revalidateLocalizedPath("/practicas");
  revalidateLocalizedPath("/habitos");
}
