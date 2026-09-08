import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import type { Seller } from "~/domain/entities/seller/types";
import type { UserProfile } from "~/domain/entities/user/types";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import { PostgresPracticeAdoption } from "~/infra/dataAccess/practices/PostgresPracticeAdoption";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { createUserProfileRepository } from "~/infra/dataAccess/users/factory";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";
import PracticeAdoptionUseCase from "~/use_cases/practices/practiceAdoptionUseCase";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";
import type { ProfileSharedPractice } from "./types";

export type ProfilePageData = {
  profile: UserProfile;
  /** Su tienda, si la abrió: el perfil enlaza a ella y la tienda enlaza de vuelta. */
  store: Seller | null;
  sharedPractices: readonly ProfileSharedPractice[];
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

  const [result, store, sharedAdoptions] = await Promise.all([
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
    new PracticeAdoptionUseCase(new PostgresPracticeAdoption()).sharedActiveFor(
      profile.id,
    ),
  ]);
  const adoptionByPracticeKey = new Map(
    sharedAdoptions.map((adoption) => [adoption.practiceKey, adoption]),
  );
  const sharedPracticeCards = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).listAdopted(locale, new Set(adoptionByPracticeKey.keys()));

  return {
    profile,
    store,
    sharedPractices: sharedPracticeCards.flatMap((practice) => {
      const adoption = adoptionByPracticeKey.get(practice.key);
      return adoption ? [{ ...practice, startedAt: adoption.startedAt }] : [];
    }),
    publications: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
  };
}
