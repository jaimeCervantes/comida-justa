"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { nextStatuses } from "~/domain/order/order";
import type { OrderWithBuyer } from "~/domain/order/ports";
import { Button } from "~/presentation/design_system/buttons/Button";
import OrderBuyer from "~/presentation/orders/OrderBuyer/OrderBuyer";
import OrderCard from "~/presentation/orders/OrderCard/OrderCard";
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
export default function SellerOrders({
  orders,
  emptyKey,
}: {
  orders: OrderWithBuyer[];
  /** No es lo mismo «no te han pedido nada» que «no hay nada con ese filtro». */
  emptyKey: "filtered" | "none";
}) {
  const t = useTranslations("orders");

  if (orders.length === 0) {
    return (
      <p data-testid="seller-orders-empty" className="text-text-support">
        {emptyKey === "filtered" ? t("nothingFound") : t("sellerEmpty")}
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

function SellerOrderCard({ order }: { order: OrderWithBuyer }) {
  const t = useTranslations("orders");
  const [state, action, isPending] = useActionState<
    AdvanceOrderState,
    FormData
  >(advanceOrder, {});

  return (
    <OrderCard
      order={order}
      testId="seller-order"
      /* Quién lo pidió va donde en la otra lista va la tienda: es la contraparte, y quien prepara
         algo necesita saber para quién antes que ninguna otra cosa. */
      party={
        <OrderBuyer
          name={order.buyerName}
          handle={order.buyerHandle}
          image={order.buyerImage}
        />
      }
    >
      {/* Un pedido entregado o cancelado no ofrece nada: `nextStatuses` devuelve la lista vacía. */}
      <div className="flex flex-wrap gap-2">
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
    </OrderCard>
  );
}
