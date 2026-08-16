"use client";
import { useFormatter, useTranslations } from "next-intl";
import { closedAt, type Order } from "~/domain/order/order";

/**
 * Cuándo terminó el pedido: entregado o cancelado, con su fecha y su hora.
 *
 * **Sale de `updatedAt`, no del histórico de pasos.** Las dos fuentes dirían lo mismo para un pedido
 * que termine a partir de hoy, pero sólo `updatedAt` contesta también por los que ya estaban
 * entregados antes de que el histórico existiera — y ése era justo el caso del pedido más viejo de
 * la base. Preguntarle al histórico habría dejado sin fecha al único que ya la tenía.
 *
 * **Nada mientras siga abierto.** `updatedAt` de un `PREPARING` dice cuándo empezó a prepararse, no
 * cuándo se entregó; enseñarlo como fecha de entrega sería mentir con un dato correcto. Es la misma
 * regla de `Thumbnail`: si no hay nada que decir, no se pinta un hueco.
 */
export default function OrderClosedOn({
  order,
}: {
  order: Pick<Order, "status" | "updatedAt">;
}) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const at = closedAt(order);

  if (!at) return null;

  const date = format.dateTime(at, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <span data-testid="order-closed-on" data-status={order.status}>
      {/* Dos claves y no una compuesta: "entregado" y "cancelado" no son la misma noticia, y una
          clave armada en tiempo de ejecución es una clave que no se encuentra con grep. */}
      {order.status === "CANCELLED"
        ? t("cancelledOn", { date })
        : t("deliveredOn", { date })}
    </span>
  );
}
