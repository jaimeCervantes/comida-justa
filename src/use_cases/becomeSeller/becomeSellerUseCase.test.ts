import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Seller } from "~/domain/entities/seller/types";
import BecomeSellerUseCase from "./becomeSellerUseCase";
import type ISellerRepository from "./ports/ISellerRepository";
import type { NewSeller } from "./ports/ISellerRepository";

const USER_ID = "44pZIIJ5w1vSYkDQ6gfb";

/** La única tienda que existe hoy en la base compartida. */
const hazloSano: Seller = {
  id: "05bea858-88d0-4ff3-a531-3d82a7ad6fcc",
  name: "Hazlo Sano",
  handle: "hazlo-sano",
  phone: "2781126948",
  description: null,
  logoUrl: null,
  url: "https://restaurante.hazlosano.com",
  userId: null,
};

class FakeSellerRepository implements ISellerRepository {
  readonly saved: NewSeller[] = [];

  constructor(private readonly existing: Seller[] = []) {}

  async findByUserId(userId: string): Promise<Seller | null> {
    return this.existing.find((seller) => seller.userId === userId) ?? null;
  }

  async findByHandle(handle: string): Promise<Seller | null> {
    return this.existing.find((seller) => seller.handle === handle) ?? null;
  }

  async findByPhone(phone: string): Promise<Seller | null> {
    return this.existing.find((seller) => seller.phone === phone) ?? null;
  }

  async save(seller: NewSeller): Promise<Seller> {
    this.saved.push(seller);

    return { ...seller, id: "new-seller-id" };
  }
}

describe("BecomeSellerUseCase", () => {
  let repository: FakeSellerRepository;
  let useCase: BecomeSellerUseCase;

  beforeEach(() => {
    repository = new FakeSellerRepository([hazloSano]);
    useCase = new BecomeSellerUseCase(repository);
  });

  it("abre la tienda y la deja en su dirección web", async () => {
    const result = await useCase.execute({
      draft: {
        name: "  Panadería La Luz  ",
        phone: "+52 278 999 0011",
        description: "Pan de masa madre horneado cada mañana.",
      },
      userId: USER_ID,
    });

    expect(result.errorMessage).toBeUndefined();
    expect(result.seller).toMatchObject({
      name: "Panadería La Luz",
      handle: "panaderia-la-luz",
      phone: "2789990011",
      userId: USER_ID,
    });
    expect(repository.saved).toHaveLength(1);
  });

  // Corrida de escritorio del Scenario Outline "El alta rechaza lo que la base no puede
  // guardar dos veces" en sellerStore.feature.
  it.each([
    [
      "Hazlo Sano",
      "2789990022",
      "Ese nombre de tienda ya está ocupado. Prueba con otro o agrégale tu localidad.",
    ],
    [
      "Mi Changarro",
      "2781126948",
      "Ese teléfono ya está registrado en otra tienda.",
    ],
    ["", "2789990033", "El nombre de la tienda es obligatorio."],
    ["Mi Changarro", "123", "El teléfono debe tener 10 dígitos."],
  ])(
    "rechaza nombre %j con teléfono %j sin guardar nada",
    async (name, phone, expectedMessage) => {
      const result = await useCase.execute({
        draft: { name, phone },
        userId: USER_ID,
      });

      expect(result.errorMessage).toBe(expectedMessage);
      expect(result.seller).toBeUndefined();
      expect(repository.saved).toHaveLength(0);
    },
  );

  it("no deja abrir una segunda tienda a quien ya tiene una", async () => {
    repository = new FakeSellerRepository([{ ...hazloSano, userId: USER_ID }]);
    useCase = new BecomeSellerUseCase(repository);

    const result = await useCase.execute({
      draft: { name: "Otra Tienda", phone: "2789990044" },
      userId: USER_ID,
    });

    expect(result.errorMessage).toBe("Ya tienes una tienda registrada.");
    expect(repository.saved).toHaveLength(0);
  });

  it("propaga un fallo de infraestructura en vez de disfrazarlo de validación", async () => {
    const broken: ISellerRepository = {
      findByUserId: vi.fn().mockRejectedValue(new Error("connection refused")),
      findByHandle: vi.fn(),
      findByPhone: vi.fn(),
      save: vi.fn(),
    };

    await expect(
      new BecomeSellerUseCase(broken).execute({
        draft: { name: "Panadería La Luz", phone: "2789990011" },
        userId: USER_ID,
      }),
    ).rejects.toThrow("connection refused");
  });
});
