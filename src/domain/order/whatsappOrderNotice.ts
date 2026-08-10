import { whatsappLink } from "~/domain/shared/whatsappLink";
import { lineAmount, type Order, orderTotal } from "./order";

export interface OrderNoticeLabels {
  /** Encabeza el mensaje. Ej.: "Hola, te acabo de hacer un pedido:" */
  intro: string;
  /** Etiqueta del total. Ej.: "Total" */
  total: string;
}

/**
 * El aviso que el comprador le manda al vendedor cuando ya hay pedido registrado.
 *
 * **Lleva un solo enlace, el del pedido, en vez de uno por producto.** Es la diferencia con el
 * mensaje del carrito (`whatsappCartOrder.ts`), y tiene dos motivos: el renglón guarda una copia del
 * título pero no el slug —la publicación puede haberse borrado y el pedido sobrevive—, y sobre todo
 * el vendedor abre esa dirección y ve el pedido entero, con lo que le queda por hacer.
 */
export function buildWhatsappOrderNoticeMessage(
  order: Order,
  orderUrl: string,
  labels: OrderNoticeLabels,
): string {
  const items = order.lines
    .map((line) => `${line.quantity} × ${line.title} — $${lineAmount(line)}`)
    .join("\n");

  return `${labels.intro}\n\n${items}\n\n${labels.total}: $${orderTotal(order.lines)}\n${orderUrl}`;
}

/** El enlace listo para `wa.me`, o `null` cuando la tienda no tiene número al que escribir. */
export function buildWhatsappOrderNoticeLink(
  order: Order,
  sellerPhone: string | null,
  orderUrl: string,
  labels: OrderNoticeLabels,
): string | null {
  return whatsappLink(
    sellerPhone,
    buildWhatsappOrderNoticeMessage(order, orderUrl, labels),
  );
}
