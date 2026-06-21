import type { Comment } from "~/infra/types/Posts";
import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { getMoreComments } from "../data-access/actions";

export function createOnLoadMoreComments({
  postId,
  currentPage,
  setLoading,
  setLoadMoreMessage,
  setComments,
  setCurrentPage,
}: {
  postId: string;
  currentPage: number;
  setLoading: (isLoading: boolean) => void;
  setLoadMoreMessage: (message: string) => void;
  setComments: (comments: (comment: Comment[]) => Comment[]) => void;
  setCurrentPage: (page: number) => void;
}) {
  return async function () {
    setLoading(true);
    const nextPage = currentPage + 1;

    const result = await getMoreComments(postId, nextPage, COMMENTS_PAGE_SIZE);

    setLoading(false);

    if (result.comments.length === 0) {
      setLoadMoreMessage("Ya no hay más comentarios.");
    } else {
      setComments((prev: Comment[]) => [...prev, ...result.comments]);
      setCurrentPage(nextPage);
    }
  };
}
