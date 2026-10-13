import { count, desc, eq, sql } from "drizzle-orm";
import type {
  OutreachTextDraft,
  OutreachTextDraftItem,
} from "~/domain/outreach/outreachTextDraft";
import { db } from "~/infra/dataAccess/db/connection";
import {
  outreachTextItems,
  outreachTexts,
} from "~/infra/dataAccess/db/schema/outreach";
import type IOutreachTextRepository from "~/use_cases/outreach/ports/IOutreachTextRepository";
import type {
  OutreachTextSummary,
  StoredOutreachProduct,
  StoredOutreachText,
  TitleLocales,
} from "~/use_cases/outreach/ports/IOutreachTextRepository";

/** `outreach_texts.id` es `uuid`: compararlo con otra cosa es un error de la base, no un «no está». */
const UUID_SHAPE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProductRow {
  post_id: string;
  label: string;
  emoji: string | null;
  position: number;
  kind: string;
  price: string | null;
  is_available: boolean;
  stock_quantity: number | null;
  moderation_status: string;
  title: string | null;
}

/**
 * Los textos de difusión y sus productos, cruzados con lo que `posts` dice **hoy**.
 *
 * Lee `posts` **sin** filtrar por moderación, a propósito: un pan que se bajó sigue ligado al texto
 * y la pantalla tiene que decir que quedó fuera por eso. Quién sale en la lista lo decide
 * `decideListing` en el dominio, no esta consulta.
 */
export default class PostgresOutreachTextRepository
  implements IOutreachTextRepository
{
  async list(): Promise<OutreachTextSummary[]> {
    const rows = await db
      .select({
        id: outreachTexts.id,
        name: outreachTexts.name,
        updatedAt: outreachTexts.updatedAt,
        productCount: count(outreachTextItems.id),
      })
      .from(outreachTexts)
      .leftJoin(
        outreachTextItems,
        eq(outreachTextItems.outreachTextId, outreachTexts.id),
      )
      .groupBy(outreachTexts.id)
      .orderBy(desc(outreachTexts.updatedAt));

    return rows.map((row) => ({
      ...row,
      productCount: Number(row.productCount),
    }));
  }

  async findById(
    id: string,
    locales: TitleLocales,
  ): Promise<StoredOutreachText | null> {
    if (!UUID_SHAPE.test(id)) return null;

    const [text] = await db
      .select({
        id: outreachTexts.id,
        name: outreachTexts.name,
        opening: outreachTexts.opening,
        closing: outreachTexts.closing,
      })
      .from(outreachTexts)
      .where(eq(outreachTexts.id, id))
      .limit(1);

    if (!text) return null;

    return { ...text, products: await this.productsOf(id, locales) };
  }

  async create(draft: OutreachTextDraft): Promise<string> {
    return db.transaction(async (tx) => {
      const [created] = await tx
        .insert(outreachTexts)
        .values({
          name: draft.name,
          opening: draft.opening,
          closing: draft.closing,
        })
        .returning({ id: outreachTexts.id });

      await insertItems(tx, created.id, draft.items);

      return created.id;
    });
  }

  /** Reemplaza los productos en vez de reconciliarlos: son pocos, y el orden es parte del dato. */
  async update(id: string, draft: OutreachTextDraft): Promise<boolean> {
    if (!UUID_SHAPE.test(id)) return false;

    return db.transaction(async (tx) => {
      const updated = await tx
        .update(outreachTexts)
        .set({
          name: draft.name,
          opening: draft.opening,
          closing: draft.closing,
          updatedAt: new Date(),
        })
        .where(eq(outreachTexts.id, id))
        .returning({ id: outreachTexts.id });

      if (updated.length === 0) return false;

      await tx
        .delete(outreachTextItems)
        .where(eq(outreachTextItems.outreachTextId, id));
      await insertItems(tx, id, draft.items);

      return true;
    });
  }

  private async productsOf(
    id: string,
    { locale, fallbackLocale }: TitleLocales,
  ): Promise<StoredOutreachProduct[]> {
    const raw = await db.execute(sql`
      SELECT
        i.post_id,
        i.label,
        i.emoji,
        i.position,
        p.kind,
        p.price::text AS price,
        p.is_available,
        p.stock_quantity,
        p.moderation_status,
        t.title
      FROM outreach_text_items i
      JOIN posts p ON p.id = i.post_id
      LEFT JOIN LATERAL (
        SELECT title
        FROM post_translations
        WHERE post_id = p.id
        ORDER BY (locale = ${locale}) DESC, (locale = ${fallbackLocale}) DESC
        LIMIT 1
      ) t ON TRUE
      WHERE i.outreach_text_id = ${id}::uuid
      ORDER BY i.position ASC
    `);

    return (raw.rows as unknown as ProductRow[]).map((row) => ({
      postId: row.post_id,
      label: row.label,
      emoji: row.emoji,
      position: row.position,
      kind: row.kind,
      price: row.price === null ? null : Number(row.price),
      isAvailable: row.is_available,
      stockQuantity: row.stock_quantity,
      moderationStatus: row.moderation_status,
      // Sin traducción en ningún idioma, la etiqueta es lo único legible que queda.
      title: row.title ?? row.label,
    }));
  }
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** La posición sale del lugar en el borrador: el orden del formulario **es** el orden del texto. */
async function insertItems(
  tx: Transaction,
  outreachTextId: string,
  items: readonly OutreachTextDraftItem[],
): Promise<void> {
  if (items.length === 0) return;

  await tx.insert(outreachTextItems).values(
    items.map((item, position) => ({
      outreachTextId,
      postId: item.postId,
      label: item.label,
      emoji: item.emoji,
      position,
    })),
  );
}
