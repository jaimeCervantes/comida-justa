import { whatsappLink } from "~/domain/shared/whatsappLink";

export interface WhatsappOrderRequest {
  title: string;
  price?: number | null;
  /** Enlace absoluto a la publicación: es lo que el vendedor necesita para saber qué le piden. */
  url: string;
  whatsapp?: string | null;
  phone?: string | null;
}

/**
 * El mensaje que el comprador manda sin escribir nada.
 *
 * Lleva el enlace porque del otro lado hay una persona atendiendo varias conversaciones: el
 * título solo no basta cuando vende tres panes que se llaman casi igual.
 */
export function buildWhatsappOrderMessage({
  title,
  price,
  url,
}: Pick<WhatsappOrderRequest, "title" | "price" | "url">): string {
  const item = price ? `${title} — $${price}` : title;

  return `Hola, me interesa:\n${item}\n${url}`;
}

/**
 * El enlace para pedir un producto, o `null` cuando no hay número al que escribir.
 *
 * **`contact_whatsapp` manda sobre `contact_phone`:** el primero es el número que el vendedor
 * declaró para WhatsApp; el segundo es el de contacto general, que hoy tienen las 24
 * publicaciones y sirve de respaldo razonable en un país donde el móvil es WhatsApp.
 */
export function buildWhatsappOrderLink({
  title,
  price,
  url,
  whatsapp,
  phone,
}: WhatsappOrderRequest): string | null {
  return whatsappLink(
    whatsapp || phone,
    buildWhatsappOrderMessage({ title, price, url }),
  );
}
