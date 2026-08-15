import { canNotifySeller, type Order } from "~/domain/order/order";
import {
  buildWhatsappOrderNoticeLink,
  type OrderNoticeLabels,
} from "~/domain/order/whatsappOrderNotice";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";

export interface NotifySellerLabels extends OrderNoticeLabels {
  /** Lo que dice el botón. El mensaje va dentro; esto es lo que se lee en la pantalla. */
  cta: string;
}

/**
 * «Avisar por WhatsApp», con las dos condiciones para que aparezca ya resueltas.
 *
 * Lo piden tres sitios —la tarjeta de la lista, la ficha del pedido y cada renglón del bloque de la
 * compra—, así que **las dos reglas viven aquí y no repetidas en cada uno**: que el pedido siga
 * abierto (`canNotifySeller`) y que la tienda tenga número al que escribir (de eso ya se encarga
 * `WhatsappButton`, que con `href` nulo no pinta nada).
 *
 * **Recibe los textos como props en vez de leer el catálogo.** Es lo que le permite servir a los tres
 * sitios: la lista es un componente de cliente y el bloque de la compra es uno de servidor asíncrono,
 * y un componente con `useTranslations` no vale para los dos. Traduce quien lo usa.
 */
export default function NotifySellerButton({
  order,
  sellerPhone,
  orderUrl,
  labels,
  testId,
  className,
}: {
  order: Order;
  sellerPhone: string | null;
  orderUrl: string;
  labels: NotifySellerLabels;
  testId?: string;
  className?: string;
}) {
  if (!canNotifySeller(order.status)) return null;

  return (
    <WhatsappButton
      href={buildWhatsappOrderNoticeLink(order, sellerPhone, orderUrl, labels)}
      testId={testId}
      className={className}
    >
      {labels.cta}
    </WhatsappButton>
  );
}
