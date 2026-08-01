import { whatsappLink } from "~/domain/shared/whatsappLink";

export interface WhatsappStoreRequest {
  storeName: string;
  /** Enlace absoluto a la tienda. */
  url: string;
  phone?: string | null;
}

/**
 * El enlace para escribirle a una tienda sin haber elegido producto.
 *
 * Existe aparte del pedido porque la intención es otra: en la tienda todavía se está preguntando,
 * y un mensaje que nombra un producto que el comprador no eligió sería ruido.
 */
export function buildWhatsappStoreLink({
  storeName,
  url,
  phone,
}: WhatsappStoreRequest): string | null {
  return whatsappLink(
    phone,
    `Hola, ${storeName}:\nvi su tienda en ${url} y quiero preguntarles por lo que venden.`,
  );
}
