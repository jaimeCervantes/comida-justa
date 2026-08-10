import { describe, expect, it, vi } from "vitest";
import type { OrderStatus } from "~/domain/order/order";
import type { OrderRepository, OrderWithSeller } from "~/domain/order/ports";
import AdvanceOrderUseCase from "./advanceOrderUseCase";

const SELLER = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";
const OTHER_SELLER = "8f2c1d4e-0000-4000-8000-000000000002";
const ORDER_ID = "order-1";

function orderInStatus(
  status: OrderStatus,
  sellerId = SELLER,
): OrderWithSeller {
  return {
    id: ORDER_ID,
    checkoutId: "11111111-2222-3333-4444-555555555555",
    sellerId,
    buyerId: "user-jaime",
    status,
    lines: [
      {
        postId: "f5258215-a56c-4c86-813e-89177f2860d2",
        title: "Jugo Verde",
        unitPrice: 40,
        quantity: 2,
        slug: "jugo-verde",
        imageUrl: null,
      },
    ],
    createdAt: new Date("2026-08-09T12:00:00Z"),
    sellerName: "Hazlo Sano",
    sellerHandle: "hazlo-sano",
    sellerPhone: "2781126948",
  };
}

function build(current: OrderWithSeller | null, applied?: OrderStatus | null) {
  const orders: OrderRepository = {
    createAll: vi.fn(),
    listBySeller: vi.fn(),
    listByBuyer: vi.fn(),
    countOpen: vi.fn(),
    findById: vi.fn(),
    /* El caso de uso solo pregunta de quién es y en qué estado está: no pinta nada, así que no pide
       `findById` ni sus renglones. */
    findHeader: vi
      .fn()
      .mockResolvedValue(
        current ? { sellerId: current.sellerId, status: current.status } : null,
      ),
    updateStatus: vi
      .fn()
      .mockResolvedValue(
        applied === undefined ? (current?.status ?? null) : applied,
      ),
  };

  return { useCase: new AdvanceOrderUseCase(orders), orders };
}

describe("AdvanceOrderUseCase", () => {
  it("acepta un pedido pendiente", async () => {
    const { useCase, orders } = build(orderInStatus("PENDING"), "CONFIRMED");

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect("status" in result && result.status).toBe("CONFIRMED");
    // El estado de partida viaja al `WHERE`: la transición es atómica.
    expect(orders.updateStatus).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      sellerId: SELLER,
      fromStatus: "PENDING",
      status: "CONFIRMED",
    });
  });

  it("rechaza saltarse la aceptación", async () => {
    const { useCase, orders } = build(orderInStatus("PENDING"));

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "DELIVERED",
    });

    expect(result).toEqual({ error: "invalid-transition" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("no deshace lo entregado", async () => {
    const { useCase, orders } = build(orderInStatus("DELIVERED"));

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CANCELLED",
    });

    expect(result).toEqual({ error: "invalid-transition" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  /* Un pedido de otra tienda se responde como uno que no existe: quien lo intenta no debe poder
     averiguar si el id es bueno. */
  it("el pedido de otra tienda se ve como inexistente", async () => {
    const { useCase, orders } = build(orderInStatus("PENDING", OTHER_SELLER));

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(result).toEqual({ error: "not-found" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("un id que no existe tampoco escribe", async () => {
    const { useCase, orders } = build(null);

    const result = await useCase.execute({
      orderId: "no-existe",
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(result).toEqual({ error: "not-found" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  /* Dos pestañas abiertas: la segunda decidió mirando un estado que ya había cambiado. La escritura
     condicionada no encuentra fila y no se reintenta. */
  it("si se movió entre la lectura y la escritura, no lo fuerza", async () => {
    const { useCase } = build(orderInStatus("PENDING"), null);

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(result).toEqual({ error: "not-found" });
  });

  it.each([
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "PREPARING"],
    ["PREPARING", "DELIVERED"],
    ["PREPARING", "CANCELLED"],
  ] as Array<[OrderStatus, OrderStatus]>)(
    "deja pasar de %s a %s",
    async (from, to) => {
      const { useCase } = build(orderInStatus(from), to);

      const result = await useCase.execute({
        orderId: ORDER_ID,
        sellerId: SELLER,
        status: to,
      });

      expect("status" in result).toBe(true);
    },
  );
});
