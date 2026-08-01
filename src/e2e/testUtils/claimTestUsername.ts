import { sql } from "drizzle-orm";
import { db } from "~/infra/dataAccess/db/connection";

/**
 * Le pone una dirección personal a un usuario **real** (la suite no crea cuentas).
 *
 * Se usa para montar el estado "esa dirección ya está ocupada" sin tener que pasar dos veces por
 * el formulario. Como toda dirección de prueba lleva el prefijo `e2e-`, el barrido la quita
 * después y la cuenta queda como estaba.
 */
export async function claimUsernameFor(
  userId: string,
  username: string,
): Promise<void> {
  await db.execute(sql`
    UPDATE users SET username = ${username} WHERE id = ${userId}
  `);
}

export async function releaseUsername(username: string): Promise<void> {
  await db.execute(sql`
    UPDATE users SET username = NULL WHERE username = ${username}
  `);
}

/** El id de un usuario distinto al de la sesión, para montar la colisión de direcciones. */
export async function findAnotherUserId(excludedId: string): Promise<string> {
  const result = await db.execute(sql`
    SELECT id FROM users WHERE id <> ${excludedId} AND username IS NULL LIMIT 1
  `);

  const rows = result.rows as unknown as Array<{ id: string }>;

  if (rows.length === 0) {
    throw new Error("findAnotherUserId: no hay una segunda cuenta disponible.");
  }

  return rows[0].id;
}
