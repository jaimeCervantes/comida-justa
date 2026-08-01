"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { User } from "~/domain/entities/post/types";
import { auth } from "~/infra/auth";
import { SIGNIN_PATH } from "~/infra/constants";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import BecomeSellerUseCase from "~/use_cases/becomeSeller/becomeSellerUseCase";
import { storePath } from "./storePath";

export type BecomeSellerState = {
  errorMessage?: string;
  handle?: string;
};

/**
 * Da de alta la tienda de quien está en sesión.
 *
 * Solo los fallos **esperados** (nombre ocupado, teléfono repetido, datos inválidos) vuelven al
 * formulario; un fallo de infraestructura se deja subir al `error.tsx`, porque reintentar el
 * formulario no lo arregla.
 */
export async function becomeSeller(
  _prevState: BecomeSellerState,
  formData: FormData,
): Promise<BecomeSellerState> {
  const session = await auth();

  if (!session) {
    redirect(SIGNIN_PATH);
  }

  const userId = (session.user as User | undefined)?.id;

  if (!userId) {
    redirect(SIGNIN_PATH);
  }

  const useCase = new BecomeSellerUseCase(createSellerRepository());
  const result = await useCase.execute({
    userId,
    draft: {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      description: String(formData.get("description") ?? ""),
    },
  });

  if (!result.seller) {
    return { errorMessage: result.errorMessage };
  }

  const handle = result.seller.handle ?? "";

  revalidatePath("/cuenta");
  revalidatePath(storePath(handle));

  return { handle };
}
