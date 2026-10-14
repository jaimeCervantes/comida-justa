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
  /**
   * Lo último que se publicó en cada grupo, **de cualquier texto**: es lo que cuenta para el turno,
   * porque la regla de un grupo es «una publicación tuya cada N días», no una por texto.
   */
  lastByChannel(): Promise<Map<string, Date>>;
  /** Cuántas se marcaron en ese día de calendario (`2026-10-13`) de esa zona, en cualquier grupo. */
  countOn(date: string, timeZone: string): Promise<number>;
}
