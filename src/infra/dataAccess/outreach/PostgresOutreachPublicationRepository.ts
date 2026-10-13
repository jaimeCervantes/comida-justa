import { sql } from "drizzle-orm";
import type { PublicationStamp } from "~/domain/outreach/lastPublished";
import { db } from "~/infra/dataAccess/db/connection";
import { outreachPublications } from "~/infra/dataAccess/db/schema/outreach";
import type IOutreachPublicationRepository from "~/use_cases/outreach/ports/IOutreachPublicationRepository";
import type { NewOutreachPublication } from "~/use_cases/outreach/ports/IOutreachPublicationRepository";

interface StampRow {
  channel_id: string;
  post_id: string | null;
  last_published_at: Date | string;
}

/** El historial de difusión: dónde quedó cada cosa, y cuándo. */
export default class PostgresOutreachPublicationRepository
  implements IOutreachPublicationRepository
{
  async record(publications: readonly NewOutreachPublication[]): Promise<void> {
    if (publications.length === 0) return;

    await db.insert(outreachPublications).values([...publications]);
  }

  /**
   * La línea entera de **este** texto en cada grupo, y cada uno de sus productos en cada grupo
   * venga del texto que venga: a un grupo de compraventa le da igual desde qué publicación se
   * vendió el pan, lo que cuenta es que ya lo vio.
   */
  async stampsFor(outreachTextId: string): Promise<PublicationStamp[]> {
    const raw = await db.execute(sql`
      SELECT channel_id, post_id, max(published_at) AS last_published_at
      FROM outreach_publications
      WHERE (outreach_text_id = ${outreachTextId}::uuid AND post_id IS NULL)
         OR post_id IN (
           SELECT post_id FROM outreach_text_items
           WHERE outreach_text_id = ${outreachTextId}::uuid
         )
      GROUP BY channel_id, post_id
    `);

    return (raw.rows as unknown as StampRow[]).map((row) => ({
      channelId: row.channel_id,
      postId: row.post_id,
      lastPublishedAt: new Date(row.last_published_at),
    }));
  }

  /** Lo usa el índice `(channel_id, published_at DESC)` de la migración `0061`. */
  async lastByChannel(): Promise<Map<string, Date>> {
    const raw = await db.execute(sql`
      SELECT channel_id, max(published_at) AS last_published_at
      FROM outreach_publications
      GROUP BY channel_id
    `);

    return new Map(
      (
        raw.rows as unknown as Array<{
          channel_id: string;
          last_published_at: Date | string;
        }>
      ).map((row) => [row.channel_id, new Date(row.last_published_at)]),
    );
  }

  /**
   * El día se compara en la zona de quien publica, no en UTC: a las 19:00 de México ya es mañana
   * en UTC, y contar en UTC partiría la tarde de hoy en dos días.
   */
  async countOn(date: string, timeZone: string): Promise<number> {
    const raw = await db.execute(sql`
      SELECT count(*)::int AS total
      FROM outreach_publications
      WHERE (published_at AT TIME ZONE ${timeZone})::date = ${date}::date
    `);

    return (raw.rows as Array<{ total: number }>)[0]?.total ?? 0;
  }
}
