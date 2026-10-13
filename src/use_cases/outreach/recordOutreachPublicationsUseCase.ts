import type { OutreachChannelFormat } from "~/domain/outreach/channelFormats";
import type IOutreachChannelRepository from "./ports/IOutreachChannelRepository";
import type IOutreachPublicationRepository from "./ports/IOutreachPublicationRepository";
import type IOutreachTextRepository from "./ports/IOutreachTextRepository";
import type { TitleLocales } from "./ports/IOutreachTextRepository";

export interface RecordOutreachPublicationsInput {
  outreachTextId: string;
  channelIds: readonly string[];
  /** El pan vendido suelto; nulo es la línea entera en grupos normales. */
  postId: string | null;
  locales: TitleLocales;
}

export type RecordOutreachPublicationsResult =
  | { status: "recorded"; count: number }
  | { status: "nothing-selected" }
  | { status: "not-found" }
  /** Un grupo de otro tipo, o un pan que no es de este texto: solo llega armado a mano. */
  | { status: "invalid" };

/**
 * Deja escrito dónde quedó publicada una publicación: es el historial que evita repetirse.
 *
 * Nada lo escribe solo: lo marca la persona después de publicar, y de una vez para todos los grupos
 * que eligió en el selector «más grupos» de Facebook. Un grupo normal recibe la línea entera y uno
 * de compraventa, un pan suelto; mezclar los dos sería un historial que miente.
 */
export default class RecordOutreachPublicationsUseCase {
  constructor(
    private readonly texts: IOutreachTextRepository,
    private readonly channels: IOutreachChannelRepository,
    private readonly publications: IOutreachPublicationRepository,
  ) {}

  async execute({
    outreachTextId,
    channelIds,
    postId,
    locales,
  }: RecordOutreachPublicationsInput): Promise<RecordOutreachPublicationsResult> {
    const wanted = [...new Set(channelIds)];

    if (wanted.length === 0) return { status: "nothing-selected" };

    const text = await this.texts.findById(outreachTextId, locales);

    if (!text) return { status: "not-found" };
    if (postId && !text.products.some((product) => product.postId === postId)) {
      return { status: "invalid" };
    }

    const expected: OutreachChannelFormat = postId ? "listing" : "post";
    const known = new Map(
      (await this.channels.list()).map((channel) => [channel.id, channel]),
    );

    if (wanted.some((id) => known.get(id)?.format !== expected)) {
      return { status: "invalid" };
    }

    await this.publications.record(
      wanted.map((channelId) => ({ outreachTextId, channelId, postId })),
    );

    return { status: "recorded", count: wanted.length };
  }
}
