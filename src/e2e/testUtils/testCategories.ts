import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Prefijo de toda categoría creada por la suite.
 *
 * Existe para poder **barrer** lo que quede de corridas anteriores, no solo lo de esta: un
 * `afterEach` no corre si el proceso muere a mitad, y esta base la comparten tres repos. Ya pasó
 * una vez —tres publicaciones sembradas sobrevivieron a una corrida caída y rompieron el golden del
 * backend—, así que la limpieza no puede depender de que el final del test se ejecute.
 */
export const TEST_CATEGORY_PREFIX = "e2e_";

export function testCategoryKey(name: string): string {
  return `${TEST_CATEGORY_PREFIX}${name}_${Date.now()}`;
}

/**
 * Borra toda categoría de prueba y lo que cuelgue de ella.
 *
 * El orden importa: el FK de `posts` es `ON DELETE RESTRICT`, así que primero se van las
 * publicaciones que la usan y después la categoría.
 */
export async function cleanupTestCategories(): Promise<void> {
  const pattern = `${TEST_CATEGORY_PREFIX}%`;

  await db.execute(sql`
    DELETE FROM posts
    WHERE category LIKE ${pattern} OR sub_category LIKE ${pattern}
  `);

  // `category_translations` cae por ON DELETE CASCADE.
  await db.execute(sql`DELETE FROM categories WHERE key LIKE ${pattern}`);
}

/** Cuántas categorías de prueba quedan; se afirma en 0 para que un residuo no pase inadvertido. */
export async function countTestCategories(): Promise<number> {
  const result = await db.execute(sql`
    SELECT count(*)::int AS n FROM categories WHERE key LIKE ${`${TEST_CATEGORY_PREFIX}%`}
  `);

  return (result.rows[0] as { n: number }).n;
}
