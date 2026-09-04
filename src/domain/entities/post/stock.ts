import { PRODUCT_KIND } from "./hazloSanoProduct";

/**
 * El tope de un `integer` de PostgreSQL. Se comprueba aquí para que pasarse devuelva un mensaje
 * entendible en vez de un error del driver a mitad de la escritura.
 */
const MAX_STOCK = 2_147_483_647;

export type StockFields = {
  kind?: string | null;
  /** `posts.stock_quantity`. **Nulo no es cero**: es no llevar inventario. */
  stockQuantity?: number | null;
};

export type ParsedStock =
  | { quantity: number; error?: undefined }
  | { quantity?: undefined; error: "invalid-stock" };

/**
 * ¿Esta publicación cuenta unidades?
 *
 * Es la pregunta que separa las 432 publicaciones que existían al migrar —todas nulas— de las que
 * alguien puso a contar. Nulo significa «no sé cuántas hay porque nadie lleva la cuenta», y leerlo
 * como cero habría agotado el catálogo entero en el instante de aplicar la migración.
 */
export function carriesInventory(post: StockFields): boolean {
  return typeof post.stockQuantity === "number";
}

/**
 * ¿Se le pueden contar ejemplares?
 *
 * Sólo a un `producto`. Un servicio se vende, pero no se entrega en piezas: a una masajista no se
 * le acaban los masajes, su disponibilidad es la agenda. Un evento no se agota, caduca. Un anuncio
 * no se vende. Por eso la pregunta es más estrecha que `isSellable`, que incluye al servicio.
 */
export function canTrackStock(post: StockFields): boolean {
  return post.kind === PRODUCT_KIND;
}

export function isOutOfStock(post: StockFields): boolean {
  return (
    canTrackStock(post) && carriesInventory(post) && post.stockQuantity === 0
  );
}

/**
 * La disponibilidad que corresponde a un inventario.
 *
 * Es la regla que mantiene una sola verdad: cuando un producto lleva inventario, `is_available` no
 * se decide a mano, se deriva de aquí y se escribe en la misma sentencia. Así el chatbot, el
 * carrito, la búsqueda y el JSON-LD siguen filtrando por la columna que ya filtraban sin conocer
 * `stock_quantity`.
 */
export function availabilityForStock(quantity: number): boolean {
  return quantity > 0;
}

/**
 * Lo que escribió una persona en un formulario, convertido en un inventario o en un error.
 *
 * Se valida aquí y no contra el `CHECK` de la base porque el `CHECK` sólo sabe decir que no, y
 * llegar hasta él convierte «eso no es un número» en una violación de constraint que nadie puede
 * enseñarle a quien vende.
 */
export function parseStockQuantity(raw: unknown): ParsedStock {
  if (typeof raw !== "string" && typeof raw !== "number") {
    return { error: "invalid-stock" };
  }

  const text = String(raw).trim();
  if (text === "") return { error: "invalid-stock" };

  const quantity = Number(text);

  if (!Number.isInteger(quantity)) return { error: "invalid-stock" };
  if (quantity < 0 || quantity > MAX_STOCK) return { error: "invalid-stock" };

  return { quantity };
}
