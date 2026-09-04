import type { IndexingCounts } from "~/domain/entities/post/indexingReport";
import type { OriginCount } from "~/domain/entities/post/originReport";
import type { PostMediaFile } from "~/domain/entities/post/types";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { PostUser } from "../users/IUserRepository";

export interface PostData {
  id: string;
  user: PostUser;
  /**
   * La tienda que lo vende, o `null` si se publicó a título personal.
   *
   * Viaja con el listado desde el slice 8: la tarjeta enseña el logo junto a la categoría y la
   * distancia. Antes solo se sabía la distancia —que sale de `p.seller_id`— y no de quién era.
   */
  /**
   * La tienda que lo vende (`posts.seller_id`), o `null` si quien publicó no tiene.
   *
   * Va aparte de `seller`, que es lo que se **pinta** —nombre y logo—: esto es lo que se
   * **compara**. Sin él, `canManagePost` en una tarjeta sólo podía preguntar por quién publicó, y
   * el dueño de una tienda no veía nada sobre lo que escribió otra mano.
   */
  sellerId?: string | null;
  seller?: {
    handle: string;
    name: string;
    logoUrl?: string | null;
  } | null;
  price: number | null;
  /** Qué es: "anuncio" (default) o "producto". */
  kind?: string;
  /** De dónde/quién viene. `null` = comunidad sin especificar. */
  origin: string | null;
  /** Lo que el chatbot filtra y lo que el vendedor apaga al quedarse sin existencias. */
  isAvailable?: boolean;
  /**
   * Cuántas quedan, o `null` si no lleva inventario. **Nulo no es cero.**
   *
   * Viaja hasta la tarjeta porque ahí se edita: quien mira su catálogo arregla lo que ve sin abrir
   * cada publicación. Ver `CardOwnerControls`.
   */
  stockQuantity?: number | null;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  translations: Record<
    string,
    { title: string; slug: string; content: string }
  >;
  media: PostMediaFile[];
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

export interface PostListingFilters {
  /** Claves de taxonomía permitidas; `[]` significa "no hay ninguna activa", no "sin filtro". */
  categoryKeys?: readonly string[];
}

/** Qué hay cerca de quien mira: cuánto, y a qué distancia lo primero. */
export interface NearbySummary {
  count: number;
  /** La distancia a la publicación más cercana, o `null` cuando no hay ninguna dentro del radio. */
  nearestMeters: number | null;
}

export interface IPostQueryRepository {
  getMultiplePosts(
    page: number,
    pageSize: number,
    /** Dónde está quien mira. El home no reordena por cercanía: solo pone la distancia. */
    near?: Coordinates | null,
    filters?: PostListingFilters,
  ): Promise<PaginatedPostsResult>;
  /**
   * Cuántas publicaciones tienen su tienda dentro de un radio de quien mira, y a qué distancia
   * queda la más cercana.
   *
   * Es un resumen aparte y no el `total` de un listado **a propósito**: el home lista lo último de
   * la comunidad, sin filtrar por cercanía, y ese contrato no cambia. Lo que esto contesta es otra
   * pregunta —«cuánto de esto me queda cerca, y qué tan cerca»—, así que se pregunta aparte en vez
   * de torcer el listado para que su total sirva de dos cosas.
   *
   * Las dos cifras salen de la **misma** consulta: pedirlas por separado abriría la puerta a que
   * una diga «hay 8» y la otra mida contra una novena que entró entre las dos.
   *
   * Una publicación sin tienda, o con tienda sin sucursal, no tiene distancia: no cuenta. Es la
   * misma regla que ya aplica `distanceColumn` al dejarlas en `NULL`.
   */
  summarizeNearby(
    near: Coordinates,
    radiusMeters: number,
  ): Promise<NearbySummary>;
  /**
   * Todo lo comercial, sea de quien sea: productos que se entregan y servicios que se agendan.
   *
   * Es lo que lista `/productos`. La URL queda por compatibilidad, pero la página ya no es solo
   * mercancía: entra lo que la comunidad vende o atiende. Los eventos quedan fuera porque ocurren
   * en una fecha y tienen su propia agenda pública.
   */
  getProducts(
    page: number,
    pageSize: number,
    /** Dónde está quien mira. Con ella el listado sale por cercanía; sin ella, por fecha. */
    near?: Coordinates | null,
    filters?: PostListingFilters,
  ): Promise<PaginatedPostsResult>;
  /**
   * La agenda pública: solo publicaciones que ocurren, ordenadas por `starts_at`.
   *
   * No usa cercanía todavía. Un evento puede tener ruta o punto de encuentro, pero la pregunta
   * principal de esta página es "qué viene primero", no "qué tienda queda más cerca".
   */
  getEvents(page: number, pageSize: number): Promise<PaginatedPostsResult>;
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
    options?: {
      includeSoldOut?: boolean;
      categoryKeys?: readonly string[];
      /** Filtra el catálogo por título, en cualquiera de sus idiomas. */
      term?: string;
    },
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
    filters?: PostListingFilters,
  ): Promise<PaginatedPostsResult>;
  /**
   * Las publicaciones más parecidas a una, ordenadas por su vector (`embedding <=>`).
   *
   * Es el mismo vector con el que el chatbot busca. Excluye la propia publicación y devuelve vacío
   * cuando no hay vector: sin parecido que ordenar, "las más recientes" serían cualquier cosa
   * disfrazada de recomendación.
   */
  getRelatedPosts(
    /**
     * La publicación de referencia, por **id** y no por slug.
     *
     * Con el slug, pedir la ficha en un idioma cuya traducción todavía no existe dejaba la semilla
     * vacía y el bloque entero desaparecía. El id es el mismo en todos los idiomas.
     */
    postId: string,
    locale: string,
    /** A qué idioma caer para el vector cuando el pedido no lo tiene. */
    fallbackLocale: string,
    limit: number,
  ): Promise<PostData[]>;
  /** Todo lo de una persona, anuncios incluidos: su perfil no es un catálogo. */
  getPostsByUser(
    userId: string,
    page: number,
    pageSize: number,
    /**
     * Quién está mirando. Cuando coincide con `userId`, el perfil también enseña lo que se le bajó
     * a esa persona: es por donde se entera, porque el sitio no manda correos.
     */
    viewerId?: string | null,
    filters?: PostListingFilters,
  ): Promise<PaginatedPostsResult>;
  getTotalPosts(): Promise<number>;
  /** Cuántos productos hay por `origin` (`null` incluido). Base del reporte de procedencia. */
  getProductCountsByOrigin(): Promise<OriginCount[]>;
  /** Traducciones de producto con y sin vector: lo que el chatbot puede y no puede ver. */
  getProductIndexingCounts(): Promise<IndexingCounts>;
}
