import { canTransition, type OrderStatus } from "~/domain/order/order";
import type { OrderRepository } from "~/domain/order/ports";

export interface AdvanceOrderInput {
  orderId: string;
  /** El de la tienda de quien pide el cambio. Sale de la sesión, **nunca** del formulario. */
  sellerId: string;
  status: OrderStatus;
}

export type AdvanceOrderResult =
  | { status: OrderStatus }
  | { error: AdvanceOrderError };

export type AdvanceOrderError =
  /** No existe, no es de esa tienda, o se movió mientras tanto. Los tres se ven igual desde fuera. */
  | "not-found"
  /** Existe y es suyo, pero de donde está no se puede ir a donde pide. */
  | "invalid-transition";

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
 */
export default class AdvanceOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute({
    orderId,
    sellerId,
    status,
  }: AdvanceOrderInput): Promise<AdvanceOrderResult> {
    const current = await this.orders.findHeader(orderId);

    /* Un pedido de otra tienda se responde igual que uno que no existe: quien lo intenta no debe
       poder averiguar si el id es bueno. */
    if (!current || current.sellerId !== sellerId)
      return { error: "not-found" };

    if (!canTransition(current.status, status)) {
      return { error: "invalid-transition" };
    }

    const applied = await this.orders.updateStatus({
      orderId,
      sellerId,
      fromStatus: current.status,
      status,
    });

    /* Sin fila devuelta, alguien lo movió entre la lectura y la escritura. No se reintenta: la
       decisión se tomó mirando un estado que ya no era el actual, así que lo honesto es que la
       pantalla se recargue y el vendedor vuelva a decidir. */
    return applied ? { status: applied } : { error: "not-found" };
  }
}
