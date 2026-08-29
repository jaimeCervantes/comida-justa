import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTaxonomy } from "~/domain/entities/post/__fixtures__/categoryTaxonomy";

const { auth, isAdmin, updateOnePost, saveRoute, removeRoute } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    isAdmin: vi.fn(),
    updateOnePost: vi.fn(),
    saveRoute: vi.fn(),
    removeRoute: vi.fn(),
  }),
);

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
vi.mock("~/infra/dataAccess/routes/factory", () => ({
  createRouteRepository: () => ({ save: saveRoute, remove: removeRoute }),
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

/**
 * El recorrido al editar.
 *
 * Hasta este slice `/editar/[slug]` ni montaba el campo: un evento publicado no podía cambiar ni
 * quitar su GPX, y la única salida era borrar la publicación y rehacerla —perdiendo su dirección,
 * sus comentarios y su antigüedad—.
 *
 * Lo que se afirma aquí es **cuándo se toca `post_routes` y cuándo no**. La regla que más importa es
 * la aburrida: no tocarlo. Casi toda edición es una falta de ortografía en el título, y si «no subí
 * archivo» borrara la ruta, el evento perdería su trazo por corregir una coma.
 */
describe("updatePost — el recorrido de un evento", () => {
  const EVENT_FIELDS = {
    kind: "evento",
    price: "",
    origin: "",
    startsAt: "2027-09-05T09:00",
    timeZone: "America/Mexico_City",
  };

  const ROUTE_PAYLOAD = JSON.stringify({
    points: [
      { latitude: 19.1, longitude: -99.1 },
      { latitude: 19.2, longitude: -99.2 },
    ],
    meters: 1500,
    originalPoints: 900,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({
      user: { id: "user-1", email: "persona@example.com" },
    });
    isAdmin.mockReturnValue(false);
    updateOnePost.mockResolvedValue({
      slug: "rodada-del-sabado",
      postId: "post-1",
      locale: "es",
      textChanged: false,
    });
  });

  it("no toca la ruta cuando nadie sube nada: es el caso normal", async () => {
    await expect(
      updatePost({}, validFields({ ...EVENT_FIELDS, route: "" })),
    ).rejects.toThrow("redirect");

    expect(saveRoute).not.toHaveBeenCalled();
    expect(removeRoute).not.toHaveBeenCalled();
  });

  it("la reemplaza cuando llega un GPX nuevo", async () => {
    await expect(
      updatePost({}, validFields({ ...EVENT_FIELDS, route: ROUTE_PAYLOAD })),
    ).rejects.toThrow("redirect");

    expect(saveRoute).toHaveBeenCalledWith({
      postId: "post-1",
      points: expect.any(Array),
      lengthMeters: 1500,
      sourcePoints: 900,
    });
    expect(removeRoute).not.toHaveBeenCalled();
  });

  it("la quita cuando se pide con su palabra", async () => {
    await expect(
      updatePost({}, validFields({ ...EVENT_FIELDS, route: "removed" })),
    ).rejects.toThrow("redirect");

    expect(removeRoute).toHaveBeenCalledWith("post-1");
    expect(saveRoute).not.toHaveBeenCalled();
  });

  /* Un GPX ilegible no puede costarle a nadie el resto de la edición: se contesta en el campo, como
     cualquier otro error, y la publicación no se toca. */
  it("un recorrido roto se contesta en su campo y no guarda nada", async () => {
    const state = await updatePost(
      {},
      validFields({ ...EVENT_FIELDS, route: "{no soy json" }),
    );

    expect(state.errors?.route).toBeTruthy();
    expect(updateOnePost).not.toHaveBeenCalled();
    expect(saveRoute).not.toHaveBeenCalled();
  });

  /*
   * El campo sólo se pinta en un evento, así que un `route` en un producto viene de un formulario
   * manipulado. Se ignora en vez de guardarse: `post_routes` es de los eventos.
   */
  it("ignora el recorrido en algo que no es un evento", async () => {
    await expect(
      updatePost({}, validFields({ route: ROUTE_PAYLOAD })),
    ).rejects.toThrow("redirect");

    expect(saveRoute).not.toHaveBeenCalled();
    expect(removeRoute).not.toHaveBeenCalled();
  });

  /*
   * La edición ya se guardó y es válida sin recorrido. Reventar aquí le diría a la persona que no se
   * guardó nada, y sería mentira: lo demás sí está.
   */
  it("si guardar la ruta falla, la edición sigue en pie", async () => {
    saveRoute.mockRejectedValueOnce(new Error("se cayó la base"));

    await expect(
      updatePost({}, validFields({ ...EVENT_FIELDS, route: ROUTE_PAYLOAD })),
    ).rejects.toThrow("redirect");

    expect(updateOnePost).toHaveBeenCalled();
  });
});
