"use server";

import { revalidatePath } from "next/cache";
import { auth } from "~/infra/auth";
import { createFollowRepository } from "~/infra/dataAccess/follows/PostgresFollowRepository";
import ToggleFollowUseCase from "~/use_cases/follow/toggleFollowUseCase";

export type FollowState = {
  following: boolean;
  followers: number;
  /** `true` cuando no hay sesión: el botón lleva a entrar en vez de intentarlo otra vez. */
  needsSignIn?: boolean;
};

/**
 * Seguir o dejar de seguir, decidido en el servidor.
 *
 * **Quién sigue sale de la sesión, nunca del formulario.** Si viajara en el cuerpo, cualquiera
 * podría sumar seguidores a nombre de otro con una petición armada a mano — es el mismo motivo por
 * el que el vendedor de una publicación sale de la sesión y no del formulario de publicar.
 *
 * `revalidatePath` refresca la página del destino para que el contador que ve el resto también
 * quede al día, no solo el de quien acaba de pulsar.
 */
export async function toggleFollow(
  _prev: FollowState,
  formData: FormData,
): Promise<FollowState> {
  const session = await auth();
  const followerId = (session?.user as { id?: string } | undefined)?.id;

  if (!followerId) {
    return { following: false, followers: 0, needsSignIn: true };
  }

  const sellerId = (formData.get("sellerId") as string) || null;
  const followedId = (formData.get("followedId") as string) || null;
  const path = (formData.get("path") as string) || null;

  const result = await new ToggleFollowUseCase(
    createFollowRepository(),
  ).execute({ followerId, sellerId, followedId });

  if (!result.ok) {
    // Un destino inválido no llega desde la interfaz: solo desde una petición armada a mano.
    return { following: false, followers: 0 };
  }

  if (path) revalidatePath(path);

  return { following: result.following, followers: result.followers };
}
