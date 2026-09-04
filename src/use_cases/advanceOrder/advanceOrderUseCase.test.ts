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
    updatedAt: new Date("2026-08-09T12:00:00Z"),
    sellerName: "Hazlo Sano",
    sellerHandle: "hazlo-sano",
    sellerPhone: "2781126948",
  };
}

/** Lo que el pedido pide de cada publicación, con lo que queda hoy. */
type Demand = {
  postId: string | null;
  title: string;
  quantity: number;
  stockQuantity: number | null;
};

/** Por omisión, un renglón que NO lleva inventario: es lo que son las 418 publicaciones de hoy. */
const SIN_INVENTARIO: Demand[] = [
  {
    postId: "f5258215-a56c-4c86-813e-89177f2860d2",
    title: "Jugo Verde",
    quantity: 2,
    stockQuantity: null,
  },
];

function build(
  current: OrderWithSeller | null,
  applied?: OrderStatus | null,
  demands: Demand[] = SIN_INVENTARIO,
) {
  const orders: OrderRepository = {
    createAll: vi.fn(),
    listBySeller: vi.fn(),
    listByBuyer: vi.fn(),
    listByCheckout: vi.fn(),
    countOpen: vi.fn(),
    findById: vi.fn(),
    historyOf: vi.fn(),
    /* El caso de uso solo pregunta de quién es y en qué estado está: no pinta nada, así que no pide
       `findById` ni sus renglones. */
    findHeader: vi
      .fn()
      .mockResolvedValue(
        current ? { sellerId: current.sellerId, status: current.status } : null,
      ),
    stockDemandOf: vi.fn().mockResolvedValue(demands),
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
      changedBy: undefined,
      // Aceptar es lo que compromete mercancía, y viaja con la escritura.
      stockEffect: "reserve",
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

describe("AdvanceOrderUseCase — el inventario", () => {
  const DONA = "176a9519-6aab-4998-856b-86198f90d96a";

  /** Un renglón de 2 "Dona Chocolate Keto" sobre un producto que sí lleva la cuenta. */
  const conInventario = (stockQuantity: number | null): Demand[] => [
    {
      postId: DONA,
      title: "Dona Chocolate Keto",
      quantity: 2,
      stockQuantity,
    },
  ];

  it("aceptar descuenta lo que lleva", async () => {
    const { useCase, orders } = build(
      orderInStatus("PENDING"),
      "CONFIRMED",
      conInventario(12),
    );

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect("status" in result && result.status).toBe("CONFIRMED");
    expect(orders.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({ stockEffect: "reserve" }),
    );
  });

  it("no se acepta lo que no se puede servir, y no se escribe nada", async () => {
    const { useCase, orders } = build(
      orderInStatus("PENDING"),
      "CONFIRMED",
      conInventario(1),
    );

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(result).toEqual({ error: "insufficient-stock" });
    expect(orders.updateStatus).not.toHaveBeenCalled();
  });

  it("con lo justo sí se acepta", async () => {
    const { useCase, orders } = build(
      orderInStatus("PENDING"),
      "CONFIRMED",
      conInventario(2),
    );

    await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(orders.updateStatus).toHaveBeenCalled();
  });

  /* La garantía de que esto no toca a las 418 publicaciones que no llevan la cuenta. */
  it("lo que no lleva inventario no bloquea nada", async () => {
    const { useCase, orders } = build(
      orderInStatus("PENDING"),
      "CONFIRMED",
      conInventario(null),
    );

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect("status" in result && result.status).toBe("CONFIRMED");
    expect(orders.updateStatus).toHaveBeenCalled();
  });

  it("cancelar un pedido ya aceptado devuelve lo suyo", async () => {
    const { useCase, orders } = build(
      orderInStatus("CONFIRMED"),
      "CANCELLED",
      conInventario(10),
    );

    await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CANCELLED",
    });

    expect(orders.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({ stockEffect: "release" }),
    );
  });

  it("cancelar uno que nunca se aceptó no devuelve nada", async () => {
    const { useCase, orders } = build(
      orderInStatus("PENDING"),
      "CANCELLED",
      conInventario(12),
    );

    await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CANCELLED",
    });

    expect(orders.updateStatus).toHaveBeenCalledWith(
      expect.objectContaining({ stockEffect: "none" }),
    );
  });

  /* Sólo aceptar consulta el inventario: preguntar por él para cancelar o entregar sería una
     consulta que se tira a la basura en el camino más recorrido de la pantalla. */
  it("no consulta el inventario cuando el paso no lo mueve", async () => {
    const { useCase, orders } = build(
      orderInStatus("CONFIRMED"),
      "PREPARING",
      conInventario(10),
    );

    await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "PREPARING",
    });

    expect(orders.stockDemandOf).not.toHaveBeenCalled();
  });

  /* Entre leer y escribir cabe otro pedido: la garantía la pone el `WHERE` del `UPDATE`, que deja la
     transacción sin fila que tocar, y eso se ve desde fuera como que el pedido se movió. */
  it("si alguien se lleva las últimas unidades entre medias, no se inventa un pedido aceptado", async () => {
    const { useCase } = build(
      orderInStatus("PENDING"),
      null,
      conInventario(12),
    );

    const result = await useCase.execute({
      orderId: ORDER_ID,
      sellerId: SELLER,
      status: "CONFIRMED",
    });

    expect(result).toEqual({ error: "not-found" });
  });
});
