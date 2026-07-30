import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { TEST_CATEGORY_PREFIX, TEST_SLUG_PREFIX } from "./testSlug";

export interface TestDataCount {
  posts: number;
  categories: number;
}

const SLUG_PATTERN = `${TEST_SLUG_PREFIX}%`;
const CATEGORY_PATTERN = `${TEST_CATEGORY_PREFIX}%`;

/**
 * Borra todo lo que la suite haya sembrado, exista o no el test que lo creó.
 *
 * El orden no es cosmético: `posts.category` tiene un FK `ON DELETE RESTRICT`, así que una
 * categoría de prueba con una publicación colgando no se puede borrar hasta que la publicación se
 * va. `post_translations` y `post_media` caen por cascada.
 *
 * Se borra por `post_id` y no con un `DELETE ... USING`, para que una publicación con varias
 * traducciones se vaya entera aunque solo una lleve el prefijo.
 */
export async function sweepTestData(): Promise<TestDataCount> {
  const posts = await db.execute(sql`
    DELETE FROM posts
    WHERE id IN (
      SELECT post_id FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}
    )
    OR category LIKE ${CATEGORY_PATTERN}
    OR sub_category LIKE ${CATEGORY_PATTERN}
  `);

  const categories = await db.execute(sql`
    DELETE FROM categories WHERE key LIKE ${CATEGORY_PATTERN}
  `);

  return { posts: posts.rowCount ?? 0, categories: categories.rowCount ?? 0 };
}

/** Lo que queda; se afirma en cero al terminar para que un residuo no pase inadvertido. */
export async function countTestData(): Promise<TestDataCount> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}) AS posts,
      (SELECT count(*)::int FROM categories WHERE key LIKE ${CATEGORY_PATTERN}) AS categories
  `);

  return result.rows[0] as unknown as TestDataCount;
}

export function describeTestData(count: TestDataCount): string {
  return `${count.posts} publicación(es) y ${count.categories} categoría(s) de prueba`;
}
