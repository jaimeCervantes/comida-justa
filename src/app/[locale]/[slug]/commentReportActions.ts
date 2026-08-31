"use server";
// ↑ Primera sentencia del archivo, no cosmético: debajo de un import deja de ser directiva y este
// módulo dejaría de ser una Server Action. Lo vigila `pnpm run check:directives`.

import { revalidatePath } from "next/cache";
import { isModerationReason } from "~/domain/entities/post/moderation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { createReportCommentUseCase } from "~/infra/dataAccess/moderateComment/factory";

export interface ReportActionState {
  done?: boolean;
}

/**
 * Registra el aviso de alguien de la comunidad sobre un comentario. Mismo diseño que `reportPost`
 * en `reportActions.ts`: no lo oculta, solo lo apunta en el panel.
 */
export async function reportComment(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const session = await auth();
  const reporterId = (session?.user as User | undefined)?.id;

  if (!reporterId) return {};

  const commentId = String(formData.get("commentId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!commentId || !isModerationReason(reason)) return {};

  const result = await createReportCommentUseCase().execute({
    commentId,
    reporterId,
    reason,
  });

  if (!result.reported) return {};

  revalidatePath("/admin/moderacion");

  return { done: true };
}
