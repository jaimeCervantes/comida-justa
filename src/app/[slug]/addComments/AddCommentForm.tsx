"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"
import { addCommentToPost } from "../data-access/actions"; // Función para agregar un comentario
import type { PostUser } from "~/infrastructure/types/Posts";

export default function AddCommentForm({
  postId,
  slug,
  user,
  onAdd
}: {
  postId: string;
  slug: string;
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

    if (result.errorMessage) {
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
        className="w-full p-2 border rounded dark:text-black"
        rows={4}
        placeholder="Escribe tu comentario..."
      />
      <button
        type="submit"
        onClick={handleAddComment}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Agregando..." : "Agregar Comentario"}
      </button>
      {errorMessage && <p className="text-red-500 mt-2">{errorMessage}</p>}
    </form>
  );
}
