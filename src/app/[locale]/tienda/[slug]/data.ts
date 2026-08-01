import type { Seller } from "~/domain/entities/seller/types";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type StorePageData = {
  seller: Seller;
  catalog: Post[];
  totalPages: number;
  total: number;
};

/**
 * La tienda y su catálogo, o `null` si esa dirección no existe.
 *
 * Devuelve `null` en vez de lanzar para que la página pueda responder un 404 de verdad; el
 * catálogo se pide con el mismo repositorio paginado que usan `/` y `/productos`, filtrando por
 * `seller_id`.
 */
export async function getStoreByHandle(
  handle: string,
  page: number,
  locale: string,
): Promise<StorePageData | null> {
  const seller = await createSellerRepository().findByHandle(handle);

  if (!seller) return null;

  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const result = await createPostQueryRepository().getPostsBySeller(
    seller.id,
    pageNum,
    PAGINATION_PAGE_SIZE,
  );

  return {
    seller,
    catalog: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
