import { and, count, eq, isNull, type SQL, sql } from "drizzle-orm";
import type { FollowTarget } from "~/domain/follow/follow";
import { db } from "~/infra/dataAccess/db/connection";
import { follows } from "~/infra/dataAccess/db/schema/follows";
import type IFollowRepository from "~/use_cases/follow/ports/IFollowRepository";

/**
 * El filtro de un destino.
 *
 * Lleva el `IS NULL` de la otra columna a propósito: sin él, «cuántos siguen a esta persona»
 * contaría también las filas de tienda cuyo `followed_id` es nulo... que no coinciden, pero el
 * `IS NULL` explícito es lo que hace que el planner pueda usar el índice parcial en vez de mirar
 * la tabla entera.
 */
function matches(target: FollowTarget): SQL {
  /* `sql.join` y no `and()`: este último devuelve `SQL | undefined` —puede recibir una lista
     vacía—, y aquí nunca lo es. Afirmarlo con `!` sería tapar el tipo en vez de construir algo que
     no lo necesite. */
  const conditions =
    target.kind === "seller"
      ? [eq(follows.sellerId, target.sellerId), isNull(follows.followedId)]
      : [eq(follows.followedId, target.userId), isNull(follows.sellerId)];

  return sql.join(conditions, sql` AND `);
}

function rowFor(followerId: string, target: FollowTarget) {
  return target.kind === "seller"
    ? { followerId, sellerId: target.sellerId }
    : { followerId, followedId: target.userId };
}

export class PostgresFollowRepository implements IFollowRepository {
  /**
   * **`ON CONFLICT DO NOTHING`, sin mirar antes.** Entre un `SELECT` que comprueba y un `INSERT`
   * que escribe cabe otra pestaña, y el resultado serían dos filas y un contador que miente. Los
   * dos únicos parciales de la migración `0031` son los que lo impiden de verdad.
   */
  async follow(followerId: string, target: FollowTarget): Promise<void> {
    await db
      .insert(follows)
      .values(rowFor(followerId, target))
      .onConflictDoNothing();
  }

  /** Dejar de seguir lo que no se seguía no es un error: borrar cero filas es el mismo final. */
  async unfollow(followerId: string, target: FollowTarget): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), matches(target)));
  }

  async countFollowers(target: FollowTarget): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(follows)
      .where(matches(target));

    return Number(row?.total ?? 0);
  }

  async isFollowing(
    followerId: string | null,
    target: FollowTarget,
  ): Promise<boolean> {
    // Sin sesión no se sigue nada, y preguntárselo a la base sería una consulta con respuesta fija.
    if (!followerId) return false;

    const rows = await db
      .select({ id: follows.id })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), matches(target)))
      .limit(1);

    return rows.length > 0;
  }
}

let instance: PostgresFollowRepository | null = null;

export function createFollowRepository(): PostgresFollowRepository {
  if (instance) return instance;
  instance = new PostgresFollowRepository();
  return instance;
}
