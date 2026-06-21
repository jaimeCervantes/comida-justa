"use client";
import { useState } from "react";
import type { Comment } from "~/infra/types/Posts";

/**
 * Holds comment state. Initial comments come from the server (first page).
 * Load-more is handled by createOnLoadMoreComments (page-based pagination).
 * Real-time updates will be added later via Supabase Realtime or SSE.
 */
export function useRealTimeComments(
  _postId: string,
  initialComments: Comment[],
) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const commentError = null;

  return { comments, setComments, commentError };
}
