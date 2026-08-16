"use server";
// ↑ Primera sentencia del archivo, no cosmético: debajo de un import deja de ser directiva y este
// módulo dejaría de ser una Server Action. Lo vigila `pnpm run check:directives`.

import { revalidatePath } from "next/cache";
import { isModerationReason } from "~/domain/entities/post/moderation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { createReportPostUseCase } from "~/infra/dataAccess/moderatePost/factory";

export interface ReportActionState {
  done?: boolean;
}

/**
 * Registra el aviso de alguien de la comunidad sobre una publicación.
 *
 * **No la oculta.** Sigue publicada y solo aparece en el panel con su cuenta; quien decide es una
 * persona. Ocultarla al primer aviso convertiría el botón en un arma con la que cualquiera podría
 * vaciar el catálogo.
 *
 * Contesta `done` en los dos casos que no son un fallo del sistema —se guardó, o esa persona ya
 * había avisado— porque para quien pulsa significan lo mismo: su aviso está. Lo que NO se hace es
 * decirle si la publicación acabó bajada: eso lo decide el admin después, y prometerlo aquí sería
 * mentir.
 */
export async function reportPost(
  _prevState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  const session = await auth();
  const reporterId = (session?.user as User | undefined)?.id;

  if (!reporterId) return {};

  const postId = String(formData.get("postId") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!postId || !isModerationReason(reason)) return {};

  const result = await createReportPostUseCase().execute({
    postId,
    reporterId,
    reason,
  });

  if (!result.reported) return {};

  // Para que el panel enseñe la cuenta nueva sin esperar a que caduque nada.
  revalidatePath("/admin/moderacion");

  return { done: true };
}
