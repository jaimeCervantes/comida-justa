import {
  type FollowRejection,
  type FollowRequest,
  rejectionFor,
  targetOf,
} from "~/domain/follow/follow";
import type IFollowRepository from "./ports/IFollowRepository";

export type ToggleFollowResult =
  | { ok: true; following: boolean; followers: number }
  | { ok: false; reason: FollowRejection };

/**
 * Seguir o dejar de seguir, decidiendo por el estado actual y no por lo que diga la pantalla.
 *
 * **El botón manda una intención, no un estado.** Si mandara «ahora quiero seguir», dos pestañas
 * abiertas con vistas distintas se pisarían la una a la otra. Aquí se lee lo que hay y se hace lo
 * contrario, así que el resultado no depende de cuál de las dos pestañas llegó primero.
 *
 * Devuelve el contador ya recalculado para que quien lo pinta no tenga que pedirlo aparte y se
 * quede, por un momento, enseñando el número viejo.
 */
export default class ToggleFollowUseCase {
  constructor(private readonly follows: IFollowRepository) {}

  async execute(request: FollowRequest): Promise<ToggleFollowResult> {
    const reason = rejectionFor(request);
    if (reason !== null) return { ok: false, reason };

    const target = targetOf(request);
    if (target === null) return { ok: false, reason: "no-target" };

    const following = await this.follows.isFollowing(
      request.followerId,
      target,
    );

    if (following) {
      await this.follows.unfollow(request.followerId, target);
    } else {
      await this.follows.follow(request.followerId, target);
    }

    return {
      ok: true,
      following: !following,
      followers: await this.follows.countFollowers(target),
    };
  }
}
