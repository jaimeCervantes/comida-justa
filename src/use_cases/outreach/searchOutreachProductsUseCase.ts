import { SELLABLE_KINDS } from "~/domain/entities/post/kind";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import type { ISearchPostDTO } from "~/use_cases/searchPosts/dtos/ISearchPostDTO";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";
import type { SearchPostsResult } from "~/use_cases/searchPosts/SearchPostsUseCase";
import type { TitleLocales } from "./ports/IOutreachTextRepository";

/** Diez: la página cabe en la pantalla del formulario sin empujar lo de abajo. */
export const OUTREACH_SEARCH_PAGE_SIZE = 10;

/** Un producto que se puede ligar a una publicación, tal como lo ofrece el buscador. */
export interface OutreachProductOption {
  postId: string;
  title: string;
  price: number | null;
}

/** Un resultado del buscador: lo que se liga, más la foto con la que se reconoce. */
export interface OutreachProductMatch extends OutreachProductOption {
  photoUrl: string | null;
}

export interface OutreachProductPage {
  matches: OutreachProductMatch[];
  total: number;
  page: number;
  pageSize: number;
}

/** La búsqueda del sitio, tal como este caso de uso la necesita. */
export interface PostSearch {
  execute(dto: ISearchPostDTO): Promise<SearchPostsResult>;
}

function toMatch(
  result: ISearchPostResultDTO,
  { locale, fallbackLocale }: TitleLocales,
): OutreachProductMatch {
  const translation = resolvePostTranslation(
    result.translations,
    locale,
    fallbackLocale,
  );

  return {
    postId: result.id,
    title: translation?.title ?? result.title ?? "",
    price: result.price ?? null,
    photoUrl: result.media?.find((file) => file.type === "image")?.url ?? null,
  };
}

/**
 * El buscador del formulario de difusión: **la misma búsqueda que el sitio** —texto completo con
 * ranking y, si el texto no encuentra nada, el rescate por sentido—, limitada a lo que se vende.
 *
 * Antes comparaba letras del título en el navegador y se quedaba con ocho: «pan chocolate» no
 * encontraba «Pan de Masa Madre de Chocolate», y lo que el buscador del sitio sí encontraba aquí no
 * salía. Lo que se vende se filtra en la consulta, no después, para que el total y las páginas
 * digan la verdad.
 *
 * Quien la construye no le pasa medición: el administrador armando una publicación no es un
 * visitante buscando, y contarlo ensuciaría lo que se aprende de las búsquedas del sitio.
 */
export default class SearchOutreachProductsUseCase {
  constructor(private readonly search: PostSearch) {}

  async execute(
    term: string,
    page: number,
    locales: TitleLocales,
  ): Promise<OutreachProductPage> {
    const query = term.trim();
    const wanted = Number.isInteger(page) && page >= 1 ? page : 1;

    if (!query) {
      return {
        matches: [],
        total: 0,
        page: 1,
        pageSize: OUTREACH_SEARCH_PAGE_SIZE,
      };
    }

    const { results, total } = await this.search.execute({
      query,
      page: wanted,
      pageSize: OUTREACH_SEARCH_PAGE_SIZE,
      locale: locales.locale,
      kinds: SELLABLE_KINDS,
    });

    return {
      matches: results.map((result) => toMatch(result, locales)),
      total,
      page: wanted,
      pageSize: OUTREACH_SEARCH_PAGE_SIZE,
    };
  }
}
