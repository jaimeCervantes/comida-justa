import { decideListing, type OutreachListedProduct } from "./priceList";

/** Una foto de un producto, tal como se ofrece para subirla a Facebook. */
export interface OutreachPhoto {
  url: string;
  alt: string | null;
}

/** Un producto del texto con lo que hace falta para venderlo suelto: su título y sus fotos. */
export interface ListingSource extends OutreachListedProduct {
  title: string;
  photos: readonly OutreachPhoto[];
}

/**
 * Un artículo de compraventa: lo que Facebook pide en «Vender artículo», campo por campo.
 *
 * No lleva descripción propia: es el texto completo de la línea, el mismo en todos, y se ofrece una
 * sola vez junto a ellos.
 */
export interface ListingArticle {
  postId: string;
  title: string;
  /** Ya escrito como lo acepta el campo de precio: `136`, no `$136`. */
  price: string;
  photos: readonly OutreachPhoto[];
}

/**
 * El precio como lo pide el campo de Facebook: un número, sin `$` ni separador de miles.
 *
 * No es `formatListPrice`: aquella escribe un letrero para leerse en el texto, esta llena un campo
 * numérico, y una coma de miles ahí no siempre se acepta.
 */
export function formatPriceField(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

/**
 * Un artículo por producto disponible, en el orden del texto.
 *
 * Un artículo de compraventa admite **un solo** precio, por eso no se junta la línea entera en uno:
 * anunciar $96 cuando casi todo cuesta $125 se siente engañoso, y hay grupos que lo prohíben. Qué
 * sale lo decide `decideListing`, la misma regla que arma la lista: lo agotado no se vende suelto
 * si tampoco se anuncia junto.
 */
export function buildListingArticles(
  products: readonly ListingSource[],
): ListingArticle[] {
  return [...products]
    .sort((a, b) => a.position - b.position)
    .flatMap((product) => {
      const decision = decideListing(product);

      if (!decision.listed) return [];

      return [
        {
          postId: product.postId,
          title: product.title.trim(),
          price: formatPriceField(decision.price),
          photos: product.photos,
        },
      ];
    });
}
