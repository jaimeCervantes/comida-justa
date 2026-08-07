import { cache } from "react";
import { routing } from "~/i18n/routing";
import { createSearchPostRepository } from "~/infra/dataAccess/searchPosts/factory";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";
import { SearchPostsUseCase } from "~/use_cases/searchPosts/SearchPostsUseCase";

/** Las dos rutas de búsqueda enseñan lo mismo con distinta plantilla; el tamaño de página también. */
export const SEARCH_PAGE_SIZE = 6;

/**
 * Los resultados de una búsqueda, para un Server Component.
 *
 * Antes las dos páginas hacían `fetch` a su propia API `/api/search`. Eso costaba un viaje HTTP
 * completo por búsqueda —el servidor llamándose a sí mismo— y, sobre todo, **perdía las cookies**:
 * un `fetch` desde el servidor no reenvía las del visitante, así que `readVisitorLocation()` dentro
 * del route handler no habría visto nada y la búsqueda nunca habría podido decir distancias.
 *
 * `/api/search` sigue existiendo para `SearchBar`, que es un cliente de verdad: ahí la petición la
 * hace el navegador y las cookies sí viajan.
 */
export const searchPosts = cache(async function searchPosts(
  query: string,
  page: number,
  locale: string,
): Promise<{ results: ISearchPostResultDTO[]; total: number }> {
  if (!query) return { results: [], total: 0 };

  const useCase = new SearchPostsUseCase(createSearchPostRepository());

  return useCase.execute({
    query,
    page: Math.max(1, page),
    pageSize: SEARCH_PAGE_SIZE,
    locale,
    fallbackLocale: routing.defaultLocale,
    near: await readVisitorLocation(),
  });
});
