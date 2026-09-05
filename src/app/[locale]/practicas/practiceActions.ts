"use server";

import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { readViewerId } from "~/infra/auth/readViewerId";
import { PostgresPracticeAdoption } from "~/infra/dataAccess/practices/PostgresPracticeAdoption";
import PracticeAdoptionUseCase from "~/use_cases/practices/practiceAdoptionUseCase";

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
