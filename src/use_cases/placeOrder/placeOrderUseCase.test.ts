import { describe, expect, it, vi } from "vitest";
import type { CartProduct } from "~/domain/cart/cart";
import type { CartProductRepository } from "~/domain/cart/ports";
import type { Order } from "~/domain/order/order";
import type { NewOrder, OrderRepository } from "~/domain/order/ports";
import PlaceOrderUseCase from "./placeOrderUseCase";

const hazloSano = {
  id: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
  name: "Hazlo Sano",
  handle: "hazlo-sano",
  phone: "2781126948",
};

const panaderia = {
  id: "8f2c1d4e-0000-4000-8000-000000000002",
  name: "Panadería La Luz",
  handle: "panaderia-la-luz",
  phone: "2789990011",
};

const jugoVerde: CartProduct = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  slug: "jugo-verde",
  price: 40,
  isAvailable: true,
  seller: hazloSano,
};

const sueroNatural: CartProduct = {
  postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77",
  title: "Suero natural",
  slug: "suero-natural",
  price: 35,
  isAvailable: true,
  seller: hazloSano,
};

const panDeCampo: CartProduct = {
  postId: "8f2c1d4e-0000-4000-8000-000000000010",
  title: "Pan de campo",
  slug: "pan-de-campo",
  price: 60,
  isAvailable: true,
  seller: panaderia,
};

const CHECKOUT_ID = "11111111-2222-3333-4444-555555555555";
const BUYER = "user-jaime";

function build(products: CartProduct[]) {
  const created: NewOrder[] = [];
  const orders: OrderRepository = {
    createAll: vi.fn(async (input: readonly NewOrder[]) => {
      created.push(...input);

      return input.map(
        (order, index): Order => ({
          ...order,
          id: `order-${index}`,
          status: "PENDING",
          createdAt: new Date("2026-08-09T12:00:00Z"),
        }),
      );
    }),
    listBySeller: vi.fn(),
    listByBuyer: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
  };
  const cart: CartProductRepository = {
    findByIds: vi.fn().mockResolvedValue(products),
  };

  return {
    useCase: new PlaceOrderUseCase(cart, orders, () => CHECKOUT_ID),
    created,
    orders,
    cart,
  };
}

const baseInput = {
  buyerId: BUYER,
  locale: "es",
  fallbackLocale: "es",
  sellerId: hazloSano.id,
};

describe("PlaceOrderUseCase", () => {
  it("crea un pedido con el precio del momento copiado en cada renglón", async () => {
    const { useCase, created } = build([jugoVerde, sueroNatural]);

    const result = await useCase.execute({
      ...baseInput,
      selection: [
        { postId: jugoVerde.postId, quantity: 2 },
        { postId: sueroNatural.postId, quantity: 1 },
      ],
    });

    expect("order" in result).toBe(true);
    expect(created).toHaveLength(1);
    expect(created[0].sellerId).toBe(hazloSano.id);
    expect(created[0].buyerId).toBe(BUYER);
    expect(created[0].checkoutId).toBe(CHECKOUT_ID);
    expect(created[0].lines).toEqual([
      {
        postId: jugoVerde.postId,
        title: "Jugo Verde",
        unitPrice: 40,
        quantity: 2,
      },
      {
        postId: sueroNatural.postId,
        title: "Suero natural",
        unitPrice: 35,
        quantity: 1,
      },
    ]);
  });

  it("nace pendiente, que es lo que el vendedor todavía no ha visto", async () => {
    const { useCase } = build([jugoVerde]);

    const result = await useCase.execute({
      ...baseInput,
      selection: [{ postId: jugoVerde.postId, quantity: 1 }],
    });

    expect("order" in result && result.order.status).toBe("PENDING");
  });

  /* El precio NO se toma de lo que mande la pantalla: se relee. Un formulario armado a mano podría
     decir que el Jugo Verde cuesta 1. */
  it("usa el precio de la base y no el que traiga quien llama", async () => {
    const { useCase, created } = build([{ ...jugoVerde, price: 40 }]);

    await useCase.execute({
      ...baseInput,
      selection: [{ postId: jugoVerde.postId, quantity: 1 }],
    });

    expect(created[0].lines[0].unitPrice).toBe(40);
  });

  it("deja fuera lo que se agotó, y lo dice para poder vaciar solo lo pedido", async () => {
    const { useCase, created } = build([
      jugoVerde,
      { ...sueroNatural, isAvailable: false },
    ]);

    const result = await useCase.execute({
      ...baseInput,
      selection: [
        { postId: jugoVerde.postId, quantity: 1 },
        { postId: sueroNatural.postId, quantity: 1 },
      ],
    });

    expect(created[0].lines).toHaveLength(1);
    expect(created[0].lines[0].title).toBe("Jugo Verde");
    // Lo agotado se queda en el carrito: nadie lo pidió.
    expect("orderedPostIds" in result && result.orderedPostIds).toEqual([
      jugoVerde.postId,
    ]);
  });

  it("no crea un pedido vacío cuando no queda nada disponible", async () => {
    const { useCase, orders } = build([{ ...jugoVerde, isAvailable: false }]);

    const result = await useCase.execute({
      ...baseInput,
      selection: [{ postId: jugoVerde.postId, quantity: 1 }],
    });

    expect(result).toEqual({ error: "nothing-available" });
    expect(orders.createAll).not.toHaveBeenCalled();
  });

  /* Confirmar una tienda no puede llevarse lo de la otra: cada una acepta y entrega por su cuenta. */
  it("con dos tiendas en el carrito solo pide la que se confirma", async () => {
    const { useCase, created } = build([jugoVerde, panDeCampo]);

    const result = await useCase.execute({
      ...baseInput,
      selection: [
        { postId: jugoVerde.postId, quantity: 1 },
        { postId: panDeCampo.postId, quantity: 2 },
      ],
    });

    expect(created).toHaveLength(1);
    expect(created[0].sellerId).toBe(hazloSano.id);
    expect(created[0].lines).toHaveLength(1);
    expect("orderedPostIds" in result && result.orderedPostIds).toEqual([
      jugoVerde.postId,
    ]);
  });

  it("una tienda que no está en el carrito no crea nada", async () => {
    const { useCase, orders } = build([jugoVerde]);

    const result = await useCase.execute({
      ...baseInput,
      sellerId: panaderia.id,
      selection: [{ postId: jugoVerde.postId, quantity: 1 }],
    });

    expect(result).toEqual({ error: "empty-for-seller" });
    expect(orders.createAll).not.toHaveBeenCalled();
  });

  it("con el carrito vacío no consulta ni crea nada", async () => {
    const { useCase, orders, cart } = build([]);

    const result = await useCase.execute({ ...baseInput, selection: [] });

    expect(result).toEqual({ error: "empty-for-seller" });
    expect(cart.findByIds).not.toHaveBeenCalled();
    expect(orders.createAll).not.toHaveBeenCalled();
  });
});
