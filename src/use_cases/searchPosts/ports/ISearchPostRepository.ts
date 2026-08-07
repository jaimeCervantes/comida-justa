import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { ISearchPostResultDTO } from "../dtos/ISearchPostResultDTO";

export interface ISearchPostRepository {
  search(
    query: string,
    page: number,
    pageSize: number,
    locale?: string,
    near?: Coordinates | null,
    /**
     * A qué idioma caer cuando la publicación no existe en el pedido.
     *
     * Sin esto la búsqueda filtraba `locale = pedido` a secas y una publicación sin traducir era
     * **invisible**, aunque su ficha se abriera sin problema: buscar en inglés antes del backfill
     * de traducciones devolvía cero resultados para todo el catálogo.
     */
    fallbackLocale?: string,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;

  /**
   * Lo más parecido al **sentido** de la consulta, por distancia coseno.
   *
   * `maxDistance` no es opcional a propósito: sin umbral, el vecino más cercano existe siempre y
   * la búsqueda devolvería cualquier cosa disfrazada de resultado. Es el mismo error que
   * `getRelatedPosts` ya evitaba.
   */
  searchByVector(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    locale: string,
    fallbackLocale: string,
    maxDistance: number,
    near?: Coordinates | null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;
}
