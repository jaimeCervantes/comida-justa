import type { OutreachListedProduct } from "../priceList";

let sequence = 0;

/**
 * Un pan disponible, publicado y con inventario: el caso que sale en la lista sin más.
 *
 * Cada prueba cambia solo el campo del que trata, para que se lea qué la hace distinta.
 */
export function listedProduct(
  overrides: Partial<OutreachListedProduct> = {},
): OutreachListedProduct {
  sequence += 1;

  return {
    postId: `post-${sequence}`,
    label: "Natural",
    emoji: null,
    position: sequence,
    kind: "producto",
    price: 96,
    isAvailable: true,
    stockQuantity: 2,
    moderationStatus: "published",
    ...overrides,
  };
}

/** Los panes agregados en ese orden: la posición sale de su lugar en la lista. */
export function addedInOrder(
  products: readonly Partial<OutreachListedProduct>[],
): OutreachListedProduct[] {
  return products.map((overrides, position) =>
    listedProduct({ ...overrides, position }),
  );
}
