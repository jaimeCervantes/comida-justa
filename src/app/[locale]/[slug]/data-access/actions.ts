"use server";

import { after } from "next/server";
import { getTranslations } from "next-intl/server";
import { normalizeCommentText } from "~/domain/comments/commentText";
import { auth } from "~/infra/auth";
import { isAdmin } from "~/infra/auth/isAdmin";
import {
  COMMENT_MAX_LENGTH,
  COMMENT_RATE_LIMIT_PER_MINUTE,
  COMMENTS_PAGE_SIZE,
} from "~/infra/constants";
import { PostgresCommentRepository } from "~/infra/dataAccess/comments/PostgresCommentRepository";
import { createReviewCommentContentUseCase } from "~/infra/dataAccess/moderateComment/factory";
import type { PostUser } from "~/infra/types/Posts";

const commentRepo = new PostgresCommentRepository();

/**
 * Revisa el comentario **después** de responder a quien lo escribió, igual que
 * `reviewAfterResponse` en `publicar/actions.ts`. El comentario ya nació publicado y visible; esto
 * solo lo baja si el clasificador dice que no cumple.
 */
function reviewCommentAfterResponse(commentId: string, content: string): void {
  after(async () => {
    const outcome = await createReviewCommentContentUseCase().execute({
      commentId,
      content,
    });

    if (outcome.status === "in_review") {
      console.warn(
        // i18n-ignore: registro del servidor; lo lee quien opera, no un visitante.
        `[moderation] comment ${commentId} quedó sin revisar y espera en /admin/moderacion.`,
        outcome.error,
      );
    }
  });
}

/**
 * Guarda un comentario **firmado por quien lo está escribiendo de verdad**.
 *
 * Hasta este arreglo recibía al autor como tercer parámetro, desde el navegador, y lo escribía tal
 * cual en `comments.user_id`. Una Server Action es un endpoint HTTP público: bastaba el id de otra
 * persona real —que la propia página publica en cada comentario ya escrito— para firmar uno a su
 * nombre. Y después del hecho no hay forma de distinguir el falso del verdadero, así que no es un
 * fallo que se deshaga con un `git revert`.
 *
 * **El parámetro no se ignora: no existe.** Es la diferencia entre una defensa y una comprobación
 * que alguien puede quitar sin darse cuenta de lo que quita — quien devuelva ese argumento tiene
 * que decidir explícitamente creerle al cliente.
 *
 * El formulario sigue mandando a iniciar sesión cuando no la hay, y está bien: eso es cortesía de
 * interfaz. La defensa es esta.
 */
export async function addCommentToPost(postId: string, commentContent: string) {
  const t = await getTranslations("comments");
  const session = await auth();
  const user = session?.user as PostUser | undefined;

  /* Una sesión sin `id` es tan poco autor como no tener sesión: el proveedor puede devolver un
     usuario antes de que la cuenta termine de crearse, y sin id no hay a quién atribuirlo. */
  if (!user?.id) return { errorMessage: t("errorSignIn") };

  /* Lo que se cuenta y lo que se guarda son el mismo texto. `normalizeCommentText` ya recorta, así
     que quitar invisibles no puede dejar un comentario que pase el tope por caracteres que nadie
     escribió — ni uno «no vacío» hecho sólo de ellos. */
  const content = normalizeCommentText(commentContent);

  if (!content) return { errorMessage: t("errorEmpty") };

  if (content.length > COMMENT_MAX_LENGTH) {
    return { errorMessage: t("errorTooLong", { max: COMMENT_MAX_LENGTH }) };
  }

  /* El freno al abuso a escala, y el último de los cuatro: los tres de arriba dicen qué se acepta,
     este dice cuánto. Va justo antes de escribir para que una tanda de peticiones simultáneas se
     mida contra lo que de verdad hay en la tabla. */
  const lastMinute = new Date(Date.now() - 60_000);
  const recent = await commentRepo.countRecentByUser(user.id, lastMinute);

  if (recent >= COMMENT_RATE_LIMIT_PER_MINUTE) {
    return { errorMessage: t("errorTooFast") };
  }

  const result = await commentRepo.addComment(postId, content, user);

  if ("comment" in result) {
    reviewCommentAfterResponse(result.comment.id as string, content);
  }

  return result;
}

export async function getMoreComments(
  postId: string,
  page: number = 1,
  pageSize: number = COMMENTS_PAGE_SIZE,
) {
  const session = await auth();
  const viewer = {
    id: (session?.user as PostUser | undefined)?.id,
    isAdmin: isAdmin(session?.user?.email),
  };

  return await commentRepo.getComments(postId, page, pageSize, viewer);
}
