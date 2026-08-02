"use server";
import { getLocale } from "next-intl/server";
import type { User } from "~/domain/entities/post/types";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
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
 */
export async function setAvailability(
  _prevState: AvailabilityState,
  formData: FormData,
): Promise<AvailabilityState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, await getLocale());
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

  return { isAvailable: result.isAvailable };
}
