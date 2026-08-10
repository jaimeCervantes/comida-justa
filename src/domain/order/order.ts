/**
 * Los estados por los que pasa un pedido.
 *
 * Son **exactamente** los siete del enum `orderstatus` que ya existe en la base compartida: lo
 * diseñó el bot y nunca lo usó. Se respeta su grafía en mayúsculas para que el dominio y la columna
 * digan lo mismo sin una tabla de traducción en medio.
 *
 * `DRAFT` y `PAID` se declaran pero **no participan todavía**: el primero no tiene sentido aquí —el
 * borrador es el carrito, que vive en el navegador— y el segundo entra cuando exista el pago en
 * línea. Declararlos sin permitirlos es la diferencia entre "no lo hemos hecho" y "no existe".
 */
export const ORDER_STATUSES = [
  "DRAFT",
  "PENDING",
  "CONFIRMED",
  "PAID",
  "PREPARING",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Con el que nace todo pedido: se mandó y el vendedor todavía no lo ha visto. */
export const INITIAL_STATUS: OrderStatus = "PENDING";

/**
 * A dónde puede ir cada estado.
 *
 * **Se puede cancelar desde cualquier punto menos entregado**, y eso es deliberado: lo que ya está
 * en manos del cliente no se deshace cambiando una fila. Un pedido entregado que sale mal es una
 * devolución, que es otro problema y tendrá su propio estado el día que exista el pago.
 *
 * No hay marcha atrás. Un `PREPARING` que vuelve a `PENDING` no describe nada que pase de verdad
 * —el vendedor no "des-acepta"—, y permitirlo obligaría a que cada pantalla se defendiera de un
 * histórico que va y viene.
 */
/**
 * Los estados **a los que** un vendedor puede llevar un pedido.
 *
 * Es un subconjunto propio de `OrderStatus`, no un alias: a `PENDING` no se vuelve, y `DRAFT` y
 * `PAID` no son destinos de nadie hoy. Tenerlo tipado aparte es lo que permite que la pantalla
 * pinte un botón por destino y el catálogo de textos exija exactamente estas cuatro etiquetas — sin
 * una segunda lista escrita a mano que se desincronice de estas reglas.
 */
export type OrderAction = Extract<
  OrderStatus,
  "CONFIRMED" | "PREPARING" | "DELIVERED" | "CANCELLED"
>;

const TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderAction[]>> = {
  DRAFT: [],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PAID: [],
  PREPARING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function nextStatuses(from: OrderStatus): readonly OrderAction[] {
  return TRANSITIONS[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  /* `to` llega como `OrderStatus` porque puede venir de un formulario: la gracia de esta función es
     justamente decir que no cuando el destino no es de los permitidos. */
  return (TRANSITIONS[from] as readonly OrderStatus[]).includes(to);
}

/** Un pedido que ya no se mueve: ni el vendedor ni nadie tiene nada que hacer con él. */
export function isFinal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Un renglón del pedido, con el precio **congelado**.
 *
 * `unitPrice` y `title` son copias del momento en que se pidió, no referencias a la publicación. Si
 * el vendedor sube el precio o corrige el título mañana, el pedido de ayer sigue diciendo lo que se
 * acordó. Sin esto no hay histórico creíble ni reclamación posible.
 */
export interface OrderLine {
  postId: string;
  title: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  /**
   * El carrito del que nació.
   *
   * Los N pedidos que salen de un mismo carrito lo comparten. Hoy N es siempre 1 porque hay un solo
   * vendedor, y aun así se guarda: es lo que permitirá decir "de esta compra" cuando sean varios, y
   * es a lo que apuntará un pago que cubra más de una tienda.
   */
  checkoutId: string;
  sellerId: string;
  buyerId: string;
  status: OrderStatus;
  lines: OrderLine[];
  createdAt: Date;
}

export function lineAmount(line: OrderLine): number {
  return line.unitPrice * line.quantity;
}

/** Lo que se le debe a esa tienda. Se calcula sobre los renglones, nunca se lee de una columna. */
export function orderTotal(lines: readonly OrderLine[]): number {
  return lines.reduce((total, line) => total + lineAmount(line), 0);
}
