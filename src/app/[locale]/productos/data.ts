import { isWithinSustainableRadius } from "~/domain/entities/seller/proximity";
import { PAGINATION_INIT_PAGE, PAGINATION_PAGE_SIZE } from "~/infra/constants";
import {
  createPostQueryRepository,
  type PostData,
} from "~/infra/dataAccess/getMultiplePosts";
import { readVisitorLocation } from "~/infra/location/visitorLocation";
import type { Post } from "~/infra/types/Posts";
import { mapPostsToCardsForLocale } from "~/infra/UI/mappers/posts/mapPostsToCardsForLocale";

export type ProductsPageData = {
  products: Post[];
  totalPages: number;
  total: number;
  /**
   * Quien mira compartió su ubicación y aun así lo más cercano queda fuera del radio sostenible.
   *
   * No cambia lo que se lista —seguir mostrando lo lejano es mejor que una página vacía— pero sí
   * lo que se le dice: que esto es lo que hay, aunque quede lejos.
   */
  nothingNearby: boolean;
};

/**
 * Todo lo que la comunidad pone a la venta.
 *
 * Antes esta página listaba **solo** lo de Hazlo Sano (`origin` `hazlo_sano_*`), así que lo que
 * publicaba un vendedor local no aparecía en la única pantalla que se llama «Productos». Ahora el
 * filtro es únicamente `kind = producto`: entra todo el que vende y quedan fuera los anuncios,
 * que es la distinción que la página quiere hacer.
 *
 * Cada tarjeta sigue llevando su insignia de procedencia, así que se distingue a simple vista lo
 * que es de la marca de lo que es de un vecino.
 */
export async function getProducts(
  page: number,
  locale: string,
): Promise<ProductsPageData> {
  const pageNum = Math.max(PAGINATION_INIT_PAGE, page);
  const postRepo = createPostQueryRepository();
  const near = await readVisitorLocation();

  const result = await postRepo.getProducts(
    pageNum,
    PAGINATION_PAGE_SIZE,
    near,
  );

  return {
    products: await mapPostsToCardsForLocale(result.posts, locale),
    totalPages: result.totalPages,
    total: result.total,
    nothingNearby: Boolean(near) && isNothingNearby(result.posts),
  };
}

/**
 * ¿Todo lo que salió queda fuera del radio sostenible?
 *
 * Se mira la primera fila y no todas: la consulta ya vino ordenada por distancia, así que si la
 * más cercana está lejos, todas lo están. Una publicación sin distancia (sin tienda, o con tienda
 * sin sucursal) tampoco cuenta como cercana.
 */
function isNothingNearby(posts: readonly PostData[]): boolean {
  if (posts.length === 0) return false;

  const closest = posts[0].distanceMeters;

  return closest === null || closest === undefined
    ? true
    : !isWithinSustainableRadius(closest);
}
