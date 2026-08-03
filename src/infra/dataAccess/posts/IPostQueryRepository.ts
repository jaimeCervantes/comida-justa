import type { IndexingCounts } from "~/domain/entities/post/indexingReport";
import type { OriginCount } from "~/domain/entities/post/originReport";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { PostUser } from "../users/IUserRepository";

export interface PostData {
  id: string;
  user: PostUser;
  price: number | null;
  /** Qué es: "anuncio" (default) o "producto". */
  kind?: string;
  /** De dónde/quién viene. `null` = comunidad sin especificar. */
  origin: string | null;
  /** Lo que el chatbot filtra y lo que el vendedor apaga al quedarse sin existencias. */
  isAvailable?: boolean;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  translations: Record<
    string,
    { title: string; slug: string; content: string }
  >;
  media: Array<{ url: string; type: string; alt?: string }>;
  /**
   * A cuántos metros está la tienda de quien mira. `null` cuando falta cualquiera de las dos
   * ubicaciones —o cuando el listado ni siquiera preguntó por cercanía—, que es el caso normal.
   */
  distanceMeters?: number | null;
  createdAt: Date;
}

export interface PaginatedPostsResult {
  posts: PostData[];
  nextPage: number | null;
  prevPage: number;
  total: number;
  totalPages: number;
}

export interface IPostQueryRepository {
  getMultiplePosts(
    page: number,
    pageSize: number,
    /** Dónde está quien mira. El home no reordena por cercanía: solo pone la distancia. */
    near?: Coordinates | null,
  ): Promise<PaginatedPostsResult>;
  /**
   * Todo lo que se vende, sea de quien sea: `kind = producto`, cualquier `origin`.
   *
   * Es lo que lista `/productos`. No filtra por procedencia a propósito: la página dejó de ser el
   * escaparate de la marca para ser el de la comunidad.
   */
  getProducts(
    page: number,
    pageSize: number,
    /** Dónde está quien mira. Con ella el listado sale por cercanía; sin ella, por fecha. */
    near?: Coordinates | null,
  ): Promise<PaginatedPostsResult>;
  /**
   * Solo lo que vende Hazlo Sano: `kind = producto` con `origin` `hazlo_sano_*`.
   *
   * Hoy no lo llama ninguna página —`/productos` pasó a `getProducts`— pero se conserva porque el
   * concepto sigue existiendo en el dominio (`isHazloSanoProduct`, la insignia de procedencia y el
   * reporte de `/admin/productos`), y es el filtro que haría falta el día que la marca quiera su
   * propio escaparate.
   */
  getHazloSanoProducts(
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult>;
  /**
   * El catálogo de una tienda: lo que se publicó con su `seller_id`.
   *
   * Lo agotado se oculta salvo que mire su dueño, que necesita verlo para volver a ofrecerlo.
   */
  getPostsBySeller(
    sellerId: string,
    page: number,
    pageSize: number,
    options?: { includeSoldOut?: boolean },
  ): Promise<PaginatedPostsResult>;
  /**
   * El catálogo filtrado por categoría. Recibe **las claves ya resueltas** —la clave pedida más
   * su subárbol— y no la clave suelta: quién decide qué cuelga de qué es la taxonomía
   * (`subtreeKeys`), no el repositorio.
   *
   * Se busca en `category` y en `sub_category` porque una publicación guarda las dos: pedir
   * `alimentacion` trae las 14, y pedir `jugos` trae solo la suya.
   */
  getPostsByCategory(
    categoryKeys: readonly string[],
    page: number,
    pageSize: number,
    /** Dónde está quien mira: una categoría ordena por cercanía, igual que el catálogo. */
    near?: Coordinates | null,
  ): Promise<PaginatedPostsResult>;
  /**
   * Las publicaciones más parecidas a una, ordenadas por su vector (`embedding <=>`).
   *
   * Es el mismo vector con el que el chatbot busca. Excluye la propia publicación y devuelve vacío
   * cuando no hay vector: sin parecido que ordenar, "las más recientes" serían cualquier cosa
   * disfrazada de recomendación.
   */
  getRelatedPosts(
    slug: string,
    locale: string,
    limit: number,
  ): Promise<PostData[]>;
  /** Todo lo de una persona, anuncios incluidos: su perfil no es un catálogo. */
  getPostsByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<PaginatedPostsResult>;
  getTotalPosts(): Promise<number>;
  /** Cuántos productos hay por `origin` (`null` incluido). Base del reporte de procedencia. */
  getProductCountsByOrigin(): Promise<OriginCount[]>;
  /** Traducciones de producto con y sin vector: lo que el chatbot puede y no puede ver. */
  getProductIndexingCounts(): Promise<IndexingCounts>;
}
