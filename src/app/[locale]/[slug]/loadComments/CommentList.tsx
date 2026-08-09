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
}: {
  postId: string;
  user: PostUser | undefined;
  initialComments: Comment[];
}) {
  const t = useTranslations("comments");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadMoreMessage, setLoadMoreMessage] = useState<string | null>(null);
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
  });

  return (
    <>
      {/* Mismo nivel y mismo tamaño que «Publicaciones Relacionadas»: son las dos secciones
          hermanas de la ficha. `text-2xl font-bold` ya era `heading-md`, así que no cambia de
          aspecto; lo que cambia es que ahora sigue a la escala y no a una clase copiada. */}
      <Heading level={2} className="mb-4">
        {t("heading")}
      </Heading>
      <AddCommentForm postId={postId} user={user} />

      {commentError && <p className="text-red-500 mt-2">{commentError}</p>}

      {comments?.length > 0 ? (
        <ul aria-label={t("listLabel")}>
          {comments.map((comment) => (
            <li key={comment.id}>
              <article className="comment p-4 border-b border-b-slate-700">
                <header className="flex gap-4 mb-3">
                  <Avatar user={comment?.user} />
                  <p className="flex flex-col text-sm" rel="author">
                    {comment.user.name}
                    <time
                      dateTime={new Date(comment.createdAt).toISOString()}
                      className="text-sm text-gray-500"
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

      <button
        type="button"
        onClick={onLoadMoreComments}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-sm"
        disabled={loading}
      >
        {loading ? t("loadingMore") : t("loadMore")}
      </button>

      {loadMoreMessage && <p className="mt-2">{loadMoreMessage}</p>}
    </>
  );
}
