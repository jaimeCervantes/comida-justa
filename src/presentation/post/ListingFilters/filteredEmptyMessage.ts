import type { ListingFilterState } from "~/domain/entities/post/listingFilters";

/**
 * Qué decir cuando un listado sale vacío **por un interruptor**, o `null` si no fue por eso.
 *
 * Vacío por un filtro no es un listado vacío: invitar a publicar contestaría otra pregunta. Si están
 * los dos encendidos manda la promoción, que es el más estrecho de los dos (una promoción vigente ya
 * exige piezas).
 */
export function filteredEmptyMessage(
  filters: ListingFilterState,
  t: (key: "nothingOnSale" | "nothingInStock") => string,
): string | null {
  if (filters.onSale) return t("nothingOnSale");
  if (filters.onlyAvailable) return t("nothingInStock");
  return null;
}
