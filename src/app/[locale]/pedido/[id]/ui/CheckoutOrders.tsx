import { getTranslations } from "next-intl/server";
import { checkoutTotal, orderTotal } from "~/domain/order/order";
import type { OrderWithSeller } from "~/domain/order/ports";
import { Link } from "~/i18n/navigation";
import { SITE_CURRENCY } from "~/infra/constants";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import CurrencyAmount from "~/presentation/money/CurrencyAmount";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";

/**
 * La compra entera: los pedidos que salieron del mismo carrito.
 *
 * Aparece **solo cuando hay más de uno y solo para quien compró**. Un carrito de dos tiendas produce
 * dos pedidos que cada tienda lleva a su ritmo, así que sin esto quien compró tendría que acordarse
 * de que existe el otro; y con el `checkout_id` compartido, acordarse ya no hace falta.
 *
 * Al vendedor no se le pinta: comparte el carrito de su cliente, no su lista de proveedores.
 *
 * El pedido que se está mirando **se marca y no se enlaza a sí mismo**. Un enlace que no lleva a
 * ninguna parte es la forma más barata de que alguien crea que la página se quedó colgada.
 */
export default async function CheckoutOrders({
  orders,
  currentId,
}: {
  orders: OrderWithSeller[];
  currentId: string;
}) {
  const t = await getTranslations("orders");

  return (
    <Surface
      as="section"
      radius="2xl"
      background="raised"
      border="subtle"
      elevation="sm"
      className="mt-6 p-4"
      data-testid="checkout-orders"
    >
      <h2 className="text-body-lg font-bold">
        {t("checkoutHeading", { count: orders.length })}
      </h2>
      <p className="mt-1 text-label text-text-support">{t("checkoutNote")}</p>

      <ul className="mt-3">
        {orders.map((order) => (
          <li
            key={order.id}
            data-testid="checkout-order"
            data-current={order.id === currentId}
            className="flex flex-wrap items-center justify-between gap-3 border-t border-separator py-3 first:border-t-0"
          >
            <span className="flex min-w-0 items-center gap-3">
              {order.id === currentId ? (
                <span className="font-medium">{order.sellerName}</span>
              ) : (
                <Link
                  href={{ pathname: "/pedido/[id]", params: { id: order.id } }}
                  className="font-medium hover:text-pw-lightgreen"
                  data-testid="checkout-order-link"
                >
                  {order.sellerName}
                </Link>
              )}

              {order.id === currentId ? (
                <span
                  className="text-label text-text-support"
                  data-testid="checkout-order-current"
                >
                  {t("checkoutCurrent")}
                </span>
              ) : null}
            </span>

            <span className="flex items-center gap-3">
              <OrderStatusBadge status={order.status} />
              <CurrencyAmount
                value={orderTotal(order.lines)}
                currency={SITE_CURRENCY}
              />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-separator pt-3">
        <p className="font-bold">{t("checkoutTotal")}</p>
        <span data-testid="checkout-total">
          <CurrencyAmount
            value={checkoutTotal(orders)}
            currency={SITE_CURRENCY}
          />
        </span>
      </div>
    </Surface>
  );
}
