import { sql } from "drizzle-orm";
import type { OutreachChannelInput } from "~/domain/outreach/outreachChannelDraft";
import { db } from "~/infra/dataAccess/db/connection";
import {
  outreachChannels,
  outreachPublications,
} from "~/infra/dataAccess/db/schema/outreach";
import { TEST_OUTREACH_PREFIX } from "./testSlug";

const NAME_PATTERN = `${TEST_OUTREACH_PREFIX}%`;

/**
 * ¿Existe ya la tabla? La crea la migración `0061_2026_10_13` de `hazlo-sano-bot`; hasta que esté
 * aplicada, el barrido final no puede preguntar por ella sin tumbar la suite entera.
 */
export async function outreachChannelsTableExists(): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT to_regclass('public.outreach_channels') IS NOT NULL AS present`,
  );

  return Boolean(
    (result.rows[0] as { present?: boolean } | undefined)?.present,
  );
}

/**
 * Da de alta un grupo directo en la base, para que un `Given` sea un `Given`. El nombre tiene que
 * llevar el marcador de `testOutreachName`, o el barrido no lo encontraría.
 */
export async function seedOutreachChannel(
  channel: OutreachChannelInput,
): Promise<string> {
  if (!channel.name.startsWith(TEST_OUTREACH_PREFIX)) {
    throw new Error(
      `[e2e] «${channel.name}» no lleva el marcador ${TEST_OUTREACH_PREFIX}: el barrido no lo vería.`,
    );
  }

  const [created] = await db
    .insert(outreachChannels)
    .values(channel)
    .returning({ id: outreachChannels.id });

  return created.id;
}

/** Borra los grupos de prueba; su historial cae por `ON DELETE CASCADE`. */
export async function deleteTestOutreachChannels(): Promise<number> {
  if (!(await outreachChannelsTableExists())) return 0;

  const removed = await db.execute(
    sql`DELETE FROM outreach_channels WHERE name LIKE ${NAME_PATTERN}`,
  );

  return removed.rowCount ?? 0;
}

export async function countTestOutreachChannels(): Promise<number> {
  if (!(await outreachChannelsTableExists())) return 0;

  const result = await db.execute(
    sql`SELECT count(*)::int AS total FROM outreach_channels WHERE name LIKE ${NAME_PATTERN}`,
  );

  return (result.rows[0] as { total: number }).total;
}

/** Lo que quedó en el historial de un texto: qué grupo y qué pan, sin las horas. */
export async function readOutreachPublications(
  outreachTextId: string,
): Promise<Array<{ channelId: string; postId: string | null }>> {
  const result = await db.execute(sql`
    SELECT channel_id, post_id
    FROM outreach_publications
    WHERE outreach_text_id = ${outreachTextId}::uuid
    ORDER BY published_at, channel_id
  `);

  return (
    result.rows as unknown as Array<{
      channel_id: string;
      post_id: string | null;
    }>
  ).map((row) => ({ channelId: row.channel_id, postId: row.post_id }));
}

/**
 * Una publicación ya marcada, con la hora que pida el escenario («hace 3 días», «ayer»). Sin esto,
 * probar un turno obligaría a esperar días de verdad. Cae con su texto o su grupo de prueba.
 */
export async function seedOutreachPublication(publication: {
  outreachTextId: string;
  channelId: string;
  postId: string | null;
  publishedAt: Date;
}): Promise<void> {
  await db.insert(outreachPublications).values(publication);
}

/**
 * Si borrar un texto deja sus fechas en el historial: lo trae la `0063` de `hazlo-sano-bot`. Antes
 * de ella la llave era `CASCADE`, y el escenario que lo comprueba no tendría nada que comprobar.
 */
export async function outreachHistoryOutlivesTexts(): Promise<boolean> {
  const result = await db.execute(sql`
    SELECT is_nullable = 'YES' AS outlives
    FROM information_schema.columns
    WHERE table_name = 'outreach_publications' AND column_name = 'outreach_text_id'
  `);

  return Boolean(
    (result.rows[0] as { outlives?: boolean } | undefined)?.outlives,
  );
}
