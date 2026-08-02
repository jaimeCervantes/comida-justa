"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";
import type { PostUser } from "~/infra/types/Posts";
import { addCommentToPost } from "../data-access/actions"; // Función para agregar un comentario

export default function AddCommentForm({
  postId,
  user,
  onAdd,
}: {
  postId: string;
  user: PostUser | undefined;
  onAdd?: () => void;
}) {
  const t = useTranslations("comments");
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddComment = async () => {
    if (!user) {
      /* `NEXT_PUBLIC_LOGIN_PATH` es `/api/auth/signin`: el handler de NextAuth, no una página de
         este routing. Por eso sale por `window.location` y no por el router de next-intl, que le
         antepondría el prefijo de idioma y lo convertiría en un 404.

         El `return` es nuevo: antes el flujo seguía y llamaba a `addCommentToPost` con
         `user as PostUser` valiendo `undefined`, además de navegar. */
      window.location.href = process.env.NEXT_PUBLIC_LOGIN_PATH as string;
      return;
    }
    if (!newComment.trim()) return;
    setLoading(true);
    const result = await addCommentToPost(postId, newComment, user as PostUser);
    onAdd?.();
    setLoading(false);

    if ("errorMessage" in result) {
      setErrorMessage(result.errorMessage);
    } else {
      setNewComment("");
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="w-full p-2 border rounded-sm dark:text-black"
        rows={4}
        placeholder={t("placeholder")}
        aria-label={t("inputLabel")}
      />
      <button
        type="submit"
        onClick={handleAddComment}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-sm"
        disabled={loading}
      >
        {loading ? t("submitting") : t("submit")}
      </button>
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
    </form>
  );
}
