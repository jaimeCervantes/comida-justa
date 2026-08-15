/**
 * El identificador de la **compra en curso**: lo que hermana los pedidos nacidos de un mismo carrito.
 *
 * Vive en su propia cookie y no dentro de `hs_cart` porque no es un renglón: no se añade, no se
 * quita y no tiene cantidad. Meterlo en el mismo valor habría obligado a que `parseCart` distinguiera
 * dos formas de renglón, que es como se empiezan a colar los errores de formato.
 *
 * Su vida es exactamente la del carrito: nace al confirmar la primera tienda y muere cuando el
 * carrito se queda vacío. Un checkout que sobreviviera al carrito engancharía la compra de mañana a
 * la de hoy.
 */
export const CHECKOUT_COOKIE = "hs_checkout";

/** Lo mismo que el carrito: mientras haya carrito, hay compra a la que pertenecer. */
export const CHECKOUT_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Un uuid canónico, que es lo que acepta la columna `customer_orders.checkout_id`.
 *
 * No se comprueba la versión ni la variante: lo que importa es que Postgres pueda leerlo, y `uuid`
 * acepta cualquiera de los 32 dígitos con sus guiones.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * La compra en curso, o `null` si no hay ninguna empezada.
 *
 * **Una cookie la escribe cualquiera**, y este valor va directo a una columna `uuid`: lo que no lo
 * sea reventaría el `INSERT` del pedido con un error de tipo justo en el momento de comprar. Se
 * descarta antes y se empieza un checkout nuevo — mismo criterio que `parseCart`.
 */
export function parseCheckoutId(raw: string | null | undefined): string | null {
  if (!raw) return null;

  return UUID.test(raw) ? raw : null;
}
