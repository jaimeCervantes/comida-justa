import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { SUITE_ACCOUNT_EMAIL } from "./suiteAccount";
import { TEST_CATEGORY_PREFIX, TEST_SLUG_PREFIX } from "./testSlug";

export interface TestDataCount {
  posts: number;
  categories: number;
  branches: number;
  sellers: number;
  /** Direcciones personales reclamadas por la suite sobre cuentas reales. */
  usernames: number;
}

const SLUG_PATTERN = `${TEST_SLUG_PREFIX}%`;
const CATEGORY_PATTERN = `${TEST_CATEGORY_PREFIX}%`;

/**
 * Borra todo lo que la suite haya sembrado, exista o no el test que lo creó.
 *
 * El orden no es cosmético: `posts.category` tiene un FK `ON DELETE RESTRICT`, así que una
 * categoría de prueba con una publicación colgando no se puede borrar hasta que la publicación se
 * va. Lo mismo con `posts.seller_id` → `sellers`: la tienda de prueba se borra al final, cuando ya
 * no queda nada apuntándole. `post_translations` y `post_media` caen por cascada.
 *
 * Se borra por `post_id` y no con un `DELETE ... USING`, para que una publicación con varias
 * traducciones se vaya entera aunque solo una lleve el prefijo.
 *
 * Las publicaciones de una tienda de prueba se barren **por `seller_id`** y no solo por el prefijo
 * del slug: si algo se publica desde la UI con un título sin marcador, sigue colgando de una
 * tienda que sí lo lleva, y por ahí se atrapa.
 */
export async function sweepTestData(): Promise<TestDataCount> {
  const posts = await db.execute(sql`
    DELETE FROM posts
    WHERE id IN (
      SELECT post_id FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}
    )
    OR category LIKE ${CATEGORY_PATTERN}
    OR sub_category LIKE ${CATEGORY_PATTERN}
    OR seller_id IN (SELECT id FROM sellers WHERE slug LIKE ${SLUG_PATTERN})
  `);

  const categories = await db.execute(sql`
    DELETE FROM categories WHERE key LIKE ${CATEGORY_PATTERN}
  `);

  const branches = await db.execute(sql`
    DELETE FROM branches
    WHERE seller_id IN (SELECT id FROM sellers WHERE slug LIKE ${SLUG_PATTERN})
  `);

  const sellers = await db.execute(sql`
    DELETE FROM sellers WHERE slug LIKE ${SLUG_PATTERN}
  `);

  // Los `username` se reclaman sobre usuarios REALES —la suite no crea cuentas—, así que aquí no
  // se borra la fila: se le quita la dirección de prueba y el usuario queda como estaba.
  //
  // No basta con el prefijo. El formulario de `/cuenta` **precarga** la dirección a partir del
  // nombre de la cuenta, así que una corrida que muera entre el `fill` y el `click` deja reclamada
  // la sugerencia (`Healthy Food` → `healthy-food`), que no lleva prefijo y sobrevivía a este
  // barrido. Y como el formulario no se pinta cuando ya hay dirección, la suite quedaba bloqueada
  // para siempre sin decir por qué.
  //
  // Se libera por **correo**, el de la cuenta de la suite, y nunca por posición: un
  // `SELECT id FROM users LIMIT 1` no está ordenado y podría dejar sin dirección a una persona real.
  const usernames = await db.execute(sql`
    UPDATE users SET username = NULL
    WHERE username IS NOT NULL
      AND (username LIKE ${SLUG_PATTERN} OR email = ${SUITE_ACCOUNT_EMAIL})
  `);

  return {
    posts: posts.rowCount ?? 0,
    categories: categories.rowCount ?? 0,
    branches: branches.rowCount ?? 0,
    sellers: sellers.rowCount ?? 0,
    usernames: usernames.rowCount ?? 0,
  };
}

/** Lo que queda; se afirma en cero al terminar para que un residuo no pase inadvertido. */
export async function countTestData(): Promise<TestDataCount> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}) AS posts,
      (SELECT count(*)::int FROM categories WHERE key LIKE ${CATEGORY_PATTERN}) AS categories,
      (SELECT count(*)::int FROM branches b
        WHERE b.seller_id IN (SELECT id FROM sellers WHERE slug LIKE ${SLUG_PATTERN})) AS branches,
      (SELECT count(*)::int FROM sellers WHERE slug LIKE ${SLUG_PATTERN}) AS sellers,
      (SELECT count(*)::int FROM users WHERE username LIKE ${SLUG_PATTERN}) AS usernames
  `);

  return result.rows[0] as unknown as TestDataCount;
}

/**
 * ¿Hay algo de prueba? Se pregunta así y no campo por campo para que agregar un tipo de dato
 * sembrado no deje al `globalTeardown` mirando solo dos de las tres columnas.
 */
export function hasTestData(count: TestDataCount): boolean {
  return Object.values(count).some((value) => value > 0);
}

export function describeTestData(count: TestDataCount): string {
  return (
    `${count.posts} publicación(es), ${count.categories} categoría(s), ` +
    `${count.branches} sucursal(es), ${count.sellers} tienda(s) y ` +
    `${count.usernames} dirección(es) personal(es) de prueba`
  );
}
