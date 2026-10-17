import { SELLABLE_KINDS } from "~/domain/entities/post/kind";
import { resolvePostTranslation } from "~/domain/entities/post/translations";
import { searchWords } from "~/domain/search/searchWords";
import type { ISearchPostDTO } from "~/use_cases/searchPosts/dtos/ISearchPostDTO";
import type { ISearchPostResultDTO } from "~/use_cases/searchPosts/dtos/ISearchPostResultDTO";
import type { SearchPostsResult } from "~/use_cases/searchPosts/SearchPostsUseCase";
import type IOutreachProductFinder from "./ports/IOutreachProductFinder";
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
 * El buscador del formulario de difusión, en dos tiempos y siempre entre lo que se vende.
 *
 * **Primero, las palabras sueltas contenidas en el título** (slice 10): aquí se busca un producto
 * que uno ya sabe que existe, por los pedazos de nombre que recuerda. «madr canel» encuentra «Pan de
 * masa madre de canela» y «pina» encuentra «piña», que la búsqueda del sitio no da: solo reconoce
 * palabras completas y no iguala la ñ.
 *
 * **Si las palabras no encuentran nada, la búsqueda del sitio** (slice 8): palabras completas con
 * ranking y, si tampoco, el rescate por sentido. Es lo que deja buscar «algo para dormir».
 *
 * Los dos filtran lo que se vende en la consulta, no después, para que el total y las páginas digan
 * la verdad.
 *
 * Quien la construye no le pasa medición: el administrador armando una publicación no es un
 * visitante buscando, y contarlo ensuciaría lo que se aprende de las búsquedas del sitio.
 */
export default class SearchOutreachProductsUseCase {
  constructor(
    private readonly finder: IOutreachProductFinder,
    private readonly search: PostSearch,
  ) {}

  async execute(
    term: string,
    page: number,
    locales: TitleLocales,
  ): Promise<OutreachProductPage> {
    const words = searchWords(term);
    const wanted = Number.isInteger(page) && page >= 1 ? page : 1;

    if (words.length === 0) {
      return {
        matches: [],
        total: 0,
        page: 1,
        pageSize: OUTREACH_SEARCH_PAGE_SIZE,
      };
    }

    const byWords = await this.finder.findByWords(
      words,
      wanted,
      OUTREACH_SEARCH_PAGE_SIZE,
      locales,
      SELLABLE_KINDS,
    );

    if (byWords.total > 0) {
      return { ...byWords, page: wanted, pageSize: OUTREACH_SEARCH_PAGE_SIZE };
    }

    const { results, total } = await this.search.execute({
      query: term.trim(),
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
