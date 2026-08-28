"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Comment, PostUser } from "~/infra/types/Posts";
import { useIsClient } from "~/infra/UI/hooks/useIsClient";
import { Heading } from "~/presentation/design_system/typography/Heading";
import Avatar from "~/presentation/user/Avatar/Avatar";
import AddCommentForm from "../addComments/AddCommentForm";
import { useRealTimeComments } from "../addComments/useRealTimeComments";
import { createOnLoadMoreComments } from "./createOnLoadMoreComments";

export default function CommentList({
  postId,
  user,
  initialComments,
  initialTotal,
}: {
  postId: string;
  user: PostUser | undefined;
  initialComments: Comment[];
  /**
   * Cuántos comentarios tiene la publicación en total, no cuántos vinieron en la primera página.
   *
   * Es lo que decide si «cargar más» se pinta. Antes el botón estaba siempre, incluso en una
   * publicación sin un solo comentario: la única forma de enterarse de que no había nada más era
   * pulsarlo y leer el aviso.
   */
  initialTotal: number;
}) {
  const t = useTranslations("comments");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadMoreMessage, setLoadMoreMessage] = useState<string | null>(null);
  /* El total se refresca con cada página: entre que se pintó la ficha y se pulsa el botón, alguien
     más puede haber comentado, y `getComments` ya devuelve la cuenta al día. */
  const [total, setTotal] = useState(initialTotal);
  const isClient = useIsClient();

  const { comments, setComments, commentError } = useRealTimeComments(
    postId,
    initialComments,
  );

  const onLoadMoreComments = createOnLoadMoreComments({
    postId,
    currentPage,
    setLoading,
    setLoadMoreMessage,
    noMoreMessage: t("noMore"),
    setComments,
    setCurrentPage,
    setTotal,
  });

  /* Quedan comentarios que no están en pantalla. Cubre las dos cosas que el usuario reportó: sin
     ningún comentario (`total` es 0) y con todos ya cargados (`length` alcanzó al total). */
  const hasMore = comments.length < total;

  return (
    <>
      {/* Mismo nivel y mismo tamaño que «Publicaciones Relacionadas»: son las dos secciones
          hermanas de la ficha. `text-2xl font-bold` ya era `heading-md`, así que no cambia de
          aspecto; lo que cambia es que ahora sigue a la escala y no a una clase copiada. */}
      <Heading level={2} className="mb-4">
        {t("heading")}
      </Heading>
      <AddCommentForm postId={postId} user={user} />

      {commentError && (
        <p className="text-brand-clay-700 mt-2">{commentError}</p>
      )}

      {comments?.length > 0 ? (
        <ul aria-label={t("listLabel")}>
          {comments.map((comment) => (
            <li key={comment.id}>
              <article className="comment p-4 border-b border-b-separator">
                <header className="flex gap-4 mb-3">
                  <Avatar user={comment?.user} />
                  <p className="flex flex-col text-sm" rel="author">
                    {comment.user.name}
                    <time
                      dateTime={new Date(comment.createdAt).toISOString()}
                      className="text-sm text-text-support"
                    >
                      {isClient
                        ? new Date(comment.createdAt).toLocaleString()
                        : ""}
                    </time>
                  </p>
                </header>
                <section className="whitespace-pre-wrap">
                  {comment.content}
                </section>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t("empty")}</p>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={onLoadMoreComments}
          data-testid="load-more-comments"
          className="focus-ring mt-4 min-h-12 rounded-control bg-button-primary-bg px-4 py-2 font-semibold text-button-primary-text hover:bg-button-primary-hover transition-colors"
          disabled={loading}
        >
          {loading ? t("loadingMore") : t("loadMore")}
        </button>
      )}

      {loadMoreMessage && <p className="mt-2">{loadMoreMessage}</p>}
    </>
  );
}
