import { cache } from "react";
import type { PublicationPillar } from "~/domain/entities/post/publicationPillars";
import { categoryKeysForActivePublicationPillar } from "~/infra/dataAccess/posts/publicationPillarFilter";
import {
  createSearchPostRepository,
  createSearchReporter,
} from "~/infra/dataAccess/searchPosts/factory";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import { createEmbeddingService } from "~/infra/services/factory";
import {
  type SearchPostsResult,
  SearchPostsUseCase,
} from "~/use_cases/searchPosts/SearchPostsUseCase";

/**
 * Las dos rutas de búsqueda enseñan lo mismo con distinta plantilla; el tamaño de página también.
 *
 * **Doce y no seis desde el slice 3 de `listadosCompactos.feature`**, y no por enseñar más: la
 * multi-columna de CSS **equilibra**, así que reparte el contenido en columnas de la misma altura y
 * usa sólo las que necesite. Con seis tarjetas que no se pueden partir le salían dos por columna,
 * le bastaban tres, y la cuarta quedaba vacía — un hueco muerto a la derecha que se lee como que
 * algo falló. Doce es divisible entre 2, 3 y 4, que son exactamente las columnas que el listado
 * puede tener.
 */
export const SEARCH_PAGE_SIZE = 12;

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
  currentPillar: PublicationPillar | null,
  onlyAvailable = false,
): Promise<SearchPostsResult> {
  if (!query) {
    return { results: [], total: 0, strategy: "none", counts: null };
  }

  const useCase = new SearchPostsUseCase(
    createSearchPostRepository(),
    createEmbeddingService(),
    createSearchReporter(),
  );

  return useCase.execute({
    query,
    page: Math.max(1, page),
    pageSize: SEARCH_PAGE_SIZE,
    locale,
    near: await readVisitorLocation(),
    categoryKeys: await categoryKeysForActivePublicationPillar(currentPillar),
    onlyAvailable,
  });
});
