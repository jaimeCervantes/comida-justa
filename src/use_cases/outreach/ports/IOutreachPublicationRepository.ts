import type { PublicationStamp } from "~/domain/outreach/lastPublished";

/** Que algo quedó publicado en un grupo; la hora la pone la base al guardarlo. */
export interface NewOutreachPublication {
  outreachTextId: string;
  channelId: string;
  /** El producto vendido suelto en un grupo de compraventa; nulo es la línea entera. */
  postId: string | null;
}

export default interface IOutreachPublicationRepository {
  /** Todas de una vez: se marcan juntos los grupos elegidos en «más grupos». */
  record(publications: readonly NewOutreachPublication[]): Promise<void>;
  /**
   * La última vez de cada cosa que le importa a un texto: su línea entera en cada grupo, y cada
   * uno de sus productos en cada grupo **venga del texto que venga**, porque a un grupo de
   * compraventa le da igual desde qué publicación se vendió el pan.
   */
  stampsFor(outreachTextId: string): Promise<PublicationStamp[]>;
}
