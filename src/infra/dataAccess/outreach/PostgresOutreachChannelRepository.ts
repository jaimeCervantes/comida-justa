import { asc, eq } from "drizzle-orm";
import {
  isOutreachChannelFormat,
  type OutreachChannelFormat,
} from "~/domain/outreach/channelFormats";
import type { OutreachChannelInput } from "~/domain/outreach/outreachChannelDraft";
import { db } from "~/infra/dataAccess/db/connection";
import { outreachChannels } from "~/infra/dataAccess/db/schema/outreach";
import type IOutreachChannelRepository from "~/use_cases/outreach/ports/IOutreachChannelRepository";
import type { OutreachChannel } from "~/use_cases/outreach/ports/IOutreachChannelRepository";

const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNS = {
  id: outreachChannels.id,
  name: outreachChannels.name,
  url: outreachChannels.url,
  format: outreachChannels.format,
  minDaysBetween: outreachChannels.minDaysBetween,
  notes: outreachChannels.notes,
};

type ChannelRow = {
  id: string;
  name: string;
  url: string;
  format: string;
  minDaysBetween: number;
  notes: string;
};

/**
 * Un formato que la web no conoce —escrito a mano en la base— se lee como grupo normal en vez de
 * romper la pantalla: es la forma que menos promete, un texto libre.
 */
function toChannel(row: ChannelRow): OutreachChannel {
  const format: OutreachChannelFormat = isOutreachChannelFormat(row.format)
    ? row.format
    : "post";

  return { ...row, format };
}

export default class PostgresOutreachChannelRepository
  implements IOutreachChannelRepository
{
  async list(): Promise<OutreachChannel[]> {
    const rows = await db
      .select(COLUMNS)
      .from(outreachChannels)
      .orderBy(asc(outreachChannels.name), asc(outreachChannels.id));

    return rows.map(toChannel);
  }

  async findById(id: string): Promise<OutreachChannel | null> {
    if (!UUID_SHAPE.test(id)) return null;

    const [row] = await db
      .select(COLUMNS)
      .from(outreachChannels)
      .where(eq(outreachChannels.id, id))
      .limit(1);

    return row ? toChannel(row) : null;
  }

  async create(channel: OutreachChannelInput): Promise<string> {
    const [created] = await db
      .insert(outreachChannels)
      .values(channel)
      .returning({ id: outreachChannels.id });

    return created.id;
  }

  async update(id: string, channel: OutreachChannelInput): Promise<boolean> {
    if (!UUID_SHAPE.test(id)) return false;

    const updated = await db
      .update(outreachChannels)
      .set({ ...channel, updatedAt: new Date() })
      .where(eq(outreachChannels.id, id))
      .returning({ id: outreachChannels.id });

    return updated.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_SHAPE.test(id)) return false;

    const removed = await db
      .delete(outreachChannels)
      .where(eq(outreachChannels.id, id))
      .returning({ id: outreachChannels.id });

    return removed.length > 0;
  }
}
