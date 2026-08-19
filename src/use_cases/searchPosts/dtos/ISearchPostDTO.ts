import type { Coordinates } from "~/domain/entities/seller/coordinates";

export interface ISearchPostDTO {
  query: string;
  page: number;
  pageSize: number;
  /**
   * El idioma de quien busca.
   *
   * **No limita dónde se busca**, que es toda traducción de cualquier idioma: decide el orden —lo
   * que coincide en tu idioma va primero— y en qué idioma se enseña el resultado. Ya no viaja con
   * él un `fallbackLocale`: existía para ensanchar el filtro `locale = pedido`, y ese filtro
   * desapareció. A qué idioma caer al **pintar** lo decide `resolvePostTranslation` en la capa de
   * presentación, que es donde se sabe. Ver `docs/features/search/002-2026-08-07-busqueda-entre-idiomas.md`.
   */
  locale?: string;
  /** Desde dónde medir las distancias. `null` cuando no sabemos dónde está quien busca. */
  near?: Coordinates | null;
  /** Claves de taxonomía permitidas por el filtro de pilar. */
  categoryKeys?: readonly string[];
}
