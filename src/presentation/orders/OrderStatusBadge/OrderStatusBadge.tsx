"use client";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "~/domain/order/order";

/**
 * Colores por estado. Sin `dark:` porque salen de tokens semánticos, que ya cambian con el tema.
 *
 * `DRAFT` y `PAID` no los produce el sitio todavía, pero se pintan igual: la columna acepta los
 * siete y una insignia sin estilo se vería como un fallo el día que aparezcan.
 */
const TONE: Readonly<Record<OrderStatus, string>> = {
  DRAFT: "bg-pw-gray/15 text-text-support",
  PENDING: "bg-pw-orange/15 text-pw-orange",
  CONFIRMED: "bg-pw-green/15 text-pw-green",
  PAID: "bg-pw-green/15 text-pw-green",
  PREPARING: "bg-pw-lightgreen/20 text-pw-green",
  DELIVERED: "bg-pw-green text-white",
  CANCELLED: "bg-pw-gray/20 text-text-support line-through",
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations("orders");

  return (
    <span
      data-testid="order-status"
      data-status={status}
      className={`inline-flex items-center rounded-full px-3 py-1 text-label font-medium ${TONE[status]}`}
    >
      {/* La clave se compone en tiempo de ejecución, y aquí sí vale: `OrderStatus` es una unión
          cerrada, así que TypeScript comprueba que las siete existan en el catálogo. */}
      {t(`status.${status}`)}
    </span>
  );
}
