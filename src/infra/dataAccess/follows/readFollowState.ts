import type { FollowTarget } from "~/domain/follow/follow";
import { createFollowRepository } from "./PostgresFollowRepository";

export interface FollowSnapshot {
  followers: number;
  isFollowing: boolean;
}

/**
 * Lo que la página necesita saber del seguimiento antes de pintar el botón.
 *
 * Las dos lecturas van juntas porque siempre se piden juntas, y en paralelo porque no dependen la
 * una de la otra. Sin sesión, `isFollowing` no llega a consultarse: el repositorio corta antes,
 * porque preguntárselo a la base sería una consulta con respuesta fija.
 */
export async function readFollowState(
  target: FollowTarget,
  viewerId: string | null,
): Promise<FollowSnapshot> {
  const follows = createFollowRepository();

  const [followers, isFollowing] = await Promise.all([
    follows.countFollowers(target),
    follows.isFollowing(viewerId, target),
  ]);

  return { followers, isFollowing };
}
