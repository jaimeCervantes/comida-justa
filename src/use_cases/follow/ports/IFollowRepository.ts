import type { FollowTarget } from "~/domain/follow/follow";

/**
 * Lo que hace falta saber y guardar sobre quién sigue a quién.
 *
 * `follow` y `unfollow` son **idempotentes**: seguir dos veces deja una fila y dejar de seguir algo
 * que no se seguía no es un error. La unicidad la imponen los dos índices parciales de la base
 * (`0031`), no una comprobación previa: entre un `SELECT` que mira y un `INSERT` que escribe cabe
 * otra pestaña.
 */
export default interface IFollowRepository {
  follow(followerId: string, target: FollowTarget): Promise<void>;

  unfollow(followerId: string, target: FollowTarget): Promise<void>;

  /** Cuántos siguen a ese destino. Es lo que pinta el contador de la página. */
  countFollowers(target: FollowTarget): Promise<number>;

  /** Si esa persona ya lo sigue. `null` cuando no hay sesión: nadie sigue nada sin identidad. */
  isFollowing(
    followerId: string | null,
    target: FollowTarget,
  ): Promise<boolean>;
}
