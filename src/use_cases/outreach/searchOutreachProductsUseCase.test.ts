import { describe, expect, it, vi } from "vitest";
import { SELLABLE_KINDS } from "~/domain/entities/post/kind";
import type { SearchPostsResult } from "~/use_cases/searchPosts/SearchPostsUseCase";
import SearchOutreachProductsUseCase, {
  OUTREACH_SEARCH_PAGE_SIZE,
} from "./searchOutreachProductsUseCase";

const LOCALES = { locale: "es", fallbackLocale: "es" };

function searchReturning(result: Partial<SearchPostsResult>) {
  return {
    execute: vi.fn().mockResolvedValue({
      results: [],
      total: 0,
      strategy: "none",
      counts: null,
      ...result,
    }),
  };
}

/** El buscador por palabras, que no encuentra nada: responde la búsqueda del sitio. */
function nothingByWords() {
  return { findByWords: vi.fn().mockResolvedValue({ matches: [], total: 0 }) };
}

/** Un resultado de la búsqueda del sitio, con lo que el selector lee de él. */
const chocolate = {
  id: "pan-chocolate",
  title: "Sourdough Chocolate Bread",
  translations: {
    en: { title: "Sourdough Chocolate Bread", content: "", slug: "x" },
    es: { title: "Pan de Masa Madre de Chocolate", content: "", slug: "y" },
  },
  price: 136,
  media: [
    { url: "https://cdn/video.mp4", type: "video" },
    { url: "https://cdn/chocolate.jpg", type: "image" },
  ],
} as never;

const CANELA = {
  postId: "pan-canela",
  title: "Pan de masa madre de canela",
  price: 125,
  photoUrl: null,
};

/** Slice 10 de `difusionEnGrupos.feature`: primero las palabras que uno recuerda. */
describe("SearchOutreachProductsUseCase, primero por palabras", () => {
  it("busca las palabras dobladas, solo lo que se vende y de diez en diez", async () => {
    const finder = {
      findByWords: vi.fn().mockResolvedValue({ matches: [CANELA], total: 1 }),
    };
    const search = searchReturning({});

    const page = await new SearchOutreachProductsUseCase(
      finder,
      search,
    ).execute("Madr  CANEL", 1, LOCALES);

    expect(finder.findByWords).toHaveBeenCalledWith(
      ["madr", "canel"],
      1,
      OUTREACH_SEARCH_PAGE_SIZE,
      LOCALES,
      SELLABLE_KINDS,
    );
    expect(page).toEqual({
      matches: [CANELA],
      total: 1,
      page: 1,
      pageSize: OUTREACH_SEARCH_PAGE_SIZE,
    });
    // Con lo que encontraron las palabras basta: no se paga la búsqueda del sitio.
    expect(search.execute).not.toHaveBeenCalled();
  });

  // Escenario «Si las palabras no encuentran nada, responde la búsqueda del sitio».
  it("si las palabras no encuentran nada, responde la búsqueda del sitio", async () => {
    const search = searchReturning({ results: [chocolate], total: 1 });

    const page = await new SearchOutreachProductsUseCase(
      nothingByWords(),
      search,
    ).execute("algo para dormir", 1, LOCALES);

    expect(search.execute).toHaveBeenCalledWith(
      expect.objectContaining({ query: "algo para dormir" }),
    );
    expect(page.total).toBe(1);
  });
});

/** Slice 8 de `difusionEnGrupos.feature`: cuando responde la búsqueda del sitio. */
describe("SearchOutreachProductsUseCase, con la búsqueda del sitio", () => {
  it("busca con la búsqueda del sitio, solo lo que se vende y de diez en diez", async () => {
    const search = searchReturning({});

    await new SearchOutreachProductsUseCase(nothingByWords(), search).execute(
      "pan chocolate",
      2,
      LOCALES,
    );

    expect(search.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "pan chocolate",
        page: 2,
        pageSize: OUTREACH_SEARCH_PAGE_SIZE,
        locale: "es",
        kinds: SELLABLE_KINDS,
      }),
    );
    expect(OUTREACH_SEARCH_PAGE_SIZE).toBe(10);
  });

  it("cada resultado lleva su título en el idioma del panel, su precio y su primera foto", async () => {
    const search = searchReturning({ results: [chocolate], total: 23 });

    const page = await new SearchOutreachProductsUseCase(
      nothingByWords(),
      search,
    ).execute("pan chocolate", 1, LOCALES);

    expect(page).toEqual({
      matches: [
        {
          postId: "pan-chocolate",
          title: "Pan de Masa Madre de Chocolate",
          price: 136,
          photoUrl: "https://cdn/chocolate.jpg",
        },
      ],
      total: 23,
      page: 1,
      pageSize: OUTREACH_SEARCH_PAGE_SIZE,
    });
  });

  it("sin foto ni precio, lo dice con nulos en vez de inventar", async () => {
    const search = searchReturning({
      results: [{ id: "sin-nada", title: "Kombucha", media: [] } as never],
      total: 1,
    });

    const { matches } = await new SearchOutreachProductsUseCase(
      nothingByWords(),
      search,
    ).execute("kombucha", 1, LOCALES);

    expect(matches[0]).toMatchObject({ price: null, photoUrl: null });
  });

  it("sin nada escrito no busca", async () => {
    const search = searchReturning({});

    const page = await new SearchOutreachProductsUseCase(
      nothingByWords(),
      search,
    ).execute("   ", 3, LOCALES);

    expect(search.execute).not.toHaveBeenCalled();
    expect(page).toMatchObject({ matches: [], total: 0, page: 1 });
  });

  it("una página imposible se vuelve la primera", async () => {
    const search = searchReturning({});

    await new SearchOutreachProductsUseCase(nothingByWords(), search).execute(
      "pan",
      0,
      LOCALES,
    );

    expect(search.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    );
  });
});
