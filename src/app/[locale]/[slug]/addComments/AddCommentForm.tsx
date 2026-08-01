"use client";

import { useState } from "react";
import { useRouter } from "~/i18n/navigation";
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
  const router = useRouter();
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAddComment = async () => {
    if (!user) router.push(process.env.NEXT_PUBLIC_LOGIN_PATH as string);
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
        placeholder="Escribe tu comentario..."
        aria-label="Escribe tu comentario"
      />
      <button
        type="submit"
        onClick={handleAddComment}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-sm"
        disabled={loading}
      >
        {loading ? "Agregando..." : "Agregar Comentario"}
      </button>
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
    </form>
  );
}
