import {
  calendarDate,
  calendarDay,
  PublicationHistory,
} from "~/domain/outreach/lastPublished";
import {
  buildListingArticles,
  type ListingArticle,
} from "~/domain/outreach/listingArticles";
import {
  buildOutreachKit,
  type OutreachKit,
} from "~/domain/outreach/outreachText";
import {
  type ChannelTurn,
  channelTurn,
  type DailyPace,
  dailyPace,
  type PauseStatus,
  pauseStatus,
  suggestNextListing,
} from "~/domain/outreach/rhythm";
import type { OutreachRhythm } from "~/domain/outreach/rhythmConfig";
import { versionForGroup, versionOfTheDay } from "~/domain/outreach/versions";
import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";
import type { OutreachChannel } from "./ports/IOutreachChannelRepository";
import type IOutreachPublicationRepository from "./ports/IOutreachPublicationRepository";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type {
  StoredOutreachText,
  TitleLocales,
} from "./ports/IOutreachTextRepository";

/** La hora con la que se cuentan «hoy» y los turnos, y en qué zona. La pone quien llama. */
export interface KitClock {
  now: Date;
  timeZone: string;
}

/** Un grupo con la última vez que recibió esto; nulo es nunca. */
export interface ChannelStatus {
  channel: OutreachChannel;
  lastPublishedAt: Date | null;
}

/**
 * Un grupo normal: la última vez que recibió esta línea, si ya le toca otra publicación tuya, y qué
 * versión del texto le toca hoy (desde 0, sobre `kit.versions`).
 */
export interface PostChannelStatus extends ChannelStatus {
  turn: ChannelTurn;
  version: number;
}

/** Un grupo de compraventa: si ya le toca, y qué pan toca hoy ahí. */
export interface ListingChannelStatus {
  channel: OutreachChannel;
  turn: ChannelTurn;
  /** Nulo si no queda ningún pan disponible que sugerir. */
  suggestion: { postId: string; title: string } | null;
}

/** Un artículo de compraventa con su historial en cada grupo de compraventa. */
export interface ListingArticleView extends ListingArticle {
  channels: ChannelStatus[];
}

export interface OutreachKitView {
  text: StoredOutreachText;
  /** Para un grupo normal: todo junto, en un solo texto. */
  kit: OutreachKit;
  postChannels: PostChannelStatus[];
  listingChannels: ListingChannelStatus[];
  /** Para un grupo de compraventa: un artículo por producto disponible. */
  articles: ListingArticleView[];
  /** Cuántas se marcaron hoy en cualquier grupo, contra el tope. */
  pace: DailyPace;
  /** Si conviene esperar antes de la siguiente, contando desde lo último marcado en cualquier grupo. */
  pause: PauseStatus;
  /** La versión de hoy para la descripción de los artículos, que es una para todos (desde 0). */
  descriptionVersion: number;
}

/**
 * Lo que ve quien va a publicar: el texto armado con la lista de **hoy**, los artículos de
 * compraventa que salen de los mismos productos, en qué grupos ya quedó cada cosa y a cuáles les
 * toca.
 *
 * Se arma en cada lectura y no al guardar: un texto armado el lunes anunciaría el miércoles el
 * precio y las existencias del lunes, que es justo lo que esta herramienta vino a evitar. El ritmo
 * —el turno de cada grupo, el pan que toca, el tope del día— avisa y no impide nada: decide la
 * persona.
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
    clock: KitClock,
    /** El tope del día y la pausa; los lee `src/infra/config` del entorno. */
    rhythm: OutreachRhythm,
  ): Promise<OutreachKitView | null> {
    const text = await this.texts.findById(id, locales);

    if (!text) return null;

    const [channels, stamps, lastByChannel, todayCount] = await Promise.all([
      this.channels.list(),
      this.publications.stampsFor(text.id),
      this.publications.lastByChannel(),
      this.publications.countOn(
        calendarDate(clock.now, clock.timeZone),
        clock.timeZone,
      ),
    ]);
    const history = new PublicationHistory(stamps);
    const articles = buildListingArticles(text.products);
    const listingChannels = channels.filter(
      (channel) => channel.format === "listing",
    );

    const turnOf = (channel: OutreachChannel): ChannelTurn =>
      channelTurn(
        channel.minDaysBetween,
        lastByChannel.get(channel.id) ?? null,
        clock.now,
        clock.timeZone,
      );

    const suggestionFor = (
      channel: OutreachChannel,
    ): ListingChannelStatus["suggestion"] => {
      const postId = suggestNextListing(
        articles.map((article) => article.postId),
        (candidate) => history.lastPublishedAt(channel.id, candidate),
      );
      const article = articles.find((candidate) => candidate.postId === postId);

      return article ? { postId: article.postId, title: article.title } : null;
    };

    const kit = buildOutreachKit(
      {
        opening: text.opening,
        versions: text.versions,
        closing: text.closing,
        footer: text.footer?.body ?? null,
      },
      text.products,
    );
    // El turno de versiones cambia a medianoche de México: es el mismo día que cuenta el tope.
    const today = calendarDay(clock.now, clock.timeZone);

    return {
      text,
      kit,
      postChannels: channels
        .filter((channel) => channel.format === "post")
        .map((channel, index) => ({
          channel,
          lastPublishedAt: history.lastPublishedAt(channel.id, null),
          turn: turnOf(channel),
          version: versionForGroup(today, index, kit.versions.length),
        })),
      listingChannels: listingChannels.map((channel) => ({
        channel,
        turn: turnOf(channel),
        suggestion: suggestionFor(channel),
      })),
      articles: articles.map((article) => ({
        ...article,
        channels: listingChannels.map((channel) => ({
          channel,
          lastPublishedAt: history.lastPublishedAt(channel.id, article.postId),
        })),
      })),
      pace: dailyPace(todayCount, rhythm.dailyLimit),
      pause: pauseStatus(
        latestOf(lastByChannel),
        clock.now,
        rhythm.pauseMinutes,
      ),
      descriptionVersion: versionOfTheDay(today, kit.versions.length),
    };
  }
}

/** Lo último que se marcó en cualquier grupo: la pausa no distingue de qué grupo fue. */
function latestOf(lastByChannel: ReadonlyMap<string, Date>): Date | null {
  let latest: Date | null = null;

  for (const at of lastByChannel.values()) {
    if (!latest || at > latest) latest = at;
  }

  return latest;
}
