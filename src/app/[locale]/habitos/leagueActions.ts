"use server";

import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createHabitLeagueRepository } from "~/infra/dataAccess/habits/PostgresHabitLeagueRepository";
import HabitLeagueUseCase from "~/use_cases/habits/habitLeagueUseCase";

export async function setHabitLeagueOptIn(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;
  const enabled = formData.get("intent") === "join";
  await new HabitLeagueUseCase(createHabitLeagueRepository()).setOptIn(
    userId,
    enabled,
  );
  revalidateLocalizedPath("/habitos");
}
