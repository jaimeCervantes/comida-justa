import { shouldRequestRoute } from "~/domain/order/delivery";
import type { OrderRepository } from "~/domain/order/ports";
import type { RouteProvider } from "~/domain/routing/ports";
import type { Route } from "~/domain/routing/route";

export interface RouteToDestinationInput {
  orderId: string;
  buyerId: string;
  now: Date;
}

/**
 * El camino por calles que le falta al repartidor de un pedido, para quien lo compró.
 *
 * **No se guarda en ningún lado**: los términos del servicio de rutas (Mapbox, cláusula 2.10.1)
 * prohíben guardar o cachear el resultado, así que cada llamada consulta de nuevo. Por eso el
 * límite de frecuencia lo pone quien llama —la ficha, una vez por minuto— y aquí solo se decide si
 * vale la pena gastar la consulta (`shouldRequestRoute`).
 *
 * `null` cuando no hay camino que dar, por la razón que sea: pedido ajeno o inexistente, sin destino,
 * posición vieja, o el servicio no contestó. La pantalla hace lo mismo con todas: se queda como
 * estaba.
 */
export default class RouteToDestinationUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly routes: RouteProvider,
  ) {}

  async execute({
    orderId,
    buyerId,
    now,
  }: RouteToDestinationInput): Promise<Route | null> {
    const tracking = await this.orders.findDeliveryTracking(orderId, buyerId);

    if (!tracking || !shouldRequestRoute(tracking, now)) return null;

    const { courierLocation, deliveryLocation } = tracking;

    /* `shouldRequestRoute` ya garantizó las dos; el tipo no lo sabe. */
    if (!courierLocation || !deliveryLocation) return null;

    return this.routes.routeBetween(
      { lat: courierLocation.lat, lng: courierLocation.lng },
      { lat: deliveryLocation.lat, lng: deliveryLocation.lng },
    );
  }
}
