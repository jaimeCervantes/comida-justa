"use client";
import { useTranslations } from "next-intl";
import type { OrderWithSeller } from "~/domain/order/ports";
import { Link } from "~/i18n/navigation";
import OrderCard from "~/presentation/orders/OrderCard/OrderCard";

/**
 * Lo que ha pedido quien mira, **desglosado**.
 *
 * Antes era un resumen —la tienda, el estado y el total— porque el detalle vivía en `/pedido/<id>`.
 * Con los pedidos reales eso dejó de servir: cuatro de los cinco son a la misma tienda y los cuatro
 * están Pendientes, así que la lista enseñaba cuatro tarjetas idénticas y había que abrirlas una a
 * una para saber cuál era cuál.
 *
 * **Por eso la tarjeta ya no es un enlace entero.** Los renglones llevan a su producto, y un enlace
 * no puede llevar enlaces dentro; el destino no se pierde, se nombra al pie.
 */
export default function BuyerOrders({
  orders,
  emptyKey,
}: {
  orders: OrderWithSeller[];
  /** No es lo mismo «no has pedido nada» que «no hay nada con ese filtro». */
  emptyKey: "filtered" | "none";
}) {
  const t = useTranslations("orders");

  if (orders.length === 0) {
    if (emptyKey === "filtered") {
      return (
        <p data-testid="buyer-orders-empty" className="text-text-support">
          {t("nothingFound")}
        </p>
      );
    }

    return (
      <p data-testid="buyer-orders-empty" className="text-text-support">
        {t("buyerEmpty")}{" "}
        <Link href="/productos" className="font-medium text-pw-green underline">
          {t("buyerEmptyCta")}
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4" data-testid="buyer-orders">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          testId="buyer-order"
          party={<span className="font-medium">{order.sellerName}</span>}
        >
          <div className="flex justify-end">
            <Link
              href={{ pathname: "/pedido/[id]", params: { id: order.id } }}
              data-testid="buyer-order-link"
              className="focus-ring rounded-lg px-2 py-1 font-medium text-pw-green hover:underline"
            >
              {t("viewOrder")}
            </Link>
          </div>
        </OrderCard>
      ))}
    </ul>
  );
}
