"use client";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { type Order, orderItemCount } from "~/domain/order/order";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import OrderClosedOn from "~/presentation/orders/OrderClosedOn/OrderClosedOn";
import OrderLines from "~/presentation/orders/OrderLines/OrderLines";
import OrderStatusBadge from "~/presentation/orders/OrderStatusBadge/OrderStatusBadge";

/**
 * Un pedido en una lista, **igual para quien compró y para quien vende**.
 *
 * Las dos tarjetas eran distintas por accidente, no por decisión: la del comprador se escribió
 * "resumida, no desglosada" apostando a que el detalle podía esperar a `/pedido/<id>`. Los pedidos
 * reales tumbaron la apuesta —cuatro de cinco a la misma tienda, los cuatro Pendientes, tres de la
 * misma semana—: tienda, estado y fecha ya no distinguen nada, y lo único que los separa es qué se
 * pidió.
 *
 * Lo que cambia entre los dos papeles cabe en dos props: **con quién es** el pedido (la tienda, o
 * quien lo pidió) y **qué se puede hacer** con él (avanzarlo, o abrirlo). El resto —estado, fecha,
 * cuántos artículos, los renglones y el total— es el mismo pedido visto desde los dos lados.
 */
export default function OrderCard({
  order,
  party,
  testId,
  children,
}: {
  order: Order;
  /** Con quién es: `OrderBuyer` para el vendedor, el nombre de la tienda para quien compró. */
  party: ReactNode;
  testId: string;
  /** El pie: las acciones del vendedor, o el enlace al detalle. */
  children?: ReactNode;
}) {
  const t = useTranslations("orders");
  const format = useFormatter();

  return (
    <Surface
      as="li"
      radius="lg"
      background="raised"
      border="subtle"
      className="p-4"
      data-testid={testId}
      data-order-id={order.id}
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          {party}
          <span className="text-label text-text-support">
            {/* `useFormatter` y no `toLocaleDateString`: el idioma es el de la ruta y no el del
                navegador, así que el servidor y el cliente pintan lo mismo. */}
            {t("placedOn", {
              date: format.dateTime(order.createdAt, { dateStyle: "medium" }),
            })}
            {" · "}
            <span data-testid="order-item-count">
              {t("items", { count: orderItemCount(order.lines) })}
            </span>
          </span>

          {/* Sólo cuando terminó. Un pedido abierto no tiene fecha de entrega que enseñar. */}
          <OrderClosedOn order={order} />
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      <OrderLines lines={order.lines} />

      {children ? <div className="mt-4">{children}</div> : null}
    </Surface>
  );
}
