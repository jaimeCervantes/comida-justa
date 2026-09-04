import { beforeEach, describe, expect, it } from "vitest";
import {
  anuncio,
  evento,
  FakePostAdminRepository,
  jugoVerde,
  OTHER_STORE,
  OWNER,
  SOMEONE_ELSE,
  STORE,
  servicio,
} from "./__fixtures__/postAdmin";
import SetPostStockUseCase from "./setPostStockUseCase";

describe("SetPostStockUseCase", () => {
  let repository: FakePostAdminRepository;
  let useCase: SetPostStockUseCase;

  beforeEach(() => {
    repository = new FakePostAdminRepository([
      jugoVerde,
      anuncio,
      evento,
      servicio,
    ]);
    useCase = new SetPostStockUseCase(repository);
  });

  it("guarda las existencias de un producto propio", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: OWNER,
      sellerId: null,
      quantity: "3",
    });

    expect(result.stockQuantity).toBe(3);
  });

  /* La regla que sostiene la entrega: `is_available` se deriva y viaja con el número, no se decide
     a mano. Si se separaran en dos escrituras podrían quedar en desacuerdo. */
  it("deriva la disponibilidad y la escribe junto al número", async () => {
    await useCase.execute({
      postId: jugoVerde.id,
      userId: OWNER,
      sellerId: null,
      quantity: "0",
    });

    expect(repository.stockUpdates).toEqual([
      { postId: jugoVerde.id, quantity: 0, isAvailable: false },
    ]);
  });

  it("reponer lo vuelve a ofrecer", async () => {
    await useCase.execute({
      postId: jugoVerde.id,
      userId: OWNER,
      sellerId: null,
      quantity: "12",
    });

    expect(repository.stockUpdates[0]).toMatchObject({
      quantity: 12,
      isAvailable: true,
    });
  });

  it("el dueño de la tienda administra lo que publicó otra persona", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: SOMEONE_ELSE,
      sellerId: STORE,
      quantity: "5",
    });

    expect(result.stockQuantity).toBe(5);
    expect(repository.stockUpdates).toHaveLength(1);
  });

  it("el dueño de otra tienda no", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: SOMEONE_ELSE,
      sellerId: OTHER_STORE,
      quantity: "5",
    });

    expect(result.error).toBe("not-allowed");
    expect(repository.stockUpdates).toHaveLength(0);
  });

  it("quien no es ni dueño ni tienda tampoco", async () => {
    const result = await useCase.execute({
      postId: jugoVerde.id,
      userId: SOMEONE_ELSE,
      sellerId: null,
      quantity: "5",
    });

    expect(result.error).toBe("not-allowed");
    expect(repository.stockUpdates).toHaveLength(0);
  });

  it.each([
    ["anuncio", anuncio],
    ["evento", evento],
    ["servicio", servicio],
  ])("no cuenta ejemplares de un %s", async (_kind, post) => {
    const result = await useCase.execute({
      postId: post.id,
      userId: OWNER,
      sellerId: null,
      quantity: "5",
    });

    expect(result.error).toBe("not-trackable");
    expect(repository.stockUpdates).toHaveLength(0);
  });

  it.each(["-1", "2.5", "abc", ""])(
    "rechaza %j sin escribir nada",
    async (quantity) => {
      const result = await useCase.execute({
        postId: jugoVerde.id,
        userId: OWNER,
        sellerId: null,
        quantity,
      });

      expect(result.error).toBe("invalid-stock");
      expect(repository.stockUpdates).toHaveLength(0);
    },
  );

  /* Una que no existe se responde igual que una ajena: contestar "no existe" convertiría el campo
     en una forma de averiguar qué ids son buenos. */
  it("la que no existe se ve igual que la ajena", async () => {
    const result = await useCase.execute({
      postId: "no-existe",
      userId: OWNER,
      sellerId: null,
      quantity: "5",
    });

    expect(result.error).toBe("not-allowed");
  });
});
