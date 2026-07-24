import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { mapPostsToCards } from "~/infra/UI/mappers/posts/mapPostsToCards";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import type { Post } from "~/infra/types/Posts";

export type ProductsPageData = {
  products: Post[];
  totalPages: number;
  total: number;
};

/**
 * Productos que vende Hazlo Sano (propios o de reventa). El filtro vive en el repositorio;
 * aquí solo se pagina y se mapea a tarjetas, igual que el listado general.
 */
export async function getHazloSanoProducts(
  page: number,
): Promise<ProductsPageData> {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getHazloSanoProducts(
    pageNum,
    PAGINATION_PAGE_SIZE,
  );

  return {
    products: mapPostsToCards(result.posts),
    totalPages: result.totalPages,
    total: result.total,
  };
}
