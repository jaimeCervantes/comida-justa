"use server";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { removeFromSelection } from "~/domain/cart/cartSelection";
import type { User } from "~/domain/entities/post/types";
import type { OrderStatus } from "~/domain/order/order";
import type { Route } from "~/domain/routing/route";
import { redirectKeepingLocale } from "~/i18n/redirectKeepingLocale";
import { resolveLocale, routing } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import {
  redirectToSignInFrom,
  refererPath,
} from "~/infra/auth/redirectToSignIn";

import { readCartSelection, writeCartSelection } from "~/infra/cart/readCart";
import {
  clearCheckoutId,
  readCheckoutId,
  writeCheckoutId,
} from "~/infra/cart/readCheckout";
import { createCartProductRepository } from "~/infra/dataAccess/cart/factory";
import { findSellerOfUser } from "~/infra/dataAccess/identity/sessionIdentity";
import { createOrderRepository } from "~/infra/dataAccess/orders/factory";
import { createRouteProvider } from "~/infra/routing/factory";
import { absoluteCourierTrackingUrl } from "~/infra/UI/mappers/absoluteCourierTrackingUrl";
import AdvanceOrderUseCase, {
  type AdvanceOrderError,
} from "~/use_cases/advanceOrder/advanceOrderUseCase";
import ShareDeliveryLocationUseCase from "~/use_cases/deliveryLocation/shareDeliveryLocation/shareDeliveryLocationUseCase";
import RouteToDestinationUseCase from "~/use_cases/deliveryRoute/routeToDestination/routeToDestinationUseCase";
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
 *
 * **Las tiendas de un mismo carrito son una sola compra.** El `checkoutId` se lee de la cookie y solo
 * se estrena si no había ninguna: así la segunda tienda que se confirma se engancha a la primera. Y
 * se cierra en cuanto el carrito se queda vacío, que es donde acaba esa compra.
 */
export async function placeOrder(
  _prevState: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const locale = resolveLocale(await getLocale());
  const session = await auth();
  const buyerId = (session?.user as User | undefined)?.id;

  if (!buyerId) {
    redirectToSignInFrom(locale, await refererPath());
  }

  const sellerId = String(formData.get("sellerId") ?? "");

  if (!sellerId) return { error: "empty-for-seller" };

  const selection = await readCartSelection();
  const checkoutId = (await readCheckoutId()) ?? crypto.randomUUID();
  const useCase = new PlaceOrderUseCase(
    createCartProductRepository(),
    createOrderRepository(),
  );

  const result = await useCase.execute({
    selection,
    buyerId,
    locale,
    fallbackLocale: routing.defaultLocale,
    sellerId,
    checkoutId,
    deliveryLocation: deliveryLocationFrom(formData),
  });

  if ("error" in result) return { error: result.error };

  const remaining = result.orderedPostIds.reduce(
    (rest, postId) => removeFromSelection(rest, postId),
    selection,
  );

  await writeCartSelection(remaining);

  /* La compra se cierra con el carrito. Si queda otra tienda dentro, el checkout sigue abierto para
     que su pedido salga hermanado; si no queda nada, se borra — un checkout que sobreviviera al
     carrito metería la compra de la semana que viene dentro de la de hoy. */
  if (remaining.length === 0) {
    await clearCheckoutId();
  } else {
    await writeCheckoutId(checkoutId);
  }

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

/**
 * El destino que `ConfirmOrderButton` agrega al formulario **solo si el navegador contestó a
 * tiempo**. Sin los dos campos no hay destino; si llegan pero no son una coordenada real, lo
 * descarta el caso de uso.
 */
function deliveryLocationFrom(
  formData: FormData,
): { lat: number; lng: number } | null {
  const lat = formData.get("deliveryLat");
  const lng = formData.get("deliveryLng");

  return lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
}

/**
 * Guarda o reemplaza a dónde se entrega un pedido, desde su ficha.
 *
 * El comprador sale de la **sesión**, no del formulario: el `WHERE` de la escritura lleva su id, así
 * que mandar el de un pedido ajeno no escribe nada. Un fallo no se explica —ni «no es tuyo» ni «ya
 * se entregó»—; la ficha simplemente sigue como estaba.
 */
export async function shareDeliveryLocation(formData: FormData): Promise<void> {
  const locale = resolveLocale(await getLocale());
  const session = await auth();
  const buyerId = (session?.user as User | undefined)?.id;

  if (!buyerId) {
    redirectToSignInFrom(locale, await refererPath());
  }

  const result = await new ShareDeliveryLocationUseCase(
    createOrderRepository(),
  ).execute({
    orderId: String(formData.get("orderId") ?? ""),
    buyerId,
    lat: Number(formData.get("latitude")),
    lng: Number(formData.get("longitude")),
  });

  if ("saved" in result) revalidatePath("/", "layout");
}

/**
 * El camino por calles que le falta al repartidor, para la ficha del comprador.
 *
 * **Es una lectura que no se guarda**: los términos de Mapbox prohíben guardar o cachear la ruta,
 * así que se consulta cada vez y solo vive en la pantalla. La frecuencia la limita la ficha
 * (`useDeliveryRoute`, una por minuto). Sin sesión no hay camino: no se redirige a nadie desde un
 * refresco en segundo plano.
 */
export async function routeToDestination(
  orderId: string,
): Promise<Route | null> {
  const session = await auth();
  const buyerId = (session?.user as User | undefined)?.id;

  if (!buyerId || !orderId) return null;

  return new RouteToDestinationUseCase(
    createOrderRepository(),
    createRouteProvider(),
  ).execute({ orderId, buyerId, now: new Date() });
}

export type AdvanceOrderState = {
  error?: AdvanceOrderError;
  /**
   * El enlace del repartidor, **solo justo después** de marcar el pedido como Enviado. No se
   * vuelve a mandar en cargas posteriores de esta misma pantalla: `SellerOrders` es de cliente y
   * comparte tipo con lo que ve el comprador en otras pantallas, así que el token no viaja en el
   * pedido — ver el pedido detalle, que sí lo puede volver a mostrar de forma segura.
   */
  courierTrackingUrl?: string;
};

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
    redirectToSignInFrom(locale, await refererPath());
  }

  const seller = await findSellerOfUser(userId);

  // Quien no tiene tienda no tiene pedidos que mover; se responde como si no existiera.
  if (!seller) return { error: "not-found" };

  const orderId = String(formData.get("orderId") ?? "");

  const result = await new AdvanceOrderUseCase(createOrderRepository()).execute(
    {
      orderId,
      sellerId: seller.id,
      status: String(formData.get("status") ?? "") as OrderStatus,
      /* La persona y la tienda son cosas distintas: el `WHERE` de la escritura lleva la tienda, y el
         histórico guarda a quién movió el pedido. Hoy coinciden porque una tienda tiene un dueño. */
      changedBy: userId,
    },
  );

  if ("error" in result) return { error: result.error };

  revalidatePath("/", "layout");

  return {
    courierTrackingUrl: result.courierTrackingToken
      ? absoluteCourierTrackingUrl(locale, orderId, result.courierTrackingToken)
      : undefined,
  };
}
