import { describe, expect, it, vi } from "vitest";
import type { OrderRepository } from "~/domain/order/ports";
import ShareCourierLocationUseCase from "./shareCourierLocationUseCase";

const ORDER_ID = "order-1";
const TOKEN = "a-real-token";

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
    saveCourierLocation: vi.fn().mockResolvedValue(saved),
    findDeliveryTracking: vi.fn(),
    saveDeliveryLocation: vi.fn(),
  };

  return { useCase: new ShareCourierLocationUseCase(orders), orders };
}

describe("ShareCourierLocationUseCase", () => {
  it("guarda una coordenada real", async () => {
    const { useCase, orders } = build(true);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      token: TOKEN,
      lat: 25.6866,
      lng: -100.3161,
    });

    expect(result).toEqual({ saved: true });
    expect(orders.saveCourierLocation).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      token: TOKEN,
      lat: 25.6866,
      lng: -100.3161,
    });
  });

  /* 0,0 es el Golfo de Guinea: en la práctica significa "no se pudo leer nada", igual que en
     `areValidCoordinates`. No se escribe eso como si fuera una posición real. */
  it("rechaza coordenadas que no valen, sin llegar a la escritura", async () => {
    const { useCase, orders } = build(true);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      token: TOKEN,
      lat: 0,
      lng: 0,
    });

    expect(result).toEqual({ error: "invalid-coordinates" });
    expect(orders.saveCourierLocation).not.toHaveBeenCalled();
  });

  /* El token no coincide, el pedido no existe, o ya no está SHIPPED — el repositorio ya no
     distingue, y el caso de uso tampoco inventa una razón. */
  it("un token que no escribe nada se ve como token inválido", async () => {
    const { useCase } = build(false);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      token: "otro-token",
      lat: 25.6866,
      lng: -100.3161,
    });

    expect(result).toEqual({ error: "invalid-token" });
  });
});
