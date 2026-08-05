import type { Coordinates } from "~/domain/entities/seller/coordinates";

export interface ISearchPostDTO {
  query: string;
  page: number;
  pageSize: number;
  locale?: string;
  /** Desde dónde medir las distancias. `null` cuando no sabemos dónde está quien busca. */
  near?: Coordinates | null;
}
