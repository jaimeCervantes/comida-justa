import type { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import type { ISearchPostDTO } from "~/use_cases/searchPosts/dtos/ISearchPostDTO";

const { execute } = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({ results: [], total: 0 }),
}));

vi.mock("~/infra/dataAccess/searchPosts/factory", () => ({
  createSearchPostRepository: () => ({}),
  /* La medición va a la tabla `searches` desde la migración `0029_2026_08_08`; aquí basta con que
     exista, porque lo que se afirma es qué le llega al caso de uso. */
  createSearchReporter: () => ({ record: vi.fn() }),
}));
vi.mock("~/infra/services/factory", () => ({
  createEmbeddingService: () => ({}),
}));
vi.mock("~/infra/location/visitorLocation", () => ({
  readVisitorLocation: async () => null,
}));
vi.mock("~/use_cases/searchPosts/SearchPostsUseCase", () => ({
  SearchPostsUseCase: class {
    execute = execute;
  },
}));

import { GET } from "./route";

function get(url: string): Promise<Response> {
  return GET({ url } as NextRequest);
}

function lastDto(): ISearchPostDTO {
  return execute.mock.calls.at(-1)?.[0] as ISearchPostDTO;
}

/**
 * Slice 2 de `docs/features/busqueda-entre-idiomas.md`.
 *
 * El desplegable de `SearchBar` es el único cliente de esta ruta, y hasta ahora no le mandaba el
 * idioma: `searchParams.get("locale") || "es"` hacía que buscara en español aunque el sitio
 * estuviera en inglés. Al arreglar al cliente, la ruta pasa a recibir un idioma que viene de la
 * barra de direcciones, así que tiene que reducirlo a uno soportado antes de que llegue a la
 * consulta — donde un `fr` no tiene diccionario que le corresponda.
 */
describe("GET /api/search y el idioma", () => {
  it.each([
    ["?q=pan&locale=en", "en", "idioma soportado"],
    ["?q=pan&locale=es", "es", "idioma soportado"],
    ["?q=pan&locale=fr", "es", "no está en routing.locales"],
    ["?q=pan", "es", "no vino el parámetro"],
  ])("con %s busca en %s — %s", async (queryString, expected) => {
    await get(`https://comida-justa.test/api/search${queryString}`);

    expect(lastDto().locale).toBe(expected);
  });

  it("le pasa al caso de uso el término y el tamaño de página pedidos", async () => {
    await get("https://comida-justa.test/api/search?q=bread&limit=5&page=2");

    expect(lastDto()).toMatchObject({ query: "bread", pageSize: 5, page: 2 });
  });
});
