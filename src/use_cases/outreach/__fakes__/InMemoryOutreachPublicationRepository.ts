import {
  calendarDate,
  type PublicationStamp,
} from "~/domain/outreach/lastPublished";
import type IOutreachPublicationRepository from "../ports/IOutreachPublicationRepository";
import type { NewOutreachPublication } from "../ports/IOutreachPublicationRepository";

interface StoredPublication extends NewOutreachPublication {
  publishedAt: Date;
}

/**
 * El historial sin base. La hora la pone `now`, que la prueba controla, como la pondría el
 * `DEFAULT now()` de la columna.
 */
export default class InMemoryOutreachPublicationRepository
  implements IOutreachPublicationRepository
{
  readonly recorded: StoredPublication[] = [];

  constructor(
    private readonly now: () => Date = () => new Date(),
    /** Qué productos lleva cada texto, para responder como la consulta real. */
    private readonly productsOf: (
      outreachTextId: string,
    ) => string[] = () => [],
  ) {}

  async record(publications: readonly NewOutreachPublication[]): Promise<void> {
    for (const publication of publications) {
      this.recorded.push({ ...publication, publishedAt: this.now() });
    }
  }

  async stampsFor(outreachTextId: string): Promise<PublicationStamp[]> {
    const products = new Set(this.productsOf(outreachTextId));

    return this.recorded
      .filter((publication) =>
        publication.postId === null
          ? publication.outreachTextId === outreachTextId
          : products.has(publication.postId),
      )
      .map((publication) => ({
        channelId: publication.channelId,
        postId: publication.postId,
        lastPublishedAt: publication.publishedAt,
      }));
  }

  async lastByChannel(): Promise<Map<string, Date>> {
    const last = new Map<string, Date>();

    for (const { channelId, publishedAt } of this.recorded) {
      const known = last.get(channelId);
      if (!known || known < publishedAt) last.set(channelId, publishedAt);
    }

    return last;
  }

  async countOn(date: string, timeZone: string): Promise<number> {
    return this.recorded.filter(
      ({ publishedAt }) => calendarDate(publishedAt, timeZone) === date,
    ).length;
  }

  /** Una publicación con su hora, para sembrar historia que la prueba necesita en el pasado. */
  recordAt(publication: NewOutreachPublication, publishedAt: Date): void {
    this.recorded.push({ ...publication, publishedAt });
  }
}
