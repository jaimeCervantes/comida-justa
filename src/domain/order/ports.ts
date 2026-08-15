import type { Order, OrderLine, OrderScope, OrderStatus } from "./order";

/**
 * Lo que de un renglón se **escribe**.
 *
 * Es un subconjunto de `OrderLine` y no el mismo tipo porque el slug y la imagen **no se guardan**:
 * se resuelven al leer contra la publicación de hoy. Tenerlos aquí invitaría a congelarlos, y un
 * slug congelado apunta a una dirección que puede haber cambiado de idioma.
 */
export type NewOrderLine = Pick<
  OrderLine,
  "postId" | "title" | "unitPrice" | "quantity"
>;

/** Un pedido todavía sin identidad: lo que se le pide al repositorio que cree. */
export interface NewOrder {
  checkoutId: string;
  sellerId: string;
  buyerId: string;
  lines: NewOrderLine[];
}

/** Un pedido con lo que hace falta para pintarlo sin volver a consultar. */
export interface OrderWithSeller extends Order {
  sellerName: string;
  sellerHandle: string | null;
  sellerPhone: string | null;
}

/**
 * Un pedido con **quién lo hizo** ya resuelto.
 *
 * Es lo que el vendedor necesita para saber a quién le está preparando algo, y no estaba: la
 * consulta traía la tienda —que al vendedor le sobra— y no el comprador. Los tres campos son nulos
 * porque las tres columnas lo son: `users.name` puede faltar, el `username` sólo lo tiene quien lo
 * eligió, y sin él no hay perfil al que enlazar.
 */
export interface OrderWithBuyer extends Order {
  buyerName: string | null;
  buyerHandle: string | null;
  buyerImage: string | null;
}

/**
 * Las dos partes, que es lo que la consulta produce de todas formas.
 *
 * Cada lista se queda con la mitad que le sirve —quien compra ya sabe quién es— y la ficha del
 * pedido las necesita las dos, porque la miran los dos.
 */
export interface OrderWithParties extends OrderWithSeller, OrderWithBuyer {}

/**
 * Qué trozo de la lista se pide.
 *
 * **Nunca se lee la lista entera.** Un vendedor con trescientos pedidos entregados no puede pagar
 * traerlos todos a memoria y al HTML en cada visita, y ese era el defecto de la primera versión:
 * `listBySeller` no tenía `LIMIT`.
 */
export interface OrderQuery {
  page: number;
  pageSize: number;
  scope: OrderScope;
  /** Filtra por el título **congelado** del renglón. Vacío o ausente, no filtra. */
  term?: string;
  /** Decide en qué idioma salen el slug del producto y su imagen. */
  locale: string;
  fallbackLocale: string;
}

export interface OrderPage<T> {
  orders: T[];
  /** Cuántos hay en total con ese filtro, para poder pintar la paginación. */
  total: number;
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

  /** Lo que le han pedido a esa tienda, con quien lo pidió ya resuelto. */
  listBySeller(
    sellerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithBuyer>>;

  /**
   * Los pedidos hermanos: los que salieron del mismo carrito.
   *
   * **Va acotado al comprador, no solo al checkout.** Es su compra, y la otra tienda a la que le
   * pidió no es asunto de nadie más: sin el `user_id` en el `WHERE`, la ficha de un pedido le estaría
   * enseñando al vendedor la lista de sus competidores en ese carrito.
   *
   * No pagina, al revés que las listas: un carrito tiene tantas tiendas como tiendas hay, y hoy son
   * dos. El día que un carrito reparta entre veinte, esto se mira otra vez.
   */
  listByCheckout(input: {
    checkoutId: string;
    buyerId: string;
    locale: string;
    fallbackLocale: string;
  }): Promise<OrderWithSeller[]>;

  /** Lo que ha pedido esa persona, con la tienda ya resuelta para poder enseñarla. */
  listByBuyer(
    buyerId: string,
    query: OrderQuery,
  ): Promise<OrderPage<OrderWithSeller>>;

  /**
   * Cuántos pedidos abiertos tiene cada papel, para las pestañas.
   *
   * Va aparte de las listas porque las pestañas tienen que decir "hay 4 esperando" **aunque estés
   * mirando la otra**: contar sobre la página que se pintó daría el número de esa página.
   */
  countOpen(input: {
    sellerId?: string | null;
    buyerId: string;
  }): Promise<{ received: number; placed: number }>;

  findById(
    orderId: string,
    locale: string,
    fallbackLocale: string,
  ): Promise<OrderWithParties | null>;

  /**
   * Solo de quién es y en qué estado está.
   *
   * Existe aparte de `findById` porque quien mueve un pedido no pinta nada: comprueba el dueño y la
   * transición. Traer los renglones, su slug y su miniatura para eso eran tres `JOIN` que acababan
   * en la basura, y además obligaba a arrastrar el idioma hasta un caso de uso que no lo usa.
   */
  findHeader(
    orderId: string,
  ): Promise<{ sellerId: string; status: OrderStatus } | null>;

  /**
   * Cambia el estado **solo si el pedido es de ese vendedor y sigue en el estado de partida**.
   *
   * Las dos condiciones viajan en el `WHERE` y no en un `if` previo. La autorización, porque
   * comprobar y después escribir son dos operaciones y entre ellas cabe otra petición. Y
   * `fromStatus`, porque el vendedor decide mirando una pantalla que puede llevar minutos abierta:
   * dos pestañas, o el móvil y el ordenador, y el segundo clic aplicaría una transición calculada
   * sobre un estado que ya no era el actual.
   *
   * Devuelve el estado que quedó, o `null` cuando no hubo fila que tocar. Quien llama **no
   * distingue** los tres motivos —no existe, no es suyo, ya se movió— a propósito: decirle a un
   * extraño «ese pedido existe pero no es tuyo» ya es contarle algo.
   *
   * Devuelve el estado y no el pedido entero porque nadie lo pinta: la pantalla se recarga sola por
   * `revalidatePath`. Traer los renglones aquí era una consulta que se tiraba a la basura.
   */
  updateStatus(input: {
    orderId: string;
    sellerId: string;
    fromStatus: OrderStatus;
    status: OrderStatus;
  }): Promise<OrderStatus | null>;
}
