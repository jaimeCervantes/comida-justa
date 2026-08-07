import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Branch } from "~/domain/entities/seller/types";
import AddBranchUseCase from "./addBranchUseCase";
import type IBranchRepository from "./ports/IBranchRepository";
import type { NewBranch } from "./ports/IBranchRepository";
import type IMapUrlResolver from "./ports/IMapUrlResolver";

const SELLER_ID = "05bea858-88d0-4ff3-a531-3d82a7ad6fcc";

// La sucursal real: enlace corto guardado, coordenadas de Tezonapa, Veracruz.
const SHORT_URL = "https://maps.app.goo.gl/8M3zwu2aE6o8itKZ6";
const LONG_URL =
  "https://www.google.com/maps/place/Restaurante+Hazlo+Sano/@18.6,-96.68,17z/data=!4m6!3m5!8m2!3d18.6005415!4d-96.6872066";
const TEZONAPA = { latitude: 18.6005415, longitude: -96.6872066 };

const draft = {
  name: "Restaurante Hazlo Sano",
  address: "Calle Melchor Ocampo #2, Col. Las Flores. Tezonapa, Veracruz",
  mapUrl: LONG_URL,
};

class FakeBranchRepository implements IBranchRepository {
  readonly saved: NewBranch[] = [];

  async listBySeller(sellerId: string): Promise<Branch[]> {
    return this.saved
      .filter((branch) => branch.sellerId === sellerId)
      .map((branch, index) => ({ ...branch, id: `branch-${index}` }));
  }

  async save(branch: NewBranch): Promise<Branch> {
    this.saved.push(branch);

    return { ...branch, id: `branch-${this.saved.length}` };
  }

  /**
   * Siempre `null`: este doble guarda sucursales en memoria y no modela geografía, y dar de alta
   * una sucursal no consulta distancias. Devolver un número inventado haría creer que sí.
   */
  async distanceToNearestBranch(): Promise<number | null> {
    return null;
  }
}

describe("AddBranchUseCase", () => {
  let repository: FakeBranchRepository;
  let resolver: IMapUrlResolver;
  let useCase: AddBranchUseCase;

  beforeEach(() => {
    repository = new FakeBranchRepository();
    resolver = { expand: vi.fn(async (url: string) => url) };
    useCase = new AddBranchUseCase(repository, resolver);
  });

  it("guarda la sucursal con las coordenadas del enlace", async () => {
    const result = await useCase.execute({ draft, sellerId: SELLER_ID });

    expect(result.errorMessage).toBeUndefined();
    expect(result.branch).toMatchObject({
      name: draft.name,
      sellerId: SELLER_ID,
      coordinates: TEZONAPA,
    });
    expect(resolver.expand).not.toHaveBeenCalled();
  });

  it("sigue el enlace corto, que es el que reparte el botón Compartir", async () => {
    resolver = { expand: vi.fn(async () => LONG_URL) };
    useCase = new AddBranchUseCase(repository, resolver);

    const result = await useCase.execute({
      draft: { ...draft, mapUrl: SHORT_URL },
      sellerId: SELLER_ID,
    });

    expect(resolver.expand).toHaveBeenCalledWith(SHORT_URL);
    expect(result.branch?.coordinates).toEqual(TEZONAPA);
    // Se guarda el enlace corto tal como lo pegó el vendedor: es el que comparte con sus clientes.
    expect(repository.saved[0].mapUrl).toBe(SHORT_URL);
  });

  it("el GPS del navegador gana sobre lo que diga el enlace", async () => {
    const result = await useCase.execute({
      draft: { ...draft, coordinates: { latitude: 18.61, longitude: -96.69 } },
      sellerId: SELLER_ID,
    });

    expect(result.branch?.coordinates).toEqual({
      latitude: 18.61,
      longitude: -96.69,
    });
  });

  it.each([
    [
      "el enlace corto no se pudo seguir",
      { ...draft, mapUrl: SHORT_URL },
      "No pudimos ubicar ese enlace en el mapa.",
    ],
    [
      "el enlace no tiene coordenadas",
      { ...draft, mapUrl: "https://www.google.com/maps/place/Tezonapa" },
      "No pudimos ubicar ese enlace en el mapa.",
    ],
    [
      "falta el nombre",
      { ...draft, name: "   " },
      "El nombre de la sucursal es obligatorio.",
    ],
    [
      "falta la dirección",
      { ...draft, address: "" },
      "La dirección de la sucursal es obligatoria.",
    ],
  ])("no guarda nada cuando %s", async (_caso, badDraft, expectedStart) => {
    const result = await useCase.execute({
      draft: badDraft,
      sellerId: SELLER_ID,
    });

    expect(result.errorMessage?.startsWith(expectedStart)).toBe(true);
    expect(result.branch).toBeUndefined();
    expect(repository.saved).toHaveLength(0);
  });

  it("unas coordenadas imposibles no se toman por buenas", async () => {
    const result = await useCase.execute({
      draft: {
        ...draft,
        mapUrl: "https://www.google.com/maps/place/Tezonapa",
        coordinates: { latitude: 999, longitude: 0 },
      },
      sellerId: SELLER_ID,
    });

    expect(result.errorMessage).toBeDefined();
    expect(repository.saved).toHaveLength(0);
  });

  it("propaga un fallo de infraestructura en vez de disfrazarlo de validación", async () => {
    const broken: IBranchRepository = {
      listBySeller: vi.fn(),
      save: vi.fn().mockRejectedValue(new Error("connection refused")),
      distanceToNearestBranch: vi.fn(),
    };

    await expect(
      new AddBranchUseCase(broken, resolver).execute({
        draft,
        sellerId: SELLER_ID,
      }),
    ).rejects.toThrow("connection refused");
  });
});
