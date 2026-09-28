import type {
  Order,
  OrderLine,
  OrderScope,
  OrderStatus,
  OrderStatusChange,
} from "./order";
import type { StockDemand, StockEffect } from "./orderStock";

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
  /**
   * A dónde se entrega, si el navegador lo dio a tiempo al confirmar. Es de mejor esfuerzo: sin él
   * el pedido se registra igual, y el comprador lo puede compartir después desde la ficha.
   */
  deliveryLocation?: { lat: number; lng: number } | null;
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

export type AppointmentOrderWithSeller = OrderWithSeller & {
  appointment: NonNullable<Order["appointment"]>;
};

export type AppointmentOrderWithBuyer = OrderWithBuyer & {
  appointment: NonNullable<Order["appointment"]>;
};

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

  listAppointmentsByBuyer(input: {
    buyerId: string;
    locale: string;
    fallbackLocale: string;
    limit?: number;
  }): Promise<AppointmentOrderWithSeller[]>;

  listAppointmentsBySeller(input: {
    sellerId: string;
    locale: string;
    fallbackLocale: string;
    limit?: number;
  }): Promise<AppointmentOrderWithBuyer[]>;

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
   * Qué pide el pedido de cada publicación y cuántas quedan hoy.
   *
   * Existe aparte de `findById` por lo mismo que `findHeader`: quien mueve un pedido no lo pinta, y
   * traer slugs y miniaturas para decidir si alcanza el inventario eran tres `JOIN` a la basura.
   *
   * `stockQuantity` viene nulo tanto cuando la publicación no lleva inventario como cuando ya no
   * existe. Las dos ausencias significan lo mismo aquí —no hay número que mover— y por eso no se
   * distinguen.
   */
  stockDemandOf(
    orderId: string,
  ): Promise<Array<StockDemand & { stockQuantity: number | null }>>;

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
   *
   * **Deja constancia del paso en la misma transacción.** Si la fila del histórico no se pudiera
   * escribir, el estado tampoco cambia: volvería a existir justo lo que el slice 8 vino a arreglar,
   * un pedido entregado sin constancia de cuándo. Y al revés, un intento que no encuentra fila que
   * tocar —el de la segunda pestaña— no deja rastro, porque no pasó nada.
   */
  updateStatus(input: {
    orderId: string;
    sellerId: string;
    fromStatus: OrderStatus;
    status: OrderStatus;
    /** Quién lo movió, para el histórico. Nulo cuando no hay una persona detrás. */
    changedBy?: string | null;
    /**
     * Qué hacerle al inventario, **decidido en el dominio** (`stockEffectOf`).
     *
     * Viaja hasta aquí en vez de calcularse abajo porque va en la MISMA transacción que el cambio
     * de estado: un pedido que quedara aceptado sin descontar, o descontado sin quedar aceptado,
     * son las dos formas de que el número deje de significar nada.
     */
    stockEffect: StockEffect;
    /**
     * El token del repartidor, **solo cuando `status` es `SHIPPED`**. Decidido en el caso de uso y
     * no aquí, por lo mismo que `stockEffect`: viaja en la misma transacción que el cambio de
     * estado, así que un pedido no puede quedar Enviado sin enlace que compartir.
     */
    courierTrackingToken?: string | null;
  }): Promise<OrderStatus | null>;

  /**
   * El token que ya tiene un pedido Enviado, para que el vendedor lo pueda compartir de nuevo.
   *
   * `null` tanto si el pedido no es de esa tienda como si no está `SHIPPED` — las dos cosas se ven
   * igual desde fuera, mismo criterio que `findHeader`.
   */
  getCourierTrackingToken(
    orderId: string,
    sellerId: string,
  ): Promise<string | null>;

  /**
   * Lo mínimo para decidir qué enseñarle a quien abre el enlace del repartidor: si el token no
   * coincide, `null` — ni siquiera se le confirma que el pedido existe.
   */
  findByCourierToken(
    orderId: string,
    token: string,
  ): Promise<{ status: OrderStatus } | null>;

  /**
   * Guarda la posición del repartidor **solo si el token coincide y el pedido sigue `SHIPPED`**.
   *
   * Las dos condiciones van en el `WHERE` de la escritura y no en un `if` previo — el mismo
   * criterio que `updateStatus`. Así el enlace deja de aceptar posiciones en cuanto el pedido se
   * entrega o se cancela, sin que nadie tenga que invalidarlo aparte.
   */
  saveCourierLocation(input: {
    orderId: string;
    token: string;
    lat: number;
    lng: number;
  }): Promise<boolean>;

  /**
   * Guarda o reemplaza a dónde se entrega el pedido, **solo si es de ese comprador y sigue
   * abierto** (`canShareDeliveryLocation`).
   *
   * Las dos condiciones van en el `WHERE` de la escritura, mismo criterio que `saveCourierLocation`:
   * un pedido ajeno, inexistente o ya cerrado se ven igual desde fuera — `false`.
   */
  saveDeliveryLocation(input: {
    orderId: string;
    buyerId: string;
    lat: number;
    lng: number;
  }): Promise<boolean>;

  /**
   * Por dónde pasó un pedido, del primer paso al último.
   *
   * Va aparte de `findById` y no dentro: lo pinta **una** pantalla —la ficha— y las listas traen
   * diez pedidos por página. Meterlo en la consulta común habría sido diez recorridos leídos para
   * tirar nueve.
   *
   * Devuelve vacío para los pedidos anteriores a la migración, que es la verdad: nadie registró sus
   * pasos. Quien lo pinta lo dice en vez de disimularlo.
   */
  historyOf(orderId: string): Promise<OrderStatusChange[]>;
}
