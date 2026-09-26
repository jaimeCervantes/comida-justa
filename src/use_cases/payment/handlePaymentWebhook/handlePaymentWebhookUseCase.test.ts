import { describe, expect, it, vi } from "vitest";
import type { OrderStatus } from "~/domain/order/order";
import type { OrderRepository } from "~/domain/order/ports";
import type IPaymentGateway from "~/use_cases/payment/ports/IPaymentGateway";
import type { PaymentWebhookEvent } from "~/use_cases/payment/ports/IPaymentGateway";
import HandlePaymentWebhookUseCase from "./handlePaymentWebhookUseCase";

const SELLER = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";
const OTHER_SELLER = "8f2c1d4e-0000-4000-8000-000000000002";
const ORDER_ID = "order-1";
const PAYLOAD = '{"type":"checkout.session.completed"}';
const SIGNATURE = "t=1,v1=firma-de-prueba";

function gatewayReturning(event: PaymentWebhookEvent): IPaymentGateway {
  return { constructWebhookEvent: vi.fn().mockReturnValue(event) };
}

function build(
  current: { sellerId: string; status: OrderStatus } | null,
  applied?: OrderStatus | null,
) {
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
    findHeader: vi.fn().mockResolvedValue(current),
    stockDemandOf: vi.fn(),
    updateStatus: vi
      .fn()
      .mockResolvedValue(
        applied === undefined ? (current?.status ?? null) : applied,
      ),
    getCourierTrackingToken: vi.fn(),
    findByCourierToken: vi.fn(),
    saveCourierLocation: vi.fn(),
  };

  return orders;
}

describe("HandlePaymentWebhookUseCase", () => {
  it("marca pagado un pedido confirmado cuando el evento trae pedido y vendedor", async () => {
    const orders = build({ sellerId: SELLER, status: "CONFIRMED" }, "PAID");
    const gateway = gatewayReturning({
      type: "checkout.session.completed",
      orderId: ORDER_ID,
      sellerId: SELLER,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ status: "paid", orderId: ORDER_ID });
    // El estado de partida viaja al WHERE, igual que en AdvanceOrderUseCase: la transición es atómica.
    expect(orders.updateStatus).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      sellerId: SELLER,
      fromStatus: "CONFIRMED",
      status: "PAID",
      // Nadie detrás de este cambio: lo dispara la pasarela, no una persona.
      changedBy: null,
      // Ya se reservó al aceptar (CONFIRMED); cobrar no vuelve a descontar.
      stockEffect: "none",
    });
  });

  it("un evento sin pedido ni vendedor se ignora sin tocar nada", async () => {
    const orders = build(null);
    const gateway = gatewayReturning({
      type: "account.updated",
      orderId: null,
      sellerId: null,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ status: "ignored" });
    expect(orders.findHeader).not.toHaveBeenCalled();
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("un pedido que no existe no escribe nada", async () => {
    const orders = build(null);
    const gateway = gatewayReturning({
      type: "checkout.session.completed",
      orderId: "no-existe",
      sellerId: SELLER,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ error: "not-found" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  /* Un pedido de otro vendedor se responde como uno que no existe: el evento no debe poder
     confirmar de quién es un id ajeno. */
  it("un pedido de otro vendedor se ve como inexistente", async () => {
    const orders = build({ sellerId: OTHER_SELLER, status: "CONFIRMED" });
    const gateway = gatewayReturning({
      type: "checkout.session.completed",
      orderId: ORDER_ID,
      sellerId: SELLER,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ error: "not-found" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it.each([
    "PENDING",
    "PAID",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ] as OrderStatus[])("un pedido en %s no se puede cobrar", async (status) => {
    const orders = build({ sellerId: SELLER, status });
    const gateway = gatewayReturning({
      type: "checkout.session.completed",
      orderId: ORDER_ID,
      sellerId: SELLER,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ error: "invalid-transition" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  /* Firmas inválidas: el adapter las convierte en un error que se propaga tal cual, no en un
     resultado del caso de uso — es un fallo de infraestructura, no una regla de negocio. */
  it("un evento con firma inválida se propaga y no se disfraza de resultado", async () => {
    const orders = build(null);
    const gateway: IPaymentGateway = {
      constructWebhookEvent: vi.fn().mockImplementation(() => {
        throw new Error("firma inválida");
      }),
    };

    await expect(
      new HandlePaymentWebhookUseCase(gateway, orders).execute({
        payload: PAYLOAD,
        signature: SIGNATURE,
      }),
    ).rejects.toThrow("firma inválida");
    expect(orders.findHeader).not.toHaveBeenCalled();
  });

  /* Dos webhooks del mismo evento —la pasarela reintenta— o una carrera con otra escritura: sin
     fila que tocar, no se fuerza ni se reintenta aquí. */
  it("si el pedido se movió entre la lectura y la escritura, no lo fuerza", async () => {
    const orders = build({ sellerId: SELLER, status: "CONFIRMED" }, null);
    const gateway = gatewayReturning({
      type: "checkout.session.completed",
      orderId: ORDER_ID,
      sellerId: SELLER,
    });

    const result = await new HandlePaymentWebhookUseCase(
      gateway,
      orders,
    ).execute({ payload: PAYLOAD, signature: SIGNATURE });

    expect(result).toEqual({ error: "not-found" });
  });
});
