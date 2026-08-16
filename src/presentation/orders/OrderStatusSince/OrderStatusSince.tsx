"use client";
import { useFormatter, useTranslations } from "next-intl";
import { type Order, statusSince } from "~/domain/order/order";

/**
 * Desde cuándo el pedido está como está. **Va junto a la insignia del estado.**
 *
 * Antes ahí iba la fecha de creación, y eso era lo que confundía: la insignia dice "Aceptado" y la
 * fecha decía el día en que se hizo el pedido, así que se leía como "aceptado ese día". La creación
 * no desaparece — baja a segunda línea, que es el sitio de un dato secundario.
 *
 * **Cada estado tiene su frase entera**, no un "desde el…" suelto que dependa de leer la insignia
 * de al lado. Un lector de pantalla puede llegar aquí solo, y "el 16 de agosto" sin más no dice
 * nada. La clave se compone en tiempo de ejecución y aquí sí vale: `OrderStatus` es una unión
 * cerrada, así que TypeScript comprueba que las siete existan — el mismo trato que `OrderStatusBadge`.
 *
 * **Un pedido que nunca se movió no pinta nada.** `updatedAt` nace igual a `createdAt`, así que no
 * habría noticia que dar: repetir la misma fecha con dos nombres confunde más que callar.
 */
export default function OrderStatusSince({
  order,
}: {
  order: Pick<Order, "status" | "createdAt" | "updatedAt">;
}) {
  const t = useTranslations("orders");
  const format = useFormatter();
  const since = statusSince(order);

  if (!since) return null;

  return (
    <span data-testid="order-status-since" data-status={order.status}>
      {t(`since.${order.status}`, {
        date: format.dateTime(since, {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      })}
    </span>
  );
}
