"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { auth } from "~/infra/auth";
import {
  redirectToSignInFrom,
  refererPath,
} from "~/infra/auth/redirectToSignIn";

import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import SetPostAvailabilityUseCase from "~/use_cases/managePost/setPostAvailabilityUseCase";

export type AvailabilityState = {
  errorMessage?: string;
  isAvailable?: boolean;
};

/**
 * Marca un producto como agotado o vuelve a ofrecerlo.
 *
 * El `postId` viaja en el formulario, pero la autorización **no** depende de él: el caso de uso
 * compara el dueño de esa publicación contra la sesión, así que mandar el id de otro no sirve de
 * nada.
 *
 * Vive en `presentation/` y no bajo la ruta del detalle porque ahora se dispara desde los dos
 * sitios donde aparece una publicación —su página y su tarjeta en cualquier listado—, y una tarjeta
 * no puede importar desde `app/` sin invertir las capas.
 *
 * Por eso además de la página de la publicación se invalida el layout entero: quien marca agotado
 * desde una tarjeta está mirando un listado, y ese listado tiene que reflejarlo al instante o
 * parecerá que el botón no hizo nada.
 */
export async function setAvailability(
  _prevState: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectToSignInFrom(await getLocale(), await refererPath());
  }

  const useCase = new SetPostAvailabilityUseCase(createPostAdminRepository());
  const result = await useCase.execute({
    userId,
    postId: String(formData.get("postId") ?? ""),
    isAvailable: formData.get("isAvailable") === "true",
  });

  if (result.errorMessage) {
    return { errorMessage: result.errorMessage };
  }

  const slug = String(formData.get("slug") ?? "");

  revalidateLocalizedPath({ pathname: "/[slug]", params: { slug } });
  revalidatePath("/", "layout");

  return { isAvailable: result.isAvailable };
}
