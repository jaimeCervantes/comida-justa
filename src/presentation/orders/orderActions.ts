"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { removeFromSelection } from "~/domain/cart/cartSelection";
import type { User } from "~/domain/entities/post/types";
import type { OrderStatus } from "~/domain/order/order";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { readCartSelection, writeCartSelection } from "~/infra/cart/readCart";
import { SIGNIN_PATH } from "~/infra/constants";
import { createCartProductRepository } from "~/infra/dataAccess/cart/factory";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import AdvanceOrderUseCase from "~/use_cases/advanceOrder/advanceOrderUseCase";
import PlaceOrderUseCase, {
  type PlaceOrderError,
} from "~/use_cases/placeOrder/placeOrderUseCase";

export type PlaceOrderState = { error?: PlaceOrderError };

/**
 * Convierte lo que hay en el carrito de una tienda en un pedido y lleva a su página.
 *
 * **Pide sesión, y aquí sí.** El carrito no la necesita —exigir cuenta para juntar productos mata la
 * conversión antes de empezar—, pero un pedido tiene dueño: `customer_orders.user_id` es `NOT NULL`,
 * y sin saber quién pidió el vendedor no tiene a quién responder.
 *
 * Del carrito se vacía **solo lo que se pidió**: lo de otras tiendas se queda, y lo agotado también,
 * porque nadie lo pidió y quien lo puso ahí decide si lo quita.
 */
export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const locale = resolveLocale(await getLocale());
  const session = await auth();
  const buyerId = (session?.user as User | undefined)?.id;

  if (!buyerId) {
    redirectKeepingLocale(SIGNIN_PATH, locale);
  }

  const sellerId = String(formData.get("sellerId") ?? "");

  if (!sellerId) return { error: "empty-for-seller" };

  const selection = await readCartSelection();
  const useCase = new PlaceOrderUseCase(
    createCartProductRepository(),
    createOrderRepository(),
    () => crypto.randomUUID(),
  );

  const result = await useCase.execute({
    selection,
    buyerId,
    locale,
    fallbackLocale: routing.defaultLocale,
    sellerId,
  });

  if ("error" in result) return { error: result.error };

  const remaining = result.orderedPostIds.reduce(
    (rest, postId) => removeFromSelection(rest, postId),
    selection,
  );

  await writeCartSelection(remaining);
  revalidatePath("/", "layout");

  /* Se sale a la página del pedido en vez de abrir WhatsApp directamente: `window.open` después de
     una acción de servidor llega sin gesto del usuario y los navegadores lo bloquean. Allí el aviso
     al vendedor es un enlace normal, que sí puede abrirse en otra pestaña — y de paso al comprador
     le queda una dirección a la que volver para ver en qué va. */
  redirectKeepingLocale(
    { pathname: "/pedido/[id]", params: { id: result.order.id } },
    locale,
  );
}

export type AdvanceOrderState = { error?: "not-found" | "invalid-transition" };

/**
 * Mueve un pedido por su proceso.
 *
 * El vendedor sale de la **sesión**, no del formulario: mandar el id de un pedido ajeno no sirve de
 * nada porque el `WHERE` de la escritura lleva el `seller_id` de quien pide el cambio.
 */
export async function advanceOrder(
  _prevState: AdvanceOrderState,
  formData: FormData,
): Promise<AdvanceOrderState> {
  const locale = resolveLocale(await getLocale());
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) {
    redirectKeepingLocale(SIGNIN_PATH, locale);
  }

  const seller = await findSellerOfUser(userId);

  // Quien no tiene tienda no tiene pedidos que mover; se responde como si no existiera.
  if (!seller) return { error: "not-found" };

  const result = await new AdvanceOrderUseCase(createOrderRepository()).execute(
    {
      orderId: String(formData.get("orderId") ?? ""),
      sellerId: seller.id,
      status: String(formData.get("status") ?? "") as OrderStatus,
    },
  );

  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");

  return {};
}
