import type { Post } from "~/infra/types/Posts";
import { getCategoryTaxonomy } from "~/infra/dataAccess/categories/cachedCategoryTaxonomy";
import { mapPostsToCards } from "./mapPostsToCards";

/**
 * El mapper con la taxonomía ya resuelta, para los Server Components y Route Handlers.
 *
 * `mapPostsToCards` se mantiene puro —recibe la taxonomía— para poder probarlo sin base; esta
 * envoltura es la que la busca. `getCategoryTaxonomy` está memorizada por render, así que llamarla
 * desde varias páginas de una misma petición no cuesta consultas extra.
 */
export async function mapPostsToCardsForLocale(posts: Post[], locale: string) {
  return mapPostsToCards(posts, { locale, taxonomy: await getCategoryTaxonomy() });
}
