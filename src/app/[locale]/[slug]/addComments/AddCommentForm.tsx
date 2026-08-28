"use client";
import { useTranslations } from "next-intl";

import { useState } from "react";
import type { Comment, PostUser } from "~/infra/types/Posts";
import { addCommentToPost } from "../data-access/actions"; // Función para agregar un comentario

export default function AddCommentForm({
  postId,
  user,
  onAdd,
}: {
  postId: string;
  user: PostUser | undefined;
  /**
   * El comentario que acaba de guardarse, para que la lista lo pinte sin recargar.
   *
   * Recibe el comentario y no un aviso a secas: la acción ya devuelve la fila completa —con su id
   * y su fecha—, así que quien escucha no tiene que volver a pedir la página para enseñar lo que
   * esta persona acaba de escribir.
   */
  onAdd?: (comment: Comment) => void;
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
    setLoading(false);

    if ("errorMessage" in result) {
      setErrorMessage(result.errorMessage);
      return;
    }

    /* Después de comprobar que se guardó, y no antes: avisar primero pintaba en la lista un
       comentario que la base pudo haber rechazado, y al recargar desaparecía sin explicación. */
    setErrorMessage(null);
    setNewComment("");
    onAdd?.(result.comment);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="w-full rounded-control border border-border-field bg-surface-elevation-1 p-2 text-text-base"
        rows={4}
        placeholder={t("placeholder")}
        aria-label={t("inputLabel")}
      />
      <button
        type="submit"
        onClick={handleAddComment}
        className="focus-ring mt-2 min-h-12 rounded-control bg-button-primary-bg px-4 py-2 font-semibold text-button-primary-text hover:bg-button-primary-hover transition-colors"
        disabled={loading}
      >
        {loading ? t("submitting") : t("submit")}
      </button>
      {errorMessage && (
        <p className="text-brand-clay-700 mt-2">{errorMessage}</p>
      )}
    </form>
  );
}
