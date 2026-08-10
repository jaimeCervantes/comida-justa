import { describe, expect, it, vi } from "vitest";
import type { CartProduct } from "~/domain/cart/cart";
import type { CartProductRepository } from "~/domain/cart/ports";
import ViewCartUseCase from "./viewCartUseCase";

const jugoVerde: CartProduct = {
  postId: "f5258215-a56c-4c86-813e-89177f2860d2",
  title: "Jugo Verde",
  slug: "jugo-verde",
  price: 40,
  isAvailable: true,
  seller: {
    id: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
    name: "Hazlo Sano",
    handle: "hazlo-sano",
    phone: "2781126948",
  },
};

function repositoryReturning(products: CartProduct[]): CartProductRepository {
  return { findByIds: vi.fn().mockResolvedValue(products) };
}

describe("ViewCartUseCase", () => {
  it("devuelve un grupo por tienda con su subtotal", async () => {
    const useCase = new ViewCartUseCase(repositoryReturning([jugoVerde]));

    const groups = await useCase.execute({
      selection: [{ postId: jugoVerde.postId, quantity: 2 }],
      locale: "es",
      fallbackLocale: "es",
    });

    expect(groups).toHaveLength(1);
    expect(groups[0].subtotal).toBe(80);
  });

  it("no consulta la base con el carrito vacío", async () => {
    const repository = repositoryReturning([]);
    const useCase = new ViewCartUseCase(repository);

    expect(
      await useCase.execute({
        selection: [],
        locale: "es",
        fallbackLocale: "es",
      }),
    ).toEqual([]);
    expect(repository.findByIds).not.toHaveBeenCalled();
  });

  it("pide una sola vez todos los ids del carrito", async () => {
    const repository = repositoryReturning([jugoVerde]);
    const useCase = new ViewCartUseCase(repository);

    await useCase.execute({
      selection: [
        { postId: jugoVerde.postId, quantity: 1 },
        { postId: "4e256323-9965-5f82-a8d6-6fc2849e9c77", quantity: 1 },
      ],
      locale: "en",
      fallbackLocale: "es",
    });

    expect(repository.findByIds).toHaveBeenCalledTimes(1);
    expect(repository.findByIds).toHaveBeenCalledWith(
      [jugoVerde.postId, "4e256323-9965-5f82-a8d6-6fc2849e9c77"],
      "en",
      "es",
    );
  });
});
