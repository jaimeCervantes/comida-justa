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
    categoryKeys?: readonly string[],
    /** `true` deja fuera lo agotado. `undefined` no filtra: es el estado por omisión. */
    onlyAvailable?: boolean,
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
  /**
   * Cuántos resultados de esta búsqueda caen en cada pilar, **sin aplicar el filtro de pilar**.
   *
   * Es lo que convierte el filtro en una faceta: un chip que dice «Alimentación 14» promete algo
   * comprobable, y uno que dice «Mente y Espíritu 0» ahorra el clic que no lleva a ninguna parte.
   * Se cuenta sobre el mismo texto que filtra la búsqueda textual — y solo tiene sentido cuando fue
   * esa la que respondió: si contestó el rescate semántico es porque el texto no encontró nada, y
   * entonces estos números serían todos cero al lado de resultados que sí existen.
   *
   * La clave es la **categoría raíz** de la publicación, que es el pilar: `alimentacion`,
   * `sueno_y_descanso`, `movimiento_y_ejercicio`, `mente_y_espiritu`.
   */
  countByCategory(
    query: string,
    onlyAvailable?: boolean,
  ): Promise<Readonly<Record<string, number>>>;

  searchByVector(
    embedding: readonly number[],
    page: number,
    pageSize: number,
    maxDistance: number,
    near?: Coordinates | null,
    categoryKeys?: readonly string[],
    onlyAvailable?: boolean,
  ): Promise<{ results: ISearchPostResultDTO[]; total: number }>;
}
