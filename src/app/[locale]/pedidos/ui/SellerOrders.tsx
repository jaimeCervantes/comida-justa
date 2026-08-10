"use client";
import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";
import { nextStatuses, type Order } from "~/domain/order/order";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import OrderLines from "~/presentation/orders/OrderLines/OrderLines";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";
import {
  type AdvanceOrderState,
  advanceOrder,
} from "~/presentation/orders/orderActions";

/**
 * Los pedidos que le han hecho al vendedor, con lo que puede hacer con cada uno.
 *
 * **Los botones salen de `nextStatuses`**, la misma función que el caso de uso usa para decidir si
 * la transición vale. Escribir aquí la lista de botones a mano habría sido la segunda copia de las
 * reglas, y el día que cambien —cuando el pago meta `PAID` en medio— habría dos sitios donde
 * acordarse.
 *
 * Ocultar lo que no se puede hacer es cortesía, no seguridad: quien decide es el servidor, que
 * compara la tienda de la sesión contra la del pedido dentro del propio `WHERE`.
 */
export default function SellerOrders({ orders }: { orders: Order[] }) {
  const t = useTranslations("orders");

  if (orders.length === 0) {
    return (
      <p data-testid="seller-orders-empty" className="text-text-support">
        {t("sellerEmpty")}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4" data-testid="seller-orders">
      {orders.map((order) => (
        <SellerOrderCard key={order.id} order={order} />
      ))}
    </ul>
  );
}

function SellerOrderCard({ order }: { order: Order }) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const [state, action, isPending] = useActionState<
    AdvanceOrderState,
    FormData
  >(advanceOrder, {});

  return (
    <Surface
      as="li"
      radius="lg"
      background="raised"
      border="subtle"
      className="p-4"
      data-testid="seller-order"
      data-order-id={order.id}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <OrderStatusBadge status={order.status} />
        {/* `useFormatter` y no `toLocaleDateString`: el idioma es el de la ruta y no el del
            navegador, así que el servidor y el cliente pintan lo mismo. Mismo motivo que en
            `FormattedDate`. */}
        <span className="text-label text-text-support">
          {t("placedOn", {
            date: format.dateTime(order.createdAt, { dateStyle: "medium" }),
          })}
        </span>
      </div>

      <OrderLines lines={order.lines} />

      {/* Un pedido entregado o cancelado no ofrece nada: `nextStatuses` devuelve la lista vacía. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {nextStatuses(order.status).map((status) => (
          <form key={status} action={action}>
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              size="sm"
              color={status === "CANCELLED" ? "default" : "green"}
              isLoading={isPending}
              disabled={isPending}
              data-testid={`order-action-${status}`}
            >
              {t(`action.${status}`)}
            </Button>
          </form>
        ))}
      </div>

      {state.error ? (
        <p
          data-testid="seller-order-error"
          className="mt-2 text-label text-pw-orange"
        >
          {t("errorTransition")}
        </p>
      ) : null}
    </Surface>
  );
}
