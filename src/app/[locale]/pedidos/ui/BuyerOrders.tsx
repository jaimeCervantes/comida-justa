"use client";
import { useLocale, useTranslations } from "next-intl";
import type { OrderWithSeller } from "~/domain/order/ports";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { absoluteOrderUrl } from "~/infra/UI/mappers/absoluteOrderUrl";
import NotifySellerButton from "~/presentation/orders/NotifySellerButton/NotifySellerButton";
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
  /* `useLocale` y no una prop: el idioma ya viaja en el contexto de next-intl, y sólo hace falta
     para armar la dirección que va dentro del mensaje. `resolveLocale` porque llega como `string`. */
  const locale = resolveLocale(useLocale());

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
          {/* Avisar es la acción que cierra la venta, así que va primero y con peso; abrir el
              pedido es el destino de siempre. Envuelve porque «Avisar por WhatsApp» y «Ver el
              pedido» no caben en una línea de móvil. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <NotifySellerButton
              order={order}
              sellerPhone={order.sellerPhone}
              orderUrl={absoluteOrderUrl(locale, order.id)}
              labels={{
                intro: t("noticeIntro"),
                total: t("total"),
                /* Sin el nombre de la tienda: está escrito arriba, en esta misma tarjeta, y
                   repetirlo desbordaba el botón en pantallas estrechas. */
                cta: t("notifyShort"),
              }}
              testId="buyer-order-notify"
            />

            <Link
              href={{ pathname: "/pedido/[id]", params: { id: order.id } }}
              data-testid="buyer-order-link"
              className="focus-ring rounded-control px-2 py-1 font-medium text-pw-green hover:underline"
            >
              {t("viewOrder")}
            </Link>
          </div>
        </OrderCard>
      ))}
    </ul>
  );
}
