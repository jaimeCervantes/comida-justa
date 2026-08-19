"use server";

import { revalidatePath } from "next/cache";
import { auth } from "~/infra/auth";
import { createEventAttendanceRepository } from "~/infra/dataAccess/eventAttendances/PostgresEventAttendanceRepository";
import ToggleEventAttendanceUseCase from "~/use_cases/eventAttendance/toggleEventAttendanceUseCase";

export interface EventAttendanceActionState {
  attending: boolean;
  attendees: number;
  needsSignIn?: boolean;
}

export async function toggleEventAttendance(
  prev: EventAttendanceActionState,
  formData: FormData,
): Promise<EventAttendanceActionState> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  if (!userId) return { ...prev, needsSignIn: true };

  const postId = String(formData.get("postId") ?? "");
  const path = String(formData.get("path") ?? "");
  const result = await new ToggleEventAttendanceUseCase(
    createEventAttendanceRepository(),
  ).execute({ userId, postId });

  if (!result.ok) return prev;

  if (path) revalidatePath(path);

  return { attending: result.attending, attendees: result.attendees };
}
