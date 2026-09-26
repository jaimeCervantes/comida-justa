import { areValidCoordinates } from "~/domain/entities/seller/coordinates";
import type { OrderRepository } from "~/domain/order/ports";

export interface ShareCourierLocationInput {
  orderId: string;
  token: string;
  lat: number;
  lng: number;
}

export type ShareCourierLocationResult =
  | { saved: true }
  | { error: ShareCourierLocationError };

export type ShareCourierLocationError =
  /** Lo que mandó el navegador no es una coordenada real. */
  | "invalid-coordinates"
  /**
   * El token no coincide, el pedido no existe, o ya no está `SHIPPED`. Los tres se ven igual desde
   * fuera a propósito: un enlace que circuló de más no debe poder distinguir "ya se entregó" de
   * "nunca fue válido".
   */
  | "invalid-token";

/**
 * Guarda dónde está el repartidor, a partir de un enlace sin sesión.
 *
 * **Quién puede es cosa del `WHERE` de `saveCourierLocation`, no de una lectura previa aquí.** Es
 * el mismo diseño que `AdvanceOrderUseCase` y `HandlePaymentWebhookUseCase`: comprobar y escribir
 * son dos pasos, y entre ellos el pedido puede haberse entregado o cancelado.
 */
export default class ShareCourierLocationUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute({
    orderId,
    token,
    lat,
    lng,
  }: ShareCourierLocationInput): Promise<ShareCourierLocationResult> {
    if (!areValidCoordinates({ latitude: lat, longitude: lng })) {
      return { error: "invalid-coordinates" };
    }

    const saved = await this.orders.saveCourierLocation({
      orderId,
      token,
      lat,
      lng,
    });

    return saved ? { saved: true } : { error: "invalid-token" };
  }
}
