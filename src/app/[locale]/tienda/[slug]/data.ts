import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Branch, Seller } from "~/domain/entities/seller/types";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createBranchRepository } from "~/infra/dataAccess/branches/factory";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type StorePageData = {
  seller: Seller;
  branches: Branch[];
  /** La dirección personal del dueño, si la reclamó; con ella la tienda enlaza a su perfil. */
  ownerUsername: string | null;
  /**
   * Metros hasta la sucursal más cercana, o `null` si el visitante no compartió su ubicación o la
   * tienda no tiene ninguna situada. Era el último hueco de cercanía del sitio: el directorio, las
   * tarjetas y la ficha ya lo decían, y la tienda —a la que se llega **desde** el directorio— no.
   */
  distanceMeters: number | null;
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
  /** Quién mira. Su dueño ve lo agotado —lo necesita para volver a ofrecerlo—; el resto no. */
  viewerId?: string | null,
  currentPillar: PublicationPillar | null = null,
): Promise<StorePageData | null> {
  const seller = await createSellerRepository().findByHandle(handle);

  if (!seller) return null;

  const isOwner = Boolean(viewerId) && seller.userId === viewerId;
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);

  // Catálogo, sucursales y distancia son independientes entre sí: se piden a la vez para no
  // encadenar esperas a la base en el camino crítico de la página.
  const [result, branches, owner, distanceMeters] = await Promise.all([
    createPostQueryRepository().getPostsBySeller(
      seller.id,
      pageNum,
      PAGINATION_PAGE_SIZE,
      {
        includeSoldOut: isOwner,
        categoryKeys:
          await categoryKeysForActivePublicationPillar(currentPillar),
      },
    ),
    createBranchRepository().listBySeller(seller.id),
    // Un vendedor puede existir sin cuenta (alta manual de proveedor local): entonces no hay perfil.
    seller.userId
      ? createUserProfileRepository().findByUserId(seller.userId)
      : null,
    // `readVisitorLocation()` se lee aquí y no se recibe por parámetro, igual que en `/directorio` y
    // `/buscar`: es una cookie de la petición, no algo que la página deba andar acarreando.
    createBranchRepository().distanceToNearestBranch(
      seller.id,
      await readVisitorLocation(),
    ),
  ]);

  return {
    seller,
    branches,
    ownerUsername: owner?.username ?? null,
    distanceMeters,
    catalog: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
