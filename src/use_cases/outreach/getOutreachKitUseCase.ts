import {
  buildListingArticles,
  type ListingArticle,
} from "~/domain/outreach/listingArticles";
import {
  buildOutreachKit,
  type OutreachKit,
} from "~/domain/outreach/outreachText";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type {
  StoredOutreachText,
  TitleLocales,
} from "./ports/IOutreachTextRepository";

export interface OutreachKitView {
  text: StoredOutreachText;
  /** Para un grupo normal: todo junto, en un solo texto. */
  kit: OutreachKit;
  /** Para un grupo de compraventa: un artículo por producto disponible. */
  articles: ListingArticle[];
}

/**
 * Lo que ve quien va a publicar: el texto armado con la lista de **hoy**, y los artículos de
 * compraventa que salen de los mismos productos.
 *
 * Se arma en cada lectura y no al guardar: un texto armado el lunes anunciaría el miércoles el
 * precio y las existencias del lunes, que es justo lo que esta herramienta vino a evitar.
 */
export default class GetOutreachKitUseCase {
  constructor(private readonly repository: IOutreachTextRepository) {}

  async execute(
    id: string,
    locales: TitleLocales,
  ): Promise<OutreachKitView | null> {
    const text = await this.repository.findById(id, locales);

    if (!text) return null;

    return {
      text,
      kit: buildOutreachKit(text, text.products),
      articles: buildListingArticles(text.products),
    };
  }
}
