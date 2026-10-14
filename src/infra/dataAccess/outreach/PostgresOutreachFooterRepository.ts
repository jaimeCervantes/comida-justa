import { asc, eq } from "drizzle-orm";
import type { OutreachFooterDraft } from "~/domain/outreach/footerDraft";
import { db } from "~/infra/dataAccess/db/connection";
import { outreachFooters } from "~/infra/dataAccess/db/schema/outreach";
import type IOutreachFooterRepository from "~/use_cases/outreach/ports/IOutreachFooterRepository";
import type { StoredOutreachFooter } from "~/use_cases/outreach/ports/IOutreachTextRepository";

const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLUMNS = {
  id: outreachFooters.id,
  name: outreachFooters.name,
  body: outreachFooters.body,
};

/** Los pies compartidos. Corregir uno cambia el final de todos los textos que lo llevan. */
export default class PostgresOutreachFooterRepository
  implements IOutreachFooterRepository
{
  async list(): Promise<StoredOutreachFooter[]> {
    return db
      .select(COLUMNS)
      .from(outreachFooters)
      .orderBy(asc(outreachFooters.name), asc(outreachFooters.id));
  }

  async findById(id: string): Promise<StoredOutreachFooter | null> {
    if (!UUID_SHAPE.test(id)) return null;

    const [row] = await db
      .select(COLUMNS)
      .from(outreachFooters)
      .where(eq(outreachFooters.id, id))
      .limit(1);

    return row ?? null;
  }

  async create(footer: OutreachFooterDraft): Promise<string> {
    const [created] = await db
      .insert(outreachFooters)
      .values(footer)
      .returning({ id: outreachFooters.id });

    return created.id;
  }

  async update(id: string, footer: OutreachFooterDraft): Promise<boolean> {
    if (!UUID_SHAPE.test(id)) return false;

    const updated = await db
      .update(outreachFooters)
      .set({ ...footer, updatedAt: new Date() })
      .where(eq(outreachFooters.id, id))
      .returning({ id: outreachFooters.id });

    return updated.length > 0;
  }

  async delete(id: string): Promise<boolean> {
    if (!UUID_SHAPE.test(id)) return false;

    const removed = await db
      .delete(outreachFooters)
      .where(eq(outreachFooters.id, id))
      .returning({ id: outreachFooters.id });

    return removed.length > 0;
  }
}
