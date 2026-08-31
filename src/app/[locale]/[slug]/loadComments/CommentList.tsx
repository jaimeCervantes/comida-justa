"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ModerationReason } from "~/domain/entities/post/moderation";
import type { Comment, PostUser } from "~/infra/types/Posts";
import { useIsClient } from "~/infra/UI/hooks/useIsClient";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { Heading } from "~/presentation/design_system/typography/Heading";
import Avatar from "~/presentation/user/Avatar/Avatar";
import AddCommentForm from "../addComments/AddCommentForm";
import { useRealTimeComments } from "../addComments/useRealTimeComments";
import ReportCommentForm from "../ui/ReportCommentForm";
import type { ReportLabels } from "../ui/ReportPostForm";
import { createOnLoadMoreComments } from "./createOnLoadMoreComments";

/** Las etiquetas del aviso que solo ve el autor de un comentario no publicado, ya traducidas. */
export interface CommentModerationLabels {
  inReviewLabel: string;
  rejectedLabel: string;
  inReviewBody: string;
  rejectedBody: string;
  reasons: Partial<Record<ModerationReason, string>>;
}

/**
 * El aviso que solo ve el autor (y el admin) de un comentario que no está publicado. Mismo diseño
 * que `ModerationNotice`, pero recibe sus textos ya traducidos por props: `CommentList` es un
 * componente de cliente y no puede leer el catálogo de i18n del servidor.
 */
function CommentModerationNotice({
  status,
  reason,
  labels,
}: {
  status: string;
  reason: string | null | undefined;
  labels: CommentModerationLabels;
}) {
  if (status === "published") return null;

  const rejected = status === "rejected";
  const reasonLabel = reason
    ? labels.reasons[reason as ModerationReason]
    : null;

  return (
    <Alert
      tone={rejected ? "error" : "warning"}
      label={rejected ? labels.rejectedLabel : labels.inReviewLabel}
      className="mt-2"
      data-testid="comment-moderation-notice"
      data-status={status}
    >
      {rejected ? labels.rejectedBody : labels.inReviewBody}
      {reasonLabel ? ` ${reasonLabel}` : null}
    </Alert>
  );
}

export default function CommentList({
  postId,
  user,
  viewerIsAdmin = false,
  initialComments,
  initialTotal,
  moderationLabels,
  reportLabels,
}: {
  postId: string;
  user: PostUser | undefined;
  /** Para que el admin también vea el aviso de un comentario ajeno que está oculto. */
  viewerIsAdmin?: boolean;
  initialComments: Comment[];
  /**
   * Cuántos comentarios tiene la publicación en total, no cuántos vinieron en la primera página.
   *
   * Es lo que decide si «cargar más» se pinta. Antes el botón estaba siempre, incluso en una
   * publicación sin un solo comentario: la única forma de enterarse de que no había nada más era
   * pulsarlo y leer el aviso.
   */
  initialTotal: number;
  moderationLabels: CommentModerationLabels;
  reportLabels: ReportLabels;
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

  /**
   * Lo que acaba de escribirse aparece sin recargar.
   *
   * Va **al principio** porque la lista está ordenada de más nuevo a más viejo (`created_at DESC`,
   * tanto en la ficha como al paginar): añadirlo al final lo pondría donde van los más antiguos.
   *
   * El total sube en uno a la vez, y eso es lo que mantiene honesto al botón: sin ello, escribir
   * un comentario haría que `length` alcanzara al total y «cargar más» desaparecería aunque
   * quedaran páginas por traer.
   */
  const onCommentAdded = (comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
    setTotal((prev) => prev + 1);
  };

  return (
    <>
      {/* Mismo nivel y mismo tamaño que «Publicaciones Relacionadas»: son las dos secciones
          hermanas de la ficha. `text-2xl font-bold` ya era `heading-md`, así que no cambia de
          aspecto; lo que cambia es que ahora sigue a la escala y no a una clase copiada. */}
      <Heading level={2} className="mb-4">
        {t("heading")}
      </Heading>
      <AddCommentForm postId={postId} user={user} onAdd={onCommentAdded} />

      {commentError && (
        <p className="text-brand-clay-700 mt-2">{commentError}</p>
      )}

      {comments?.length > 0 ? (
        <ul aria-label={t("listLabel")}>
          {comments.map((comment) => {
            /* Un comentario ajeno sin publicar nunca llega hasta aquí —lo filtra la consulta—, así
               que "no publicado" solo se pinta para quien escribió o para el admin. */
            const status = comment.moderationStatus ?? "published";
            const isOwn = Boolean(user?.id) && user?.id === comment.user.id;
            const canSeeNotice = isOwn || viewerIsAdmin;
            /* Denunciar exige sesión, no ser su autor, y que esté publicado: lo mismo que ya
               comprueba `reportComment` del lado del servidor. */
            const canReport =
              Boolean(user?.id) && !isOwn && status === "published";

            return (
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

                  {canSeeNotice ? (
                    <CommentModerationNotice
                      status={status}
                      reason={comment.moderationReason}
                      labels={moderationLabels}
                    />
                  ) : null}

                  {canReport ? (
                    <ReportCommentForm
                      commentId={String(comment.id)}
                      labels={reportLabels}
                    />
                  ) : null}
                </article>
              </li>
            );
          })}
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
