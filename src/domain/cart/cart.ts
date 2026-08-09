import type { CartSelection } from "./cartSelection";

/** La tienda a la que se le pide. `phone` es `NOT NULL` en `sellers`, pero la lectura lo permite. */
export interface CartSeller {
  id: string;
  name: string;
  /** `sellers.slug`: la dirección de su tienda. Nula en los vendedores que creó el bot. */
  handle: string | null;
  phone: string | null;
}

/** El producto tal como está **hoy**, releído en cada render. */
export interface CartProduct {
  postId: string;
  title: string;
  /** El de la ruta en el idioma que se está leyendo: es el enlace que viaja en el pedido. */
  slug: string;
  price: number;
  isAvailable: boolean;
  seller: CartSeller;
}

export interface CartLine {
  product: CartProduct;
  quantity: number;
  /** Lo que suma este renglón. **Cero cuando el producto ya no está disponible.** */
  amount: number;
}

/**
 * Los renglones de una sola tienda, con lo que hay que pagarle a ella.
 *
 * No existe —a propósito— ningún total que sume varias tiendas: cada una acepta, prepara y entrega
 * por su cuenta, así que una cifra que las mezclara no se la podría cobrar nadie.
 */
export interface CartSellerGroup {
  seller: CartSeller;
  lines: CartLine[];
  subtotal: number;
}

/**
 * Cruza lo que el navegador recuerda con lo que la base dice hoy.
 *
 * Un `postId` sin producto **desaparece**: la publicación se borró o dejó de ser un producto, y no
 * hay nada que enseñar de ella. Lo agotado es distinto y **se conserva**, con `amount` en cero: quien
 * lo puso en el carrito tiene derecho a ver que ya no está antes de que le desaparezca de la pantalla.
 */
export function buildCartLines(
  selection: readonly CartSelection[],
  products: readonly CartProduct[],
): CartLine[] {
  const byId = new Map(products.map((product) => [product.postId, product]));

  return selection.flatMap((line) => {
    const product = byId.get(line.postId);

    if (!product) return [];

    return [
      {
        product,
        quantity: line.quantity,
        amount: product.isAvailable ? product.price * line.quantity : 0,
      },
    ];
  });
}

/**
 * Parte el carrito en un pedido por tienda. **Es la operación de la que cuelga todo lo demás.**
 *
 * Hoy la base tiene un solo vendedor, así que siempre devuelve un grupo — por este camino, no por
 * una rama especial. El día que haya dos, la pantalla y el mensaje de WhatsApp ya saben qué hacer
 * sin cambiar de forma.
 *
 * El orden es el de aparición en el carrito, no alfabético: lo que se añadió primero manda, que es
 * lo que hace que la lista no se reordene sola bajo el cursor al cambiar una cantidad.
 */
export function groupBySeller(lines: readonly CartLine[]): CartSellerGroup[] {
  const groups = new Map<string, CartSellerGroup>();

  for (const line of lines) {
    const { seller } = line.product;
    const group = groups.get(seller.id);

    if (group) {
      group.lines.push(line);
      group.subtotal += line.amount;
      continue;
    }

    groups.set(seller.id, {
      seller,
      lines: [line],
      subtotal: line.amount,
    });
  }

  return [...groups.values()];
}
