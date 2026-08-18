import { beforeEach, describe, expect, it, type Mocked, vi } from "vitest";
import type { ISearchPostResultDTO } from "./dtos/ISearchPostResultDTO";
import type { ISearchPostRepository } from "./ports/ISearchPostRepository";
import {
  SEMANTIC_MAX_DISTANCE,
  SearchPostsUseCase,
} from "./SearchPostsUseCase";

describe("SearchPostsUseCase", () => {
  let useCase: SearchPostsUseCase;
  let mockRepository: Mocked<ISearchPostRepository>;

  beforeEach(() => {
    mockRepository = {
      search: vi.fn(),
      // El puerto tiene dos métodos desde el rescate semántico; faltaba este.
      searchByVector: vi.fn(),
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
        media: [{ url: "", type: "image" }],
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

  it("pasa las claves de categoria del pilar al repositorio", async () => {
    mockRepository.search.mockResolvedValue({ results: [], total: 0 });

    await useCase.execute({
      query: "ritual",
      page: 1,
      pageSize: 6,
      categoryKeys: ["sueno_y_descanso", "rituales_de_sueno"],
    });

    expect(mockRepository.search).toHaveBeenCalledWith(
      "ritual",
      1,
      6,
      undefined,
      null,
      ["sueno_y_descanso", "rituales_de_sueno"],
    );
  });
});

/**
 * El idioma viaja hasta el repositorio sin que el caso de uso decida nada sobre él, igual que la
 * ubicación: en qué idioma se está leyendo el sitio es asunto de la capa de fuera.
 *
 * Ya no lo acompaña un `fallbackLocale`. Existía para ensanchar el filtro `t.locale = pedido`, que
 * dejaba invisible a la publicación sin traducir; al abrir la consulta a **toda** traducción no hay
 * filtro que ensanchar, y a qué idioma caer al pintar lo decide `resolvePostTranslation`. Ver
 * `docs/features/busqueda-entre-idiomas.md`.
 */
describe("SearchPostsUseCase y el idioma de quien busca", () => {
  it("le pasa al repositorio en qué idioma se está leyendo", async () => {
    const repository: Mocked<ISearchPostRepository> = {
      search: vi.fn().mockResolvedValue({ results: [], total: 0 }),
      // Este escenario no llega al rescate semántico, pero el puerto lo exige: sin él, el doble no
      // es un repositorio de búsqueda y `tsc` deja de poder comprobar la llamada de abajo.
      searchByVector: vi.fn(),
    };

    await new SearchPostsUseCase(repository).execute({
      query: "pan",
      page: 1,
      pageSize: 6,
      locale: "en",
    });

    expect(repository.search).toHaveBeenCalledWith(
      "pan",
      1,
      6,
      "en",
      null,
      undefined,
    );
  });
});

/**
 * Slice 3 de `docs/features/busqueda-semantica.md`: el rescate semántico.
 *
 * La decisión de coste del slice está aquí: una llamada al proveedor de embeddings **por búsqueda**
 * sería inasumible —la caja tiene 500 ms de rebote—, así que solo se paga cuando el texto completo
 * no encontró nada, que es justo cuando quien busca se iba a ir con las manos vacías.
 */
describe("SearchPostsUseCase y el rescate semántico", () => {
  const unResultado = {
    results: [{ id: "post-1" }] as never[],
    total: 1,
  };
  const sinResultados = { results: [], total: 0 };

  function makeRepo(textual: typeof unResultado, vectorial = sinResultados) {
    return {
      search: vi.fn().mockResolvedValue(textual),
      searchByVector: vi.fn().mockResolvedValue(vectorial),
    };
  }

  it("no llama al proveedor cuando el texto ya encontró algo", async () => {
    const repository = makeRepo(unResultado);
    const embedder = { generateEmbedding: vi.fn() };

    const result = await new SearchPostsUseCase(repository, embedder).execute({
      query: "pan",
      page: 1,
      pageSize: 6,
    });

    expect(result.total).toBe(1);
    expect(embedder.generateEmbedding).not.toHaveBeenCalled();
    expect(repository.searchByVector).not.toHaveBeenCalled();
  });

  it("pregunta por el sentido cuando el texto no encontró nada", async () => {
    const repository = makeRepo(sinResultados, unResultado);
    const embedder = {
      generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2]),
    };

    const result = await new SearchPostsUseCase(repository, embedder).execute({
      query: "algo para dormir mejor",
      page: 1,
      pageSize: 6,
      locale: "en",
    });

    expect(embedder.generateEmbedding).toHaveBeenCalledWith(
      "algo para dormir mejor",
    );
    /* Sin idioma: el vector no entiende de fronteras y estrecharlo por locale era contradecir la
       única razón de tenerlo. */
    expect(repository.searchByVector).toHaveBeenCalledWith(
      [0.1, 0.2],
      1,
      6,
      SEMANTIC_MAX_DISTANCE,
      null,
      undefined,
    );
    expect(result.total).toBe(1);
  });

  /**
   * Sin umbral el vecino más cercano existe **siempre**, así que buscar un disparate devolvería
   * jugos. El umbral se midió contra la base: lo bueno cae en 0.28–0.32 y lo absurdo en 0.45+.
   */
  it("lleva un umbral de distancia, no busca el más cercano a secas", async () => {
    const repository = makeRepo(sinResultados);
    const embedder = { generateEmbedding: vi.fn().mockResolvedValue([0.1]) };

    await new SearchPostsUseCase(repository, embedder).execute({
      query: "reparar la transmisión de un camión",
      page: 1,
      pageSize: 6,
    });

    const [, , , maxDistance] = repository.searchByVector.mock.calls[0];
    expect(maxDistance).toBe(SEMANTIC_MAX_DISTANCE);
    expect(maxDistance).toBeLessThan(0.45);
  });

  /* Una búsqueda sin resultados es una respuesta válida; un proveedor caído no puede convertirse
     en un error de la página. */
  it("devuelve cero resultados si el proveedor falla, sin lanzar", async () => {
    const repository = makeRepo(sinResultados);
    const embedder = {
      generateEmbedding: vi.fn().mockRejectedValue(new Error("Gemini caído")),
    };

    const result = await new SearchPostsUseCase(repository, embedder).execute({
      query: "lo que sea",
      page: 1,
      pageSize: 6,
    });

    expect(result).toEqual({ results: [], total: 0 });
    expect(repository.searchByVector).not.toHaveBeenCalled();
  });

  it("funciona sin proveedor configurado, solo que sin rescate", async () => {
    const repository = makeRepo(sinResultados);

    const result = await new SearchPostsUseCase(repository).execute({
      query: "lo que sea",
      page: 1,
      pageSize: 6,
    });

    expect(result).toEqual({ results: [], total: 0 });
    expect(repository.searchByVector).not.toHaveBeenCalled();
  });
});

/** Slice 4: medir qué se busca. */
describe("SearchPostsUseCase y la medición", () => {
  const conResultados = { results: [{ id: "1" }] as never[], total: 1 };
  const sinResultados = { results: [], total: 0 };

  function makeRepo(textual: typeof conResultados, vectorial = sinResultados) {
    return {
      search: vi.fn().mockResolvedValue(textual),
      searchByVector: vi.fn().mockResolvedValue(vectorial),
    };
  }

  it.each([
    ["text", conResultados, sinResultados],
    ["semantic", sinResultados, conResultados],
    ["none", sinResultados, sinResultados],
  ] as const)(
    "registra la estrategia %s",
    async (strategy, textual, vectorial) => {
      const reporter = { record: vi.fn() };
      const embedder = { generateEmbedding: vi.fn().mockResolvedValue([0.1]) };

      await new SearchPostsUseCase(
        makeRepo(textual, vectorial),
        embedder,
        reporter,
      ).execute({
        query: "  Pan Integral ",
        page: 1,
        pageSize: 6,
        locale: "es",
      });

      expect(reporter.record).toHaveBeenCalledTimes(1);
      expect(reporter.record.mock.calls[0][0]).toMatchObject({
        term: "pan integral",
        locale: "es",
        strategy,
      });
    },
  );

  /* Medir es lo primero que se sacrifica: si el destino falla, quien buscaba recibe sus resultados
     igual. */
  it("no rompe la búsqueda si medir falla", async () => {
    const reporter = {
      record: vi.fn(() => {
        throw new Error("destino caído");
      }),
    };

    const result = await new SearchPostsUseCase(
      makeRepo(conResultados),
      undefined,
      reporter,
    ).execute({ query: "pan", page: 1, pageSize: 6 });

    expect(result.total).toBe(1);
  });

  it("funciona sin medición configurada", async () => {
    const result = await new SearchPostsUseCase(
      makeRepo(conResultados),
    ).execute({ query: "pan", page: 1, pageSize: 6 });

    expect(result.total).toBe(1);
  });
});
