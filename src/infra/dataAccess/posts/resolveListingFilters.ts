import type { ListingFilterState } from "~/domain/entities/post/listingFilters";
import type { PostListingFilters } from "./IPostQueryRepository";
import { categoryKeysForActivePublicationPillar } from "./publicationPillarFilter";

/**
 * Los filtros de la dirección, listos para un repositorio: el pilar resuelto a sus claves de
 * taxonomía y los interruptores tal cual. Lo usan todos los listados para que ninguno se olvide de
 * pasar uno de los tres.
 */
export async function resolveListingFilters(
  filters: ListingFilterState,
): Promise<PostListingFilters> {
  return {
    categoryKeys: await categoryKeysForActivePublicationPillar(
      filters.currentPillar,
    ),
    onlyAvailable: filters.onlyAvailable,
    onSale: filters.onSale,
  };
}
