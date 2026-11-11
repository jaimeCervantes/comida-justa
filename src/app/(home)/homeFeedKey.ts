import type { ListingFilterState } from "~/domain/entities/post/listingFilters";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { measuredFrom } from "./measuredFrom";

export function homeFeedKey(
  visitor: Coordinates | null,
  /** Otro filtro, otra lista: lo acumulado con el anterior no sirve. */
  filters: ListingFilterState,
): string {
  const { currentPillar, onlyAvailable, onSale } = filters;

  return [
    measuredFrom(visitor),
    currentPillar ?? "all",
    onlyAvailable ? "in-stock" : "any",
    onSale ? "on-sale" : "any-price",
  ].join(":");
}
