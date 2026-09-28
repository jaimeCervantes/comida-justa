import { describe, expect, it, vi } from "vitest";
import type { OrderRepository } from "~/domain/order/ports";
import ShareDeliveryLocationUseCase from "./shareDeliveryLocationUseCase";

const ORDER_ID = "order-1";
const BUYER = "user-jaime";
/* Colonia Obispado, Monterrey. */
const DESTINO = { lat: 25.6766, lng: -100.3303 };

function build(saved: boolean) {
  const orders: OrderRepository = {
    createAll: vi.fn(),
    listBySeller: vi.fn(),
    listByBuyer: vi.fn(),
    listAppointmentsByBuyer: vi.fn(),
    listAppointmentsBySeller: vi.fn(),
    listByCheckout: vi.fn(),
    countOpen: vi.fn(),
    findById: vi.fn(),
    historyOf: vi.fn(),
    findHeader: vi.fn(),
    stockDemandOf: vi.fn(),
    updateStatus: vi.fn(),
    getCourierTrackingToken: vi.fn(),
    findByCourierToken: vi.fn(),
    saveCourierLocation: vi.fn(),
    findDeliveryTracking: vi.fn(),
    saveDeliveryLocation: vi.fn().mockResolvedValue(saved),
  };

  return { useCase: new ShareDeliveryLocationUseCase(orders), orders };
}

describe("ShareDeliveryLocationUseCase", () => {
  it("guarda el destino del pedido a nombre de quien lo compró", async () => {
    const { useCase, orders } = build(true);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: BUYER,
      ...DESTINO,
    });

    expect(result).toEqual({ saved: true });
    expect(orders.saveDeliveryLocation).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      buyerId: BUYER,
      ...DESTINO,
    });
  });

  it("rechaza coordenadas que no valen, sin llegar a la escritura", async () => {
    const { useCase, orders } = build(true);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: BUYER,
      lat: 0,
      lng: 0,
    });

    expect(result).toEqual({ error: "invalid-coordinates" });
    expect(orders.saveDeliveryLocation).not.toHaveBeenCalled();
  });

  /* No existe, no es suyo o ya se cerró: el repositorio no distingue, y el caso de uso tampoco. */
  it("un pedido en el que no se escribe nada se ve como no encontrado", async () => {
    const { useCase } = build(false);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      buyerId: "otra-persona",
      ...DESTINO,
    });

    expect(result).toEqual({ error: "not-found" });
  });
});
