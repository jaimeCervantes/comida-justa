import { eq } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";

/**
 * La cuenta con la que trabaja la suite cuando un escenario no pide otra.
 *
 * Es una cuenta real —la suite no crea usuarios— pero existe para esto: el prefijo `pw.` la
 * distingue de las personas que usan el sitio. **No es admin**, que es justo lo que asumen los
 * escenarios de "un visitante cualquiera" y los que afirman que un no-admin recibe 404.
 */
export const SUITE_ACCOUNT_EMAIL = "pw.healthy.food@gmail.com";

/**
 * Resuelve el id de esa cuenta. Es el **único** sitio que lo decide.
 *
 * Antes cada ayudante hacía su propio `SELECT id FROM users LIMIT 1`, sin `ORDER BY`, y coincidían
 * por casualidad: Postgres devuelve las filas en orden físico. En cuanto un test hace `UPDATE`
 * sobre esa fila —reclamar y liberar una dirección personal, por ejemplo— la tupla se reescribe al
 * final del heap y cada ayudante empieza a elegir a alguien distinto. El resultado eran fallos que
 * pasaban en aislamiento y fallaban en la suite completa, según el orden de los specs.
 *
 * El respaldo ordenado por `id` existe para entornos donde esa cuenta no esté sembrada; también
 * ordenado, para no reintroducir el mismo azar.
 */
export async function findSuiteUserId(): Promise<string> {
  const pinned = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, SUITE_ACCOUNT_EMAIL))
    .limit(1);

  if (pinned.length > 0) return pinned[0].id;

  const fallback = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(users.id)
    .limit(1);

  if (fallback.length === 0) {
    throw new Error("La tabla `users` está vacía: la suite no puede entrar.");
  }

  return fallback[0].id;
}
