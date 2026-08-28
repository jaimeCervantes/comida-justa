import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import type { Comment } from "~/infra/types/Posts";
import { getMoreComments } from "../data-access/actions";

export function createOnLoadMoreComments({
  postId,
  currentPage,
  setLoading,
  setLoadMoreMessage,
  noMoreMessage,
  setComments,
  setCurrentPage,
  setTotal,
}: {
  postId: string;
  currentPage: number;
  setLoading: (isLoading: boolean) => void;
  setLoadMoreMessage: (message: string) => void;
  /** Lo pone quien renderiza: este módulo no conoce ningún texto. */
  noMoreMessage: string;
  setComments: (comments: (comment: Comment[]) => Comment[]) => void;
  setCurrentPage: (page: number) => void;
  /** La cuenta al día que devuelve la consulta: es lo que decide si el botón sigue teniendo sentido. */
  setTotal: (total: number) => void;
}) {
  return async () => {
    setLoading(true);
    const nextPage = currentPage + 1;

    const result = await getMoreComments(postId, nextPage, COMMENTS_PAGE_SIZE);

    setLoading(false);
    /* Se refresca siempre, incluso cuando no vino ninguno: si alguien borró comentarios entre los
       dos renders, esta es la ocasión de enterarse y dejar de ofrecer el botón. */
    setTotal(result.total);

    if (result.comments.length === 0) {
      setLoadMoreMessage(noMoreMessage);
    } else {
      setComments((prev: Comment[]) => [...prev, ...result.comments]);
      setCurrentPage(nextPage);
    }
  };
}
