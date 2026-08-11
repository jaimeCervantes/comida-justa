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
  habits: number;
}

const SLUG_PATTERN = `${TEST_SLUG_PREFIX}%`;
const CATEGORY_PATTERN = `${TEST_CATEGORY_PREFIX}%`;

/**
 * Qué tienda es de prueba.
 *
 * El prefijo no basta, por la misma razón que no bastaba para las direcciones personales (ver el
 * comentario del `UPDATE users` más abajo): el alta de `/cuenta` **precarga el nombre de la tienda
 * con el de la cuenta**, así que una corrida que muera entre el `fill` y el `click` deja abierta la
 * tienda `Healthy Food` → `healthy-food`, sin marcador, invisible para un barrido por prefijo.
 *
 * Y esa tienda bloquea la suite entera: `/cuenta` deja de pintar el formulario de alta cuando ya
 * hay una, así que los seis escenarios que empiezan abriendo tienda se quedaban esperando 90 s un
 * botón que ya no existía, sin ninguna pista de por qué. Pasó: la corrida del 2026-08-02.
 *
 * Por eso se barre también **por dueño**, el de la cuenta de la suite. Todo lo que esa cuenta tenga
 * abierto es de la suite por construcción —el prefijo `pw.` está justo para eso, ver
 * `suiteAccount.ts`—, y al terminar una corrida no debería tener ninguna.
 */
const TEST_SELLER_MATCH = sql`(
  slug LIKE ${SLUG_PATTERN}
  OR user_id IN (SELECT id FROM users WHERE email = ${SUITE_ACCOUNT_EMAIL})
)`;

const TEST_SELLER_IDS = sql`SELECT id FROM sellers WHERE ${TEST_SELLER_MATCH}`;

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
 * tienda que sí lo lleva, y por ahí se atrapa. Nunca por `posts.user_id`: la cuenta de la suite
 * también tiene publicaciones reales del catálogo, y son de la cuenta, no de la corrida.
 */
export async function sweepTestData(): Promise<TestDataCount> {
  await db.execute(sql`
    DELETE FROM habit_league_opt_ins
    WHERE user_id IN (SELECT id FROM users WHERE email = ${SUITE_ACCOUNT_EMAIL})
  `);
  const habits = await db.execute(sql`
    DELETE FROM habit_challenge_progress
    WHERE user_id IN (SELECT id FROM users WHERE email = ${SUITE_ACCOUNT_EMAIL})
  `);

  const posts = await db.execute(sql`
    DELETE FROM posts
    WHERE id IN (
      SELECT post_id FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}
    )
    OR category LIKE ${CATEGORY_PATTERN}
    OR sub_category LIKE ${CATEGORY_PATTERN}
    OR seller_id IN (${TEST_SELLER_IDS})
  `);

  const categories = await db.execute(sql`
    DELETE FROM categories WHERE key LIKE ${CATEGORY_PATTERN}
  `);

  const branches = await db.execute(sql`
    DELETE FROM branches
    WHERE seller_id IN (${TEST_SELLER_IDS})
  `);

  const sellers = await db.execute(sql`
    DELETE FROM sellers WHERE ${TEST_SELLER_MATCH}
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
    habits: habits.rowCount ?? 0,
  };
}

/** Lo que queda; se afirma en cero al terminar para que un residuo no pase inadvertido. */
export async function countTestData(): Promise<TestDataCount> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM post_translations WHERE slug LIKE ${SLUG_PATTERN}) AS posts,
      (SELECT count(*)::int FROM categories WHERE key LIKE ${CATEGORY_PATTERN}) AS categories,
      (SELECT count(*)::int FROM branches b
        WHERE b.seller_id IN (${TEST_SELLER_IDS})) AS branches,
      (SELECT count(*)::int FROM sellers WHERE ${TEST_SELLER_MATCH}) AS sellers,
      (SELECT count(*)::int FROM users WHERE username LIKE ${SLUG_PATTERN}) AS usernames,
      ((SELECT count(*)::int FROM habit_challenge_progress
        WHERE user_id IN (SELECT id FROM users WHERE email = ${SUITE_ACCOUNT_EMAIL})) +
       (SELECT count(*)::int FROM habit_league_opt_ins
        WHERE user_id IN (SELECT id FROM users WHERE email = ${SUITE_ACCOUNT_EMAIL}))) AS habits
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
    `${count.usernames} dirección(es) personal(es) y ${count.habits} reto(s) de prueba`
  );
}
