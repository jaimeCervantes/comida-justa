import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";
import type { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "./ports/ISearchPostRepository";
import { SearchPostsUseCase } from "./SearchPostsUseCase";

describe("SearchPostsUseCase", () => {
  let useCase: SearchPostsUseCase;
  let mockRepository: Mocked<ISearchPostRepository>;

  beforeEach(() => {
    mockRepository = {
      search: vi.fn(),
    };
    useCase = new SearchPostsUseCase(mockRepository);
  });

  it("should return empty results if query is empty", async () => {
    const result = await useCase.execute({ query: "", page: 1, pageSize: 10 });
    expect(result).toEqual({ results: [], total: 0 });
    expect(mockRepository.search).not.toHaveBeenCalled();
  });

  it("should call repository search with correct parameters", async () => {
    const mockResults: ISearchPostResultDTO[] = [
      {
        id: "1",
        title: "Test Post",
        content: "Content",
        slug: "test-post",
        media: { url: "", type: "image" },
        user: { id: "u1" },
        createdAt: new Date(),
        contactInfo: { phone: "123" },
      },
    ];
    mockRepository.search.mockResolvedValue({ results: mockResults, total: 1 });

    const result = await useCase.execute({
      query: "test",
      page: 1,
      pageSize: 10,
    });

    expect(mockRepository.search).toHaveBeenCalledWith(
      "test",
      1,
      10,
      undefined,
      null,
      undefined,
    );
    expect(result).toEqual({ results: mockResults, total: 1 });
  });

  /*
   * La ubicación se pasa tal cual, sin decidir nada sobre ella: quién sabe dónde está quien busca
   * es asunto de la capa de fuera, y qué hacer con esa distancia es asunto del repositorio. Aquí
   * solo tiene que llegar.
   */
  it("le pasa al repositorio desde dónde medir", async () => {
    mockRepository.search.mockResolvedValue({ results: [], total: 0 });
    const near = { latitude: 18.6005415256606, longitude: -96.6872065729976 };

    await useCase.execute({ query: "pan", page: 1, pageSize: 6, near });

    expect(mockRepository.search).toHaveBeenCalledWith(
      "pan",
      1,
      6,
      undefined,
      near,
      undefined,
    );
  });

  it("y `null` cuando no se sabe, en vez de dejarlo indefinido", async () => {
    mockRepository.search.mockResolvedValue({ results: [], total: 0 });

    await useCase.execute({ query: "pan", page: 1, pageSize: 6 });

    expect(mockRepository.search).toHaveBeenCalledWith(
      "pan",
      1,
      6,
      undefined,
      null,
      undefined,
    );
  });
});

/**
 * El idioma de respaldo viaja hasta el repositorio sin que el caso de uso decida nada sobre él,
 * igual que la ubicación: quién es el idioma por defecto del sitio es asunto de la capa de fuera.
 *
 * Importa que llegue porque sin él la búsqueda filtraba `locale = pedido` a secas y una publicación
 * sin traducir era invisible: buscar en inglés devolvía cero resultados para todo el catálogo.
 */
describe("SearchPostsUseCase y el idioma de respaldo", () => {
  it("le pasa al repositorio a qué idioma caer", async () => {
    const repository = {
      search: vi.fn().mockResolvedValue({ results: [], total: 0 }),
    };

    await new SearchPostsUseCase(repository).execute({
      query: "pan",
      page: 1,
      pageSize: 6,
      locale: "en",
      fallbackLocale: "es",
    });

    expect(repository.search).toHaveBeenCalledWith(
      "pan",
      1,
      6,
      "en",
      null,
      "es",
    );
  });
});
