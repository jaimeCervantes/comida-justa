"use client";
import { useTranslations } from "next-intl";
import type { OrderStatus } from "~/domain/order/order";

/**
 * Colores por estado. Sin `dark:` porque salen de tokens semánticos, que ya cambian con el tema.
 *
 * `DRAFT` y `PAID` no los produce el sitio todavía, pero se pintan igual: la columna acepta los
 * siete y una insignia sin estilo se vería como un fallo el día que aparezcan.
 */
/*
 * Slice 12: los siete pasan del tinte por opacidad al par `soft`/`ink`.
 *
 * `bg-pw-green/15` no es un color, es una promesa: el fondo real depende de lo que haya debajo, y
 * la tinta no se eligió para él. Con el par, cada estado está medido (4.56 a 7.55) y se ve igual
 * caiga donde caiga. `PREPARING` toma la miel para no confundirse con `CONFIRMED`, que era su
 * problema: los dos verdes se distinguían solo por la opacidad.
 */
const TONE: Readonly<Record<OrderStatus, string>> = {
  DRAFT: "bg-surface-elevation-2 text-text-support",
  PENDING: "bg-brand-clay-soft text-brand-clay-700",
  CONFIRMED: "bg-brand-green-soft text-brand-green-900",
  PAID: "bg-brand-green-soft text-brand-green-900",
  PREPARING: "bg-brand-honey-soft text-brand-honey-ink",
  DELIVERED: "bg-button-primary-bg text-button-primary-text",
  CANCELLED: "bg-surface-elevation-2 text-text-support line-through",
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
