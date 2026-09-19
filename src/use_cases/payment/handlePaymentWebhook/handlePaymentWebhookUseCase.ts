import { canMarkPaid } from "~/domain/order/order";
import { stockEffectOf } from "~/domain/order/orderStock";
import type { OrderRepository } from "~/domain/order/ports";
import type IPaymentGateway from "~/use_cases/payment/ports/IPaymentGateway";

export interface HandlePaymentWebhookInput {
  /** El cuerpo crudo de la petición, sin parsear: la firma se calculó sobre esos bytes exactos. */
  payload: string;
  signature: string;
}

export type HandlePaymentWebhookResult =
  /** El evento no traía un pedido que marcar (otro tipo de evento, o sin metadatos todavía). */
  | { status: "ignored" }
  | { status: "paid"; orderId: string }
  | { error: HandlePaymentWebhookError };

export type HandlePaymentWebhookError =
  /** No existe, o no es del vendedor que el evento dice. Los dos se ven igual desde fuera. */
  | "not-found"
  /** Existe y es suyo, pero no está en el único estado desde el que se puede cobrar. */
  | "invalid-transition";

/**
 * Marca un pedido como pagado a partir de un evento ya verificado de la pasarela.
 *
 * Sigue el mismo diseño que `AdvanceOrderUseCase`: quien puede es cosa del `WHERE` de
 * `updateStatus`, no de un `if` previo, y `changedBy: null` porque aquí no hay una persona detrás
 * —lo dice el propio comentario de esa columna, pensado justo para este día.
 *
 * La verificación de firma vive en el adapter (`IPaymentGateway`), no aquí: este caso de uso nunca
 * ve el secreto del webhook, solo el evento ya de fiar.
 */
export default class HandlePaymentWebhookUseCase {
  constructor(
    private readonly gateway: IPaymentGateway,
    private readonly orders: OrderRepository,
  ) {}

  async execute({
    payload,
    signature,
  }: HandlePaymentWebhookInput): Promise<HandlePaymentWebhookResult> {
    const event = this.gateway.constructWebhookEvent(payload, signature);

    if (!event.orderId || !event.sellerId) return { status: "ignored" };

    const current = await this.orders.findHeader(event.orderId);

    /* Un pedido de otro vendedor se responde igual que uno que no existe: el evento no debería
       poder confirmar de quién es un id ajeno. */
    if (!current || current.sellerId !== event.sellerId) {
      return { error: "not-found" };
    }

    if (!canMarkPaid(current.status)) return { error: "invalid-transition" };

    const applied = await this.orders.updateStatus({
      orderId: event.orderId,
      sellerId: event.sellerId,
      fromStatus: current.status,
      status: "PAID",
      changedBy: null,
      stockEffect: stockEffectOf(current.status, "PAID"),
    });

    /* Sin fila devuelta, el pedido se movió entre la lectura y la escritura. No se reintenta: la
       pasarela reintentará ella sola el webhook si hace falta. */
    return applied
      ? { status: "paid", orderId: event.orderId }
      : { error: "not-found" };
  }
}
