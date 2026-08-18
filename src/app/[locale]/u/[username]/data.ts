import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type ProfilePageData = {
  profile: UserProfile;
  /** Su tienda, si la abrió: el perfil enlaza a ella y la tienda enlaza de vuelta. */
  store: Seller | null;
  publications: Post[];
  totalPages: number;
  total: number;
};

/**
 * El perfil de una persona y **todo** lo que publica, anuncios incluidos: un perfil no es un
 * catálogo. Devuelve `null` si esa dirección no existe, para que la página responda un 404 real.
 */
export async function getProfileByUsername(
  username: string,
  page: number,
  locale: string,
  /** Quién mira. Si es su propio perfil, también ve lo que se le bajó. */
  viewerId?: string | null,
  currentPillar: PublicationPillar | null = null,
): Promise<ProfilePageData | null> {
  const profile = await createUserProfileRepository().findByUsername(username);

  if (!profile) return null;

  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);

  const [result, store] = await Promise.all([
    createPostQueryRepository().getPostsByUser(
      profile.id,
      pageNum,
      PAGINATION_PAGE_SIZE,
      viewerId,
      {
        categoryKeys:
          await categoryKeysForActivePublicationPillar(currentPillar),
      },
    ),
    createSellerRepository().findByUserId(profile.id),
  ]);

  return {
    profile,
    store,
    publications: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
