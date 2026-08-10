"use client";
import { useFormatter, useTranslations } from "next-intl";
import { orderTotal } from "~/domain/order/order";
import type { OrderWithSeller } from "~/domain/order/ports";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";

/**
 * Lo que ha pedido quien mira, con su estado.
 *
 * **Resumido, no desglosado**: la tienda, en qué va y cuánto suma. El detalle vive en
 * `/pedido/<id>`, que es además de donde se avisa al vendedor — repetir aquí los renglones haría la
 * lista ilegible en cuanto haya tres pedidos.
 */
export default function BuyerOrders({ orders }: { orders: OrderWithSeller[] }) {
  const t = useTranslations("orders");
  const format = useFormatter();

  if (orders.length === 0) {
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
    <ul className="flex flex-col gap-3" data-testid="buyer-orders">
      {orders.map((order) => (
        <Surface
          key={order.id}
          as="li"
          radius="lg"
          background="raised"
          border="subtle"
          interactive
          data-testid="buyer-order"
        >
          <Link
            href={{ pathname: "/pedido/[id]", params: { id: order.id } }}
            className="flex flex-wrap items-center justify-between gap-3 p-4"
            aria-label={t("viewOrder")}
          >
            <span className="flex min-w-0 flex-col">
              <span className="font-medium">{order.sellerName}</span>
              <span className="text-label text-text-support">
                {t("placedOn", {
                  date: format.dateTime(order.createdAt, {
                    dateStyle: "medium",
                  }),
                })}
              </span>
            </span>

            <span className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <CurrencyAmount
                value={orderTotal(order.lines)}
                currency={SITE_CURRENCY}
              />
            </span>
          </Link>
        </Surface>
      ))}
    </ul>
  );
}
