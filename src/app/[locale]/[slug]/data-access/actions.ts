"use server";

import { getTranslations } from "next-intl/server";
import { auth } from "~/infra/auth";
import { COMMENT_MAX_LENGTH, COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { PostgresCommentRepository } from "~/infra/dataAccess/comments/PostgresCommentRepository";
import type { PostUser } from "~/infra/types/Posts";

const commentRepo = new PostgresCommentRepository();

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

  /* Lo que se cuenta y lo que se guarda son el mismo texto. Si los espacios de los bordes contaran
     para el tope pero no se guardaran, el error hablaría de un comentario que nadie escribió. */
  const content = commentContent.trim();

  if (!content) return { errorMessage: t("errorEmpty") };

  if (content.length > COMMENT_MAX_LENGTH) {
    return { errorMessage: t("errorTooLong", { max: COMMENT_MAX_LENGTH }) };
  }

  return await commentRepo.addComment(postId, content, user);
}

export async function getMoreComments(
  postId: string,
  page: number = 1,
  pageSize: number = COMMENTS_PAGE_SIZE,
) {
  return await commentRepo.getComments(postId, page, pageSize);
}
