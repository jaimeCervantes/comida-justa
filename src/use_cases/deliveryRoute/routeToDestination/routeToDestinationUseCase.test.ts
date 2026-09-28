import { describe, expect, it, vi } from "vitest";
import type { OrderRepository } from "~/domain/order/ports";
import type { RouteProvider } from "~/domain/routing/ports";
import type { Route } from "~/domain/routing/route";
import RouteToDestinationUseCase from "./routeToDestinationUseCase";

const ORDER_ID = "order-1";
const BUYER = "user-jaime";
const NOW = new Date("2026-09-28T18:00:15Z");

/* Macroplaza → colonia Obispado, Monterrey. */
const courierLocation = {
  lat: 25.6699,
  lng: -100.3097,
  updatedAt: new Date("2026-09-28T18:00:00Z"),
};
const deliveryLocation = {
  lat: 25.6766,
  lng: -100.3303,
  updatedAt: new Date("2026-09-28T17:40:00Z"),
};
const ROUTE: Route = {
  distanceMeters: 2600,
  durationSeconds: 540,
  path: [
    { lat: 25.6699, lng: -100.3097 },
    { lat: 25.6766, lng: -100.3303 },
  ],
};

type Tracking = Awaited<ReturnType<OrderRepository["findDeliveryTracking"]>>;

function build(tracking: Tracking, route: Route | null = ROUTE) {
  const findDeliveryTracking = vi.fn().mockResolvedValue(tracking);
  const orders = { findDeliveryTracking } as unknown as OrderRepository;
  const routes: RouteProvider = {
    routeBetween: vi.fn().mockResolvedValue(route),
  };

  return {
    useCase: new RouteToDestinationUseCase(orders, routes),
    routes,
    findDeliveryTracking,
  };
}

describe("RouteToDestinationUseCase", () => {
  it("pide el camino del repartidor al destino y lo devuelve", async () => {
    const { useCase, routes } = build({
      status: "SHIPPED",
      courierLocation,
      deliveryLocation,
    });

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: BUYER,
      now: NOW,
    });

    expect(result).toEqual(ROUTE);
    expect(routes.routeBetween).toHaveBeenCalledWith(
      { lat: courierLocation.lat, lng: courierLocation.lng },
      { lat: deliveryLocation.lat, lng: deliveryLocation.lng },
    );
  });

  /* @slice-16 @component: la autorización es del servidor. El repositorio lleva al comprador en el
     WHERE, así que un pedido ajeno llega aquí como `null`. */
  it("con un pedido de otra persona, no consulta el servicio y no devuelve nada", async () => {
    const { useCase, routes, findDeliveryTracking } = build(null);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: "otra-persona",
      now: NOW,
    });

    expect(result).toBeNull();
    expect(findDeliveryTracking).toHaveBeenCalledWith(ORDER_ID, "otra-persona");
    expect(routes.routeBetween).not.toHaveBeenCalled();
  });

  it("con la posición vieja no gasta una consulta", async () => {
    const { useCase, routes } = build({
      status: "SHIPPED",
      courierLocation,
      deliveryLocation,
    });

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: BUYER,
      now: new Date("2026-09-28T18:05:00Z"),
    });

    expect(result).toBeNull();
    expect(routes.routeBetween).not.toHaveBeenCalled();
  });

  it("si el servicio no da camino, devuelve null sin fallar", async () => {
    const { useCase } = build(
      { status: "SHIPPED", courierLocation, deliveryLocation },
      null,
    );

    expect(
      await useCase.execute({ orderId: ORDER_ID, buyerId: BUYER, now: NOW }),
    ).toBeNull();
  });
});
