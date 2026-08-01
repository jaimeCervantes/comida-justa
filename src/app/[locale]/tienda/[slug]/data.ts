import type { Branch, Seller } from "~/domain/entities/seller/types";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type StorePageData = {
  seller: Seller;
  branches: Branch[];
  /** La dirección personal del dueño, si la reclamó; con ella la tienda enlaza a su perfil. */
  ownerUsername: string | null;
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

  // Catálogo y sucursales son independientes entre sí: se piden a la vez para no encadenar dos
  // esperas a la base en el camino crítico de la página.
  const [result, branches, owner] = await Promise.all([
    createPostQueryRepository().getPostsBySeller(
      seller.id,
      pageNum,
      PAGINATION_PAGE_SIZE,
    ),
    createBranchRepository().listBySeller(seller.id),
    // Un vendedor puede existir sin cuenta (alta manual de proveedor local): entonces no hay perfil.
    seller.userId
      ? createUserProfileRepository().findByUserId(seller.userId)
      : null,
  ]);

  return {
    seller,
    branches,
    ownerUsername: owner?.username ?? null,
    catalog: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
