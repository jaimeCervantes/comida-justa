import type { Order, OrderLine, OrderStatus } from "./order";

/** Un pedido todavía sin identidad: lo que se le pide al repositorio que cree. */
export interface NewOrder {
  checkoutId: string;
  sellerId: string;
  buyerId: string;
  lines: OrderLine[];
}

/** Un pedido con lo que hace falta para pintarlo sin volver a consultar. */
export interface OrderWithSeller extends Order {
  sellerName: string;
  sellerHandle: string | null;
  sellerPhone: string | null;
}

export interface OrderRepository {
  /**
   * Crea los N pedidos de un mismo carrito, **todos o ninguno**.
   *
   * En una transacción porque un carrito de dos tiendas que grabe una y falle la otra deja al
   * comprador creyendo que pidió las dos cosas. Hoy N es siempre 1 y la transacción no se nota; el
   * día que no lo sea, ya está.
   */
  createAll(orders: readonly NewOrder[]): Promise<Order[]>;

  /** Lo que le han pedido a esa tienda, de lo más reciente a lo más viejo. */
  listBySeller(sellerId: string): Promise<Order[]>;

  /** Lo que ha pedido esa persona, con la tienda ya resuelta para poder enseñarla. */
  listByBuyer(buyerId: string): Promise<OrderWithSeller[]>;

  findById(orderId: string): Promise<OrderWithSeller | null>;

  /**
   * Cambia el estado **solo si el pedido es de ese vendedor y sigue en el estado de partida**.
   *
   * Las dos condiciones viajan en el `WHERE` y no en un `if` previo. La autorización, porque
   * comprobar y después escribir son dos operaciones y entre ellas cabe otra petición. Y
   * `fromStatus`, porque el vendedor decide mirando una pantalla que puede llevar minutos abierta:
   * dos pestañas, o el móvil y el ordenador, y el segundo clic aplicaría una transición calculada
   * sobre un estado que ya no era el actual.
   *
   * Devuelve `null` cuando no hubo fila que tocar. Quien llama **no distingue** los tres motivos
   * —no existe, no es suyo, ya se movió— a propósito: decirle a un extraño «ese pedido existe pero
   * no es tuyo» ya es contarle algo.
   */
  updateStatus(input: {
    orderId: string;
    sellerId: string;
    fromStatus: OrderStatus;
    status: OrderStatus;
  }): Promise<Order | null>;
}
