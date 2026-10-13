import { PublicationHistory } from "~/domain/outreach/lastPublished";
import {
  buildListingArticles,
  type ListingArticle,
} from "~/domain/outreach/listingArticles";
import {
  buildOutreachKit,
  type OutreachKit,
} from "~/domain/outreach/outreachText";
import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";
import type { OutreachChannel } from "./ports/IOutreachChannelRepository";
import type IOutreachPublicationRepository from "./ports/IOutreachPublicationRepository";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type {
  StoredOutreachText,
  TitleLocales,
} from "./ports/IOutreachTextRepository";

/** Un grupo con la última vez que recibió esto; nulo es nunca. */
export interface ChannelStatus {
  channel: OutreachChannel;
  lastPublishedAt: Date | null;
}

/** Un artículo de compraventa con su historial en cada grupo de compraventa. */
export interface ListingArticleView extends ListingArticle {
  channels: ChannelStatus[];
}

export interface OutreachKitView {
  text: StoredOutreachText;
  /** Para un grupo normal: todo junto, en un solo texto. */
  kit: OutreachKit;
  /** Los grupos normales, cada uno con la última vez que recibió la línea entera. */
  postChannels: ChannelStatus[];
  /** Los de compraventa, para abrirlos; la última vez va por pan, en cada artículo. */
  listingChannels: OutreachChannel[];
  /** Para un grupo de compraventa: un artículo por producto disponible. */
  articles: ListingArticleView[];
}

/**
 * Lo que ve quien va a publicar: el texto armado con la lista de **hoy**, los artículos de
 * compraventa que salen de los mismos productos, y en qué grupos ya quedó cada cosa.
 *
 * Se arma en cada lectura y no al guardar: un texto armado el lunes anunciaría el miércoles el
 * precio y las existencias del lunes, que es justo lo que esta herramienta vino a evitar. El tipo
 * de cada grupo decide dónde aparece: el normal junto al texto, el de compraventa junto a los
 * artículos.
 */
export default class GetOutreachKitUseCase {
  constructor(
    private readonly texts: IOutreachTextRepository,
    private readonly channels: IOutreachChannelRepository,
    private readonly publications: IOutreachPublicationRepository,
  ) {}

  async execute(
    id: string,
    locales: TitleLocales,
  ): Promise<OutreachKitView | null> {
    const text = await this.texts.findById(id, locales);

    if (!text) return null;

    const [channels, stamps] = await Promise.all([
      this.channels.list(),
      this.publications.stampsFor(text.id),
    ]);
    const history = new PublicationHistory(stamps);
    const listingChannels = channels.filter(
      (channel) => channel.format === "listing",
    );

    return {
      text,
      kit: buildOutreachKit(text, text.products),
      postChannels: channels
        .filter((channel) => channel.format === "post")
        .map((channel) => ({
          channel,
          lastPublishedAt: history.lastPublishedAt(channel.id, null),
        })),
      listingChannels,
      articles: buildListingArticles(text.products).map((article) => ({
        ...article,
        channels: listingChannels.map((channel) => ({
          channel,
          lastPublishedAt: history.lastPublishedAt(channel.id, article.postId),
        })),
      })),
    };
  }
}
