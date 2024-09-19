"use client";

import { useState, useEffect } from "react";
import AddCommentForm from "../addComments/AddCommentForm";
import type { PostUser } from "~/types/Posts";
import { useRealTimeComments } from "../addComments/useRealTimeComments";
import { createOnLoadMoreComments } from "./createOnLoadMoreComments";
import type { FirestoreComment } from "~/firebase/models/Posts.d";
import Avatar from "~/components/ui/Avatar/Avatar";

export default function CommentList({
  postId,
  slug,
  user,
  initialComments,
  firstVisibleComment,
  lastVisibleComment,
}: {
  postId: string;
  slug: string;
  user: PostUser | undefined;
  initialComments: any[];
  firstVisibleComment: any;
  lastVisibleComment: any;
}) {
  const [lastComment, setLastComment] = useState<FirestoreComment | null>(lastVisibleComment);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadMoreMessage, setLoadMoreMessage] = useState<string | null>(null);

  const { comments, setComments, setHasAddedComment, addCommentError } =
    useRealTimeComments(postId, initialComments, firstVisibleComment);

  function onAddComment() {
    setHasAddedComment(true);
  }

  const onLoadMoreComments = createOnLoadMoreComments({
    postId,
    lastComment,
    setLoading,
    setLoadMoreMessage,
    setComments,
    setLastComment,
  });

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Comentarios</h2>
      <AddCommentForm
        postId={postId}
        slug={slug}
        user={user}
        onAdd={onAddComment}
      />

      {addCommentError && (
        <p className="text-red-500 mt-2">{addCommentError}</p>
      )}

      <div role="list" aria-label="comentarios">
        {comments?.length > 0 ? (
          comments.map((comment) => (
            <article
              role="roleitem"
              key={comment.id}
              className="comment p-4 border-b border-b-slate-700"
            >
              <header className="flex gap-4 mb-3">
                <Avatar user={comment?.user} />
                <p
                  className="flex flex-col text-sm"
                  rel="author"
                >
                  {comment.user.name}
                  <time
                    dateTime={comment.createdAt}
                    className="text-sm text-gray-500"
                  >
                    {new Date(comment.createdAt).toLocaleString()}
                  </time>
                </p>
              </header>
              <p>{comment.content}</p>
            </article>
          ))
        ) : (
          <p>No hay comentarios aún.</p>
        )}

        {lastComment && (
          <button
            onClick={onLoadMoreComments}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? "Cargando más comentarios..." : "Cargar más comentarios"}
          </button>
        )}

        {loadMoreMessage && <p className="mt-2">{loadMoreMessage}</p>}
      </div>
    </>
  );
}
