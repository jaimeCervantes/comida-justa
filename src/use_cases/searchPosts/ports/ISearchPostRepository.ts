import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { ISearchPostResultDTO } from "../dtos/ISearchPostResultDTO";

export interface ISearchPostRepository {
  search(
    query: string,
    page: number,
    pageSize: number,
    /**
     * El idioma de quien busca. **No limita dónde se busca.**
     *
     * Antes venía acompañado de un `fallbackLocale` porque la consulta filtraba
     * `t.locale IN (pedido, respaldo)`: una publicación sin traducir era invisible sin el respaldo,
     * y con él seguía siéndolo la que solo coincidía en el otro idioma —navegando en español los
     * dos eran `es`—. Ahora se busca en toda traducción y este idioma solo decide el **orden**: lo
     * que coincide en el tuyo va antes que lo que solo coincide en el otro.
     */
    locale?: string,
    near?: Coordinates | null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;

  /**
   * Lo más parecido al **sentido** de la consulta, por distancia coseno.
   *
   * Sin idioma, y a propósito: el vector no entiende de fronteras, así que una consulta en español
   * puede encontrar una fila inglesa y al revés. Recibía un `locale` y un `fallbackLocale` que solo
   * servían para estrecharlo, contradiciendo esa idea.
   *
   * `maxDistance` no es opcional a propósito: sin umbral, el vecino más cercano existe siempre y
   * la búsqueda devolvería cualquier cosa disfrazada de resultado. Es el mismo error que
   * `getRelatedPosts` ya evitaba.
   */
  searchByVector(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    maxDistance: number,
    near?: Coordinates | null,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;
}
