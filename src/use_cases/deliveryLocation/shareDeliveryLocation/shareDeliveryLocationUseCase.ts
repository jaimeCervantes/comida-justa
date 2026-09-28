import { areValidCoordinates } from "~/domain/entities/seller/coordinates";
import type { OrderRepository } from "~/domain/order/ports";

export interface ShareDeliveryLocationInput {
  orderId: string;
  buyerId: string;
  lat: number;
  lng: number;
}

export type ShareDeliveryLocationResult =
  | { saved: true }
  | { error: ShareDeliveryLocationError };

export type ShareDeliveryLocationError =
  /** Lo que mandó el navegador no es una coordenada real. */
  | "invalid-coordinates"
  /**
   * No existe, no es de quien lo pide, o ya se entregó o canceló. Se ven igual desde fuera a
   * propósito, mismo criterio que la ficha: responder «existe pero no es tuyo» ya es contar algo.
   */
  | "not-found";

/**
 * Guarda o reemplaza a dónde se entrega un pedido, desde su ficha.
 *
 * Quién puede lo decide el `WHERE` de `saveDeliveryLocation` —comprador y pedido abierto—, no una
 * lectura previa aquí: el mismo diseño que `ShareCourierLocationUseCase`.
 */
export default class ShareDeliveryLocationUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute({
    orderId,
    buyerId,
    lat,
    lng,
  }: ShareDeliveryLocationInput): Promise<ShareDeliveryLocationResult> {
    if (!areValidCoordinates({ latitude: lat, longitude: lng })) {
      return { error: "invalid-coordinates" };
    }

    const saved = await this.orders.saveDeliveryLocation({
      orderId,
      buyerId,
      lat,
      lng,
    });

    return saved ? { saved: true } : { error: "not-found" };
  }
}
