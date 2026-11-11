import {
  ONLY_AVAILABLE_QUERY_PARAM,
  parseOnlyAvailableFilter,
} from "./catalogFilters";
import { ON_SALE_QUERY_PARAM, parseOnSaleFilter } from "./promotion";
import {
  PUBLICATION_PILLAR_QUERY_PARAM,
  type PublicationPillar,
  parsePublicationPillar,
} from "./publicationPillars";

/**
 * Los interruptores que cualquier listado sabe aplicar: «Solo con existencia» y «En promoción».
 *
 * Son lo que reciben los repositorios —el listado común y la búsqueda— además de las claves del
 * pilar, que ya llegan resueltas por la taxonomía.
 */
export interface ListingToggles {
  onlyAvailable?: boolean;
  onSale?: boolean;
}

/**
 * El conjunto de filtros de un listado, tal como lo dice la dirección: el mismo en las seis
 * pantallas que enseñan publicaciones. Ver
 * `docs/features/catalog/005-2026-11-10-filtros-del-catalogo.md`.
 */
export interface ListingFilterState {
  currentPillar: PublicationPillar | null;
  onlyAvailable: boolean;
  onSale: boolean;
}

export const NO_LISTING_FILTERS: ListingFilterState = {
  currentPillar: null,
  onlyAvailable: false,
  onSale: false,
};

/**
 * Lee los filtros de los parámetros de una dirección. Lo que no se entiende es «sin filtro», nunca
 * un error: un enlace viejo o tecleado a mano enseña el listado completo.
 */
export function parseListingFilters(
  params: Readonly<Record<string, unknown>>,
): ListingFilterState {
  const pillar = params[PUBLICATION_PILLAR_QUERY_PARAM];

  return {
    currentPillar: parsePublicationPillar(
      typeof pillar === "string" ? pillar : null,
    ),
    onlyAvailable: parseOnlyAvailableFilter(params[ONLY_AVAILABLE_QUERY_PARAM]),
    onSale: parseOnSaleFilter(params[ON_SALE_QUERY_PARAM]),
  };
}

/** Los filtros escritos de vuelta como parámetros; lo apagado queda `undefined` y no viaja. */
export function listingFilterParams(
  filters: ListingFilterState,
): Record<string, string | undefined> {
  return {
    [PUBLICATION_PILLAR_QUERY_PARAM]: filters.currentPillar ?? undefined,
    [ONLY_AVAILABLE_QUERY_PARAM]: filters.onlyAvailable ? "1" : undefined,
    [ON_SALE_QUERY_PARAM]: filters.onSale ? "1" : undefined,
  };
}

/** ¿Hay algún interruptor encendido? Un listado vacío por un filtro no es un listado vacío. */
export function hasActiveToggle(filters: ListingFilterState): boolean {
  return filters.onlyAvailable || filters.onSale;
}
