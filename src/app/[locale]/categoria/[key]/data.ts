import {
  type ListingFilterState,
  NO_LISTING_FILTERS,
} from "~/domain/entities/post/listingFilters";
import {
  isActiveKey,
  labelFor,
  subtreeKeys,
} from "~/domain/entities/post/taxonomy";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { createPostQueryRepository } from "~/infra/dataAccess/getMultiplePosts";
import { resolveListingFilters } from "~/infra/dataAccess/posts/resolveListingFilters";
import { readViewerLocationContext } from "~/infra/location/viewerLocationContext";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type CategoryPageData = {
  /** La etiqueta ya resuelta en el idioma pedido: es lo que se pinta como título. */
  label: string;
  posts: Post[];
  totalPages: number;
  total: number;
  /** Dónde está quien mira; `null` cuando no lo sabemos y hay que explicarlo. */
  visitor: Coordinates | null;
};

/**
 * El catálogo de una categoría.
 *
 * Filtrar por una categoría significa **su subárbol**: pedir `alimentacion` trae también lo que
 * cuelga de ella, y pedir `jugos` trae solo lo suyo. Quién cuelga de quién lo decide la taxonomía
 * (`subtreeKeys`), que ya viene cacheada, así que el repositorio recibe las claves resueltas y no
 * tiene que saber nada de jerarquías.
 *
 * Devuelve `null` cuando la clave no existe o está desactivada, para que la página responda 404 en
 * vez de una lista vacía: una categoría que no existe no es una categoría sin productos.
 */
export async function getPostsByCategory(
  key: string,
  page: number,
  locale: string,
  /** Pilar, existencia y promoción, como los leyó `parseListingFilters`. */
  filters: ListingFilterState = NO_LISTING_FILTERS,
): Promise<CategoryPageData | null> {
  const taxonomy = await getCategoryTaxonomy();

  if (!isActiveKey(taxonomy, key)) return null;

  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const { visitor } = await readViewerLocationContext();
  const result = await createPostQueryRepository().getPostsByCategory(
    subtreeKeys(taxonomy, key),
    pageNum,
    PAGINATION_PAGE_SIZE,
    visitor,
    await resolveListingFilters(filters),
  );

  return {
    label: labelFor(taxonomy, key, locale) ?? key,
    posts: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
    visitor,
  };
}
