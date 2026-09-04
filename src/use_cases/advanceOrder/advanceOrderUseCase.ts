import { canTransition, type OrderStatus } from "~/domain/order/order";
import {
  type AvailableStock,
  shortfalls,
  stockEffectOf,
} from "~/domain/order/orderStock";
import type { OrderRepository } from "~/domain/order/ports";

export interface AdvanceOrderInput {
  orderId: string;
  /** El de la tienda de quien pide el cambio. Sale de la sesión, **nunca** del formulario. */
  sellerId: string;
  status: OrderStatus;
  /**
   * La persona que lo mueve, para el histórico. De la sesión, como `sellerId`.
   *
   * Es distinto de la tienda: una tienda puede tener varias manos encima, y «¿quién canceló esto?»
   * no se reconstruye hacia atrás. Opcional porque el día que un pedido lo mueva el pago o el bot no
   * habrá nadie a quien apuntar.
   */
  changedBy?: string | null;
}

export type AdvanceOrderResult =
  | { status: OrderStatus }
  | { error: AdvanceOrderError };

export type AdvanceOrderError =
  /** No existe, no es de esa tienda, o se movió mientras tanto. Los tres se ven igual desde fuera. */
  | "not-found"
  /** Existe y es suyo, pero de donde está no se puede ir a donde pide. */
  | "invalid-transition"
  /** Aceptarlo comprometería más unidades de las que quedan. */
  | "insufficient-stock";

/**
 * Mueve un pedido por su proceso: aceptar, preparar, entregar o cancelar.
 *
 * **Quién puede es cosa de la sesión, no del formulario.** El `sellerId` llega desde fuera ya
 * resuelto y viaja hasta el `WHERE` de la escritura, así que mandar el id de un pedido ajeno no
 * cambia nada: no hay fila que encaje.
 *
 * Qué transición vale lo decide el dominio (`canTransition`) y no un `CHECK` en la base: son reglas
 * de negocio que van a cambiar —el día del pago en línea, `PAID` se mete en medio— y que necesitan
 * dar un motivo entendible en vez de una violación de constraint.
 *
 * **Aceptar mueve el inventario**, y por eso este caso de uso creció. La regla de qué paso descuenta
 * y cuál devuelve vive en `stockEffectOf`; aquí sólo se pregunta y se pasa el resultado a la
 * escritura, que lo aplica en la misma transacción que el cambio de estado.
 *
 * La comprobación previa de existencias es para **explicarlo**, no para garantizarlo: entre leer y
 * escribir cabe otro pedido, así que la garantía de verdad la pone el `WHERE` del `UPDATE`. Sin la
 * comprobación previa, quedarse corto se vería como «no se pudo, no sabemos por qué».
 */
export default class AdvanceOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute({
    orderId,
    sellerId,
    status,
    changedBy,
  }: AdvanceOrderInput): Promise<AdvanceOrderResult> {
    const current = await this.orders.findHeader(orderId);

    /* Un pedido de otra tienda se responde igual que uno que no existe: quien lo intenta no debe
       poder averiguar si el id es bueno. */
    if (!current || current.sellerId !== sellerId)
      return { error: "not-found" };

    if (!canTransition(current.status, status)) {
      return { error: "invalid-transition" };
    }

    const stockEffect = stockEffectOf(current.status, status);

    if (stockEffect === "reserve" && (await this.isShort(orderId))) {
      return { error: "insufficient-stock" };
    }

    const applied = await this.orders.updateStatus({
      orderId,
      sellerId,
      fromStatus: current.status,
      status,
      changedBy,
      stockEffect,
    });

    /* Sin fila devuelta, alguien lo movió entre la lectura y la escritura —o se llevó las últimas
       unidades—. No se reintenta: la decisión se tomó mirando un estado que ya no era el actual, así
       que lo honesto es que la pantalla se recargue y el vendedor vuelva a decidir. */
    return applied ? { status: applied } : { error: "not-found" };
  }

  private async isShort(orderId: string): Promise<boolean> {
    const demands = await this.orders.stockDemandOf(orderId);

    const available: AvailableStock = {};
    for (const demand of demands) {
      if (demand.postId) available[demand.postId] = demand.stockQuantity;
    }

    return shortfalls(demands, available).length > 0;
  }
}
