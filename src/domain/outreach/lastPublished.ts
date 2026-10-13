/** Cuándo se publicó algo en un grupo, por última vez. */
export interface PublicationStamp {
  channelId: string;
  /** El producto vendido suelto en un grupo de compraventa; nulo es la línea entera. */
  postId: string | null;
  lastPublishedAt: Date;
}

const DAY_MS = 86_400_000;

/** El día de calendario de un instante en esa zona, como número de días desde 1970. */
function calendarDay(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);

  return Date.UTC(read("year"), read("month") - 1, read("day")) / DAY_MS;
}

/**
 * Cuántos días de calendario pasaron, o nulo si nunca se publicó.
 *
 * **De calendario y no de 24 horas**, en la zona de quien publica: lo que se publicó a las 23:50 fue
 * «ayer» a las 00:10, y es así como lo cuenta una persona y como lo cuenta un grupo que pide «una
 * publicación al día».
 */
export function daysSincePublished(
  publishedAt: Date | null,
  now: Date,
  timeZone: string,
): number | null {
  if (!publishedAt) return null;

  return Math.max(
    0,
    calendarDay(now, timeZone) - calendarDay(publishedAt, timeZone),
  );
}

/**
 * La última vez de cada cosa en cada grupo, para preguntar sin recorrer la lista cada vez.
 *
 * La llave junta grupo y producto porque responden preguntas distintas: en un grupo normal se
 * pregunta por la línea entera (`postId` nulo) y en uno de compraventa, por cada pan.
 */
export class PublicationHistory {
  private readonly lastAt = new Map<string, Date>();

  constructor(stamps: readonly PublicationStamp[]) {
    for (const stamp of stamps) {
      const key = PublicationHistory.key(stamp.channelId, stamp.postId);
      const known = this.lastAt.get(key);

      if (!known || known < stamp.lastPublishedAt) {
        this.lastAt.set(key, stamp.lastPublishedAt);
      }
    }
  }

  private static key(channelId: string, postId: string | null): string {
    return `${channelId}\u0000${postId ?? ""}`;
  }

  lastPublishedAt(channelId: string, postId: string | null): Date | null {
    return this.lastAt.get(PublicationHistory.key(channelId, postId)) ?? null;
  }
}
