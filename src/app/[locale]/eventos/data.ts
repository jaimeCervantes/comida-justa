import { EVENT_KIND } from "~/domain/entities/post/kind";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type EventsPageData = {
  events: Post[];
  totalPages: number;
  total: number;
};

/**
 * La agenda publica: eventos por fecha, separados del catalogo comercial.
 *
 * El filtro de tipo vive en el repositorio para que cualquier listado que necesite "eventos" use
 * la misma regla y no escriba `"evento"` a mano desde la capa de app.
 */
export async function getEvents(
  page: number,
  locale: string,
): Promise<EventsPageData> {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();
  const result = await postRepo.getEvents(pageNum, PAGINATION_PAGE_SIZE);

  return {
    events: (await mapPostsToCardsForLocale(result.posts, locale)).filter(
      (post) => post.kind === EVENT_KIND,
    ),
    totalPages: result.totalPages,
    total: result.total,
  };
}
