import type { HabitChallengeProgress } from "~/use_cases/habits/habitChallengeUseCase";

/**
 * El contrato entre el panel de seguimiento y la Server Action que lo atiende.
 *
 * Vive aparte del panel a propósito: el panel es `"use client"` y la acción es `"use server"`, así
 * que si el tipo viviera en cualquiera de los dos, el otro tendría que importar un módulo del
 * bando contrario solo para leer una firma. Aquí no hay directiva y ninguno de los dos manda.
 */
export type HabitChallengeStatus =
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

export type HabitChallengeActionState = {
  status: HabitChallengeStatus;
  progress: HabitChallengeProgress | null;
  needsSignIn?: boolean;
};

export type HabitChallengeAction = (
  previous: HabitChallengeActionState,
  formData: FormData,
) => Promise<HabitChallengeActionState>;
