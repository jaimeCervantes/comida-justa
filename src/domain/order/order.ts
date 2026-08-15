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
/**
 * Los que **piden acción**: alguien está esperando al otro lado.
 *
 * No se derivan de `isFinal` aunque parezca lo mismo: `DRAFT` y `PAID` tampoco tienen salidas hoy y
 * sin embargo no son pedidos abiertos —el primero es del carrito del bot y el segundo espera al pago
 * en línea—. Enumerarlos es lo que hace que añadir `PAID` al flujo no los meta aquí por accidente.
 */
export const OPEN_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
];

/** Los que ya no se mueven y solo se consultan. */
export const CLOSED_STATUSES: readonly OrderStatus[] = [
  "DELIVERED",
  "CANCELLED",
];

/**
 * Con qué se entra a la lista.
 *
 * El vendedor entra por `open` porque un pedido con 300 entregados detrás sigue teniendo cuatro que
 * contestar, y mezclarlos por fecha los esconde.
 */
export type OrderScope = "open" | "closed" | "all";

export function statusesInScope(scope: OrderScope): readonly OrderStatus[] {
  if (scope === "open") return OPEN_STATUSES;
  if (scope === "closed") return CLOSED_STATUSES;

  return ORDER_STATUSES;
}

/** Lo que llega de la URL puede ser cualquier cosa; se reduce a un ámbito conocido. */
export function resolveScope(candidate: string | undefined): OrderScope {
  return candidate === "closed" || candidate === "all" ? candidate : "open";
}

export interface OrderLine {
  /** `null` cuando la publicación se borró: el renglón sobrevive con su copia. */
  postId: string | null;
  title: string;
  unitPrice: number;
  quantity: number;
  /**
   * La dirección de la publicación **hoy**, o `null` si ya no existe.
   *
   * No se guarda en el pedido a propósito: el slug cambia con el idioma, y lo que el renglón congela
   * es lo que se acordó —título y precio—, no cómo llegar. Se resuelve al leer.
   */
  slug: string | null;
  /** Su primera imagen, para reconocerlo de un vistazo. `null` si no tiene o si ya no existe. */
  imageUrl: string | null;
}

export interface Order {
  id: string;
  /**
   * El carrito del que nació. **Los N pedidos de un mismo carrito lo comparten.**
   *
   * Es lo que deja decir "de esta compra" cuando son varias tiendas, y es a lo que apuntará un pago
   * que cubra más de una. El id lo pone quien confirma —vive en la cookie `hs_checkout`, al lado del
   * propio carrito— y no este caso de uso: generarlo aquí, como hacía la primera versión, daba un
   * checkout distinto por tienda y no hermanaba nada.
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

/**
 * Lo que costó la compra entera: todos los pedidos que salieron del mismo carrito.
 *
 * Igual que `cartTotal`, **no es una cifra cobrable**: son varias tiendas y cada una cobra la suya.
 * Es lo que se gastó, que es lo que se quiere saber al mirar atrás.
 */
export function checkoutTotal(orders: readonly Pick<Order, "lines">[]): number {
  return orders.reduce((total, order) => total + orderTotal(order.lines), 0);
}

/**
 * Cuántas cosas lleva el pedido: **cantidades, no renglones**.
 *
 * `lines.length` habría sido contar filas de una tabla. El pedido real de tres renglones —1 pechuga
 * a la naranja, 2 asadas y 6 sueros— son **nueve cosas que alguien tiene que preparar y entregar**,
 * y decir "3" describe la base de datos, no el pedido.
 */
export function orderItemCount(lines: readonly OrderLine[]): number {
  return lines.reduce((count, line) => count + line.quantity, 0);
}
