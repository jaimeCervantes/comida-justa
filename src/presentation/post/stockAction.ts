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
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createPostAdminRepository } from "~/infra/dataAccess/managePost/factory";
import SetPostStockUseCase, {
  type SetPostStockError,
} from "~/use_cases/managePost/setPostStockUseCase";

export type StockState = {
  /**
   * El **código** del fallo, no la frase. Traducirlo es del componente, que es el único que sabe en
   * qué idioma está mirando la persona; una acción de servidor no puede saberlo sin pedirlo.
   */
  error?: SetPostStockError;
  stockQuantity?: number;
};

/**
 * Fija cuántas unidades quedan de un producto.
 *
 * **La tienda de quien pide sale de la sesión, no del formulario.** Es la mitad que hace segura la
 * segunda vía de autorización: el `postId` viaja en el `FormData` y da igual que venga forjado,
 * porque quien decide es `canManagePost` comparando contra un `sellerId` que el navegador nunca
 * tocó.
 *
 * Se invalida la ficha y además el layout entero, por lo mismo que la disponibilidad: agotar algo
 * cambia su tarjeta en cualquier listado donde estuviera, y quien lo agotó desde otra pantalla
 * tiene que verlo al instante o parecerá que no pasó nada.
 */
export async function setStock(
  _prevState: StockState,
  formData: FormData,
): Promise<StockState> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectToSignInFrom(await getLocale(), await refererPath());
  }

  const seller = await findSellerOfUser(userId);

  const useCase = new SetPostStockUseCase(createPostAdminRepository());
  const result = await useCase.execute({
    userId,
    sellerId: seller?.id ?? null,
    postId: String(formData.get("postId") ?? ""),
    quantity: String(formData.get("stockQuantity") ?? ""),
  });

  if (result.error) return { error: result.error };

  const slug = String(formData.get("slug") ?? "");

  revalidateLocalizedPath({ pathname: "/[slug]", params: { slug } });
  revalidatePath("/", "layout");

  return { stockQuantity: result.stockQuantity };
}
