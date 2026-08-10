import type { CartSellerGroup } from "~/domain/cart/cart";
import { whatsappLink } from "~/domain/shared/whatsappLink";

/** Los textos los pone quien llama, que es el único que sabe en qué idioma se está leyendo. */
export interface CartOrderLabels {
  /** Encabeza el mensaje. Ej.: "Hola, quiero pedir:" */
  intro: string;
  /** Etiqueta del total. Ej.: "Total" */
  total: string;
}

/**
 * El mensaje de un pedido de varios productos de **una** tienda.
 *
 * Lleva el enlace de cada renglón por la misma razón que el pedido de un solo producto (ver
 * `whatsappOrder.ts`): del otro lado hay una persona atendiendo varias conversaciones. Y el catálogo
 * real lo pide a gritos — hay tres hogazas de masa madre que se llaman casi igual y cuestan 96, 125
 * y 136.
 *
 * **Lo agotado no entra.** Si el vendedor lo marcó mientras estaba en el carrito, pedírselo empieza
 * la conversación con algo que no puede darte.
 */
export function buildWhatsappCartMessage(
  group: CartSellerGroup,
  baseUrl: string,
  labels: CartOrderLabels,
): string | null {
  const available = group.lines.filter((line) => line.product.isAvailable);

  if (available.length === 0) return null;

  const items = available
    .map(
      (line) =>
        `${line.quantity} × ${line.product.title} — $${line.amount}\n${baseUrl}/${line.product.slug}`,
    )
    .join("\n");

  return `${labels.intro}\n\n${items}\n\n${labels.total}: $${group.subtotal}`;
}

/** El enlace listo para `wa.me`, o `null` cuando no hay número o no queda nada que pedir. */
export function buildWhatsappCartLink(
  group: CartSellerGroup,
  baseUrl: string,
  labels: CartOrderLabels,
): string | null {
  const message = buildWhatsappCartMessage(group, baseUrl, labels);

  if (!message) return null;

  return whatsappLink(group.seller.phone, message);
}
