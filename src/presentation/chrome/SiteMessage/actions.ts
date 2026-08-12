"use server";

import { cookies } from "next/headers";
import {
  CELEBRATION_DISMISSAL_COOKIE,
  CELEBRATION_DISMISSAL_MAX_AGE,
} from "~/infra/habits/celebrationDismissalCookie";
import { readLatestPublicCelebration } from "~/infra/habits/readLatestPublicCelebration";

export async function dismissSiteCelebration(
  formData: FormData,
): Promise<void> {
  const proposedId = String(formData.get("celebrationId") ?? "");
  const latest = await readLatestPublicCelebration();
  if (!latest || proposedId !== latest.id) return;

  (await cookies()).set(CELEBRATION_DISMISSAL_COOKIE, latest.id, {
    httpOnly: true,
    maxAge: CELEBRATION_DISMISSAL_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
}
