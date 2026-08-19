import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTaxonomy } from "~/domain/entities/post/__fixtures__/categoryTaxonomy";

const { auth, isAdmin, updateOnePost } = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdmin: vi.fn(),
  updateOnePost: vi.fn(),
}));

vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getLocale: async () => "es",
  getTranslations: async () => (key: string) =>
    (
      ({
        errorTitleRequired: "El título es obligatorio.",
        errorContentRequired: "El contenido es obligatorio.",
        errorMediaRequired: "Sube al menos una imagen o un video.",
      }) as Record<string, string>
    )[key] ?? key,
}));
vi.mock("~/infra/auth", () => ({ auth }));
vi.mock("~/infra/auth/isAdmin", () => ({ isAdmin }));
vi.mock("~/infra/dataAccess/categories/cachedCategoryTaxonomy", () => ({
  getCategoryTaxonomy: async () => makeTaxonomy(),
}));
vi.mock("~/infra/dataAccess/managePost/factory", () => ({
  createPostAdminRepository: () => ({}),
}));
vi.mock("~/infra/dataAccess/moderatePost/factory", () => ({
  createReviewPostContentUseCase: () => ({ execute: vi.fn() }),
}));
vi.mock("~/infra/dataAccess/indexPostEmbedding/factory", () => ({
  createIndexPostEmbeddingUseCase: () => ({ execute: vi.fn() }),
}));
vi.mock("~/i18n/redirectKeepingLocale", () => ({
  redirectKeepingLocale: vi.fn(() => {
    throw new Error("redirect");
  }),
}));
vi.mock("~/use_cases/managePost/updateOnePostUseCase", () => ({
  default: vi.fn(() => ({ execute: updateOnePost })),
}));

import { updatePost } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();

  for (const [key, value] of Object.entries(fields)) data.append(key, value);

  return data;
}

function validFields(overrides: Record<string, string> = {}): FormData {
  return form({
    slug: "jugo-verde",
    kind: "producto",
    title: "Jugo verde",
    content: "Espinaca, apio, pepino y limón.",
    phone: "2781092116",
    price: "40",
    origin: "productor",
    media: JSON.stringify([
      {
        url: "https://example.com/jugo.jpg",
        type: "image",
        alt: "Jugo verde",
      },
    ]),
    ...overrides,
  });
}

describe("updatePost — errores de campo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({
      user: { id: "user-1", email: "persona@example.com" },
    });
    isAdmin.mockReturnValue(false);
    updateOnePost.mockResolvedValue({
      slug: "jugo-verde",
      postId: "post-1",
      locale: "es",
      textChanged: false,
    });
  });

  it("devuelve title y content bajo errors para que el formulario los pinte en su campo", async () => {
    const state = await updatePost({}, validFields({ title: "", content: "" }));

    expect(state.errors?.title).toBe("El título es obligatorio.");
    expect(state.errors?.content).toBe("El contenido es obligatorio.");
    expect(state.errorMessage).toBeUndefined();
    expect(updateOnePost).not.toHaveBeenCalled();
  });

  it("devuelve media bajo errors para que PostMediaField pueda mostrarlo junto a la bandeja", async () => {
    const state = await updatePost({}, validFields({ media: "[]" }));

    expect(state.errors?.media).toBe("Sube al menos una imagen o un video.");
    expect(state.errorMessage).toBeUndefined();
    expect(updateOnePost).not.toHaveBeenCalled();
  });
});
