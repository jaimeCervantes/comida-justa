import { sql } from "drizzle-orm";
import type { OutreachTextDraft } from "~/domain/outreach/outreachTextDraft";
import { db } from "~/infra/dataAccess/db/connection";
import {
  outreachFooters,
  outreachTextItems,
  outreachTexts,
  outreachTextVersions,
} from "~/infra/dataAccess/db/schema/outreach";
import { TEST_OUTREACH_PREFIX } from "./testSlug";

const NAME_PATTERN = `${TEST_OUTREACH_PREFIX}%`;

/**
 * Guarda un texto de difusión directo en la base, para que un `Given` sea un `Given`: el escenario
 * que prueba copiar no tiene por qué recorrer el formulario entero antes.
 *
 * El nombre tiene que llevar el marcador de `testOutreachName`, o el barrido no lo encontraría.
 */
export async function seedOutreachText(
  draft: OutreachTextDraft,
): Promise<string> {
  if (!draft.name.startsWith(TEST_OUTREACH_PREFIX)) {
    throw new Error(
      `[e2e] «${draft.name}» no lleva el marcador ${TEST_OUTREACH_PREFIX}: el barrido no lo vería.`,
    );
  }

  const [created] = await db
    .insert(outreachTexts)
    .values({
      name: draft.name,
      opening: draft.opening,
      closing: draft.closing,
      footerId: draft.footerId ?? null,
    })
    .returning({ id: outreachTexts.id });

  if (draft.items.length > 0) {
    await db.insert(outreachTextItems).values(
      draft.items.map((item, position) => ({
        outreachTextId: created.id,
        postId: item.postId,
        label: item.label,
        emoji: item.emoji,
        position,
      })),
    );
  }

  const versions = draft.versions ?? [];
  if (versions.length > 0) {
    await db.insert(outreachTextVersions).values(
      versions.map((opening, index) => ({
        outreachTextId: created.id,
        opening,
        position: index + 2,
      })),
    );
  }

  return created.id;
}

/**
 * Un pie compartido, directo en la base. Con el marcador en el nombre, como los textos: así la
 * suite nunca toca el pie de verdad, que vive en la misma tabla.
 */
export async function seedOutreachFooter(footer: {
  name: string;
  body: string;
}): Promise<string> {
  if (!footer.name.startsWith(TEST_OUTREACH_PREFIX)) {
    throw new Error(
      `[e2e] «${footer.name}» no lleva el marcador ${TEST_OUTREACH_PREFIX}: el barrido no lo vería.`,
    );
  }

  const [created] = await db
    .insert(outreachFooters)
    .values(footer)
    .returning({ id: outreachFooters.id });

  return created.id;
}

/** ¿Existe ya la tabla de pies? La crea la migración `0062_2026_10_13`. */
export async function outreachFootersTableExists(): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT to_regclass('public.outreach_footers') IS NOT NULL AS present`,
  );

  return Boolean(
    (result.rows[0] as { present?: boolean } | undefined)?.present,
  );
}

/** Borra los pies de prueba; los textos que los llevaban se quedan sin pie (`ON DELETE SET NULL`). */
export async function deleteTestOutreachFooters(): Promise<number> {
  if (!(await outreachFootersTableExists())) return 0;

  const removed = await db.execute(
    sql`DELETE FROM outreach_footers WHERE name LIKE ${NAME_PATTERN}`,
  );

  return removed.rowCount ?? 0;
}

export async function countTestOutreachFooters(): Promise<number> {
  if (!(await outreachFootersTableExists())) return 0;

  const result = await db.execute(
    sql`SELECT count(*)::int AS total FROM outreach_footers WHERE name LIKE ${NAME_PATTERN}`,
  );

  return (result.rows[0] as { total: number }).total;
}

/**
 * ¿Existe ya la tabla?
 *
 * La crea la migración `0060_2026_10_13` de `hazlo-sano-bot`. Hasta que esté aplicada en la base
 * contra la que se corre, el barrido final no puede preguntar por ella sin tumbar la suite entera,
 * y nada de lo demás tiene que ver con esta feature.
 */
export async function outreachTablesExist(): Promise<boolean> {
  const result = await db.execute(
    sql`SELECT to_regclass('public.outreach_texts') IS NOT NULL AS present`,
  );

  return Boolean(
    (result.rows[0] as { present?: boolean } | undefined)?.present,
  );
}

/** Borra los textos de prueba; sus productos caen por `ON DELETE CASCADE`. */
export async function deleteTestOutreachTexts(): Promise<number> {
  if (!(await outreachTablesExist())) return 0;

  const removed = await db.execute(
    sql`DELETE FROM outreach_texts WHERE name LIKE ${NAME_PATTERN}`,
  );

  return removed.rowCount ?? 0;
}

export async function countTestOutreachTexts(): Promise<number> {
  if (!(await outreachTablesExist())) return 0;

  const result = await db.execute(
    sql`SELECT count(*)::int AS total FROM outreach_texts WHERE name LIKE ${NAME_PATTERN}`,
  );

  return (result.rows[0] as { total: number }).total;
}
