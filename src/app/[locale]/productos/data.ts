import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type ProductsPageData = {
  products: Post[];
  totalPages: number;
  total: number;
};

/**
 * Todo lo que la comunidad pone a la venta.
 *
 * Antes esta página listaba **solo** lo de Hazlo Sano (`origin` `hazlo_sano_*`), así que lo que
 * publicaba un vendedor local no aparecía en la única pantalla que se llama «Productos». Ahora el
 * filtro es únicamente `kind = producto`: entra todo el que vende y quedan fuera los anuncios,
 * que es la distinción que la página quiere hacer.
 *
 * Cada tarjeta sigue llevando su insignia de procedencia, así que se distingue a simple vista lo
 * que es de la marca de lo que es de un vecino.
 */
export async function getProducts(
  page: number,
  locale: string,
): Promise<ProductsPageData> {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();

  const result = await postRepo.getProducts(pageNum, PAGINATION_PAGE_SIZE);

  return {
    products: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
