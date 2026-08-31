"use server";
// ↑ Primera sentencia del archivo, no cosmético: debajo de un import deja de ser directiva y este
// módulo dejaría de ser una Server Action. Lo vigila `pnpm run check:directives`.

import { revalidatePath } from "next/cache";
import {
  isModerationReason,
  type ModerationDecision,
} from "~/domain/entities/post/moderation";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import { createModerateCommentUseCase } from "~/infra/dataAccess/moderateComment/factory";
import { createModeratePostUseCase } from "~/infra/dataAccess/moderatePost/factory";

/** El mismo gate que la página: una Server Action se puede invocar sin pasar por ella. */
async function requireAdmin(): Promise<boolean> {
  const session = await auth();

  return isAdmin(session?.user?.email);
}

/**
 * Aprueba o baja una publicación desde el panel.
 *
 * Misma forma que `setCategoryActive`: acción simple sin `useActionState`, porque cada fila es un
 * botón y no un formulario con errores que contestar. Lo que sí se comprueba es el motivo — bajar
 * algo sin uno dejaría al autor con un aviso que no explica nada, así que sin motivo válido no se
 * escribe. El `required` del `<select>` lo evita antes de salir del navegador; esto es la defensa
 * del servidor, que es la que cuenta.
 */
export async function decideModeration(formData: FormData): Promise<void> {
  if (!(await requireAdmin())) return;

  const postId = String(formData.get("postId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!postId) return;

  let decision: ModerationDecision;

  if (action === "approve") {
    decision = { action: "approve" };
  } else if (isModerationReason(reason)) {
    decision = { action: "reject", reason };
  } else {
    return;
  }

  await createModeratePostUseCase().execute({ postId, decision });

  /* Una publicación aparece en el feed, en la búsqueda, en su ficha, en la tienda de su vendedor y
     en el sitemap, y cada una cuelga de una ruta distinta y con idioma. Enumerarlas sería una lista
     que se queda corta la próxima vez que alguien añada una pantalla, así que se revalida el árbol
     entero: bajar algo pasa un puñado de veces al mes y tiene que desaparecer de todas partes. */
  revalidatePath("/", "layout");
}

/** Mismo diseño que `decideModeration`, para un comentario en vez de una publicación. */
export async function decideCommentModeration(
  formData: FormData,
): Promise<void> {
  if (!(await requireAdmin())) return;

  const commentId = String(formData.get("commentId") ?? "");
  const action = String(formData.get("action") ?? "");
  const reason = String(formData.get("reason") ?? "");

  if (!commentId) return;

  let decision: ModerationDecision;

  if (action === "approve") {
    decision = { action: "approve" };
  } else if (isModerationReason(reason)) {
    decision = { action: "reject", reason };
  } else {
    return;
  }

  await createModerateCommentUseCase().execute({ commentId, decision });

  /* Un comentario solo vive en la ficha de su publicación —a diferencia de una publicación, que
     aparece en el feed, la búsqueda, la tienda y el sitemap—, pero esta acción no conoce ese slug
     sin una consulta extra. Revalidar el árbol entero es más de lo necesario y, aun así, más barato
     que esa consulta para algo que pasa un puñado de veces al mes. */
  revalidatePath("/", "layout");
}
