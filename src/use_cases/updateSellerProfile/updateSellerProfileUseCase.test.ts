import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Seller } from "~/domain/entities/seller/types";
import type ISellerProfileRepository from "./ports/ISellerProfileRepository";
import type { SellerProfileUpdate } from "./ports/ISellerProfileRepository";
import UpdateSellerProfileUseCase from "./updateSellerProfileUseCase";

const USER_ID = "44pZIIJ5w1vSYkDQ6gfb";

const miTienda: Seller = {
  id: "seller-1",
  name: "Panadería La Luz",
  handle: "panaderia-la-luz",
  phone: "2789990011",
  description: null,
  logoUrl: "https://storage.googleapis.com/logo-viejo.webp",
  url: null,
  userId: USER_ID,
};

// La tienda real que ya ocupa el teléfono 2781126948.
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

class FakeSellerProfileRepository implements ISellerProfileRepository {
  readonly updates: Array<[string, SellerProfileUpdate]> = [];

  constructor(private readonly sellers: Seller[] = []) {}

  async findByUserId(userId: string): Promise<Seller | null> {
    return this.sellers.find((seller) => seller.userId === userId) ?? null;
  }

  async findByPhone(phone: string): Promise<Seller | null> {
    return this.sellers.find((seller) => seller.phone === phone) ?? null;
  }

  async updateProfile(
    sellerId: string,
    update: SellerProfileUpdate,
  ): Promise<Seller> {
    this.updates.push([sellerId, update]);

    return { ...miTienda, ...update, id: sellerId };
  }
}

describe("UpdateSellerProfileUseCase", () => {
  let repository: FakeSellerProfileRepository;
  let useCase: UpdateSellerProfileUseCase;

  const draft = {
    name: "Panadería La Luz",
    phone: "2789990011",
    description: "Pan de masa madre horneado cada mañana.",
    url: "https://panaderialaluz.mx",
  };

  beforeEach(() => {
    repository = new FakeSellerProfileRepository([miTienda, hazloSano]);
    useCase = new UpdateSellerProfileUseCase(repository);
  });

  it("guarda descripción y sitio web", async () => {
    const result = await useCase.execute({ userId: USER_ID, draft });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0][1]).toMatchObject({
      description: "Pan de masa madre horneado cada mañana.",
      url: "https://panaderialaluz.mx",
    });
  });

  it("conservar el propio teléfono NO es un duplicado", async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, phone: "+52 278 999 0011" },
    });

    expect(result.errorMessage).toBeUndefined();
    expect(repository.updates[0][1].phone).toBe("2789990011");
  });

  it("rechaza el teléfono de otra tienda", async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, phone: hazloSano.phone },
    });

    expect(result.errorMessage).toBe(
      "Ese teléfono ya está registrado en otra tienda.",
    );
    expect(repository.updates).toHaveLength(0);
  });

  it.each([
    ["123", "El teléfono debe tener 10 dígitos."],
    ["", "El teléfono debe tener 10 dígitos."],
  ])("rechaza el teléfono %j", async (phone, expected) => {
    const result = await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, phone },
    });

    expect(result.errorMessage).toBe(expected);
    expect(repository.updates).toHaveLength(0);
  });

  it("exige nombre", async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, name: "   " },
    });

    expect(result.errorMessage).toBe("El nombre de la tienda es obligatorio.");
  });

  it("sin logo nuevo conserva el que ya tenía", async () => {
    await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, logoUrl: "" },
    });

    expect(repository.updates[0][1].logoUrl).toBe(miTienda.logoUrl);
  });

  it("cambia el nombre visible sin tocar la dirección", async () => {
    const result = await useCase.execute({
      userId: USER_ID,
      draft: { ...draft, name: "Panadería de Tezonapa" },
    });

    expect(result.seller?.name).toBe("Panadería de Tezonapa");
    expect(result.seller?.handle).toBe("panaderia-la-luz");
    // El `slug` no viaja en la actualización: es inmutable por decisión.
    expect(repository.updates[0][1]).not.toHaveProperty("handle");
  });

  it("a quien no tiene tienda le dice que la abra", async () => {
    const result = await useCase.execute({
      userId: "sin-tienda",
      draft,
    });

    expect(result.errorMessage).toBe("Primero abre tu tienda.");
  });

  it("propaga un fallo de infraestructura", async () => {
    const broken: ISellerProfileRepository = {
      findByUserId: vi.fn().mockRejectedValue(new Error("connection refused")),
      findByPhone: vi.fn(),
      updateProfile: vi.fn(),
    };

    await expect(
      new UpdateSellerProfileUseCase(broken).execute({
        userId: USER_ID,
        draft,
      }),
    ).rejects.toThrow("connection refused");
  });
});
