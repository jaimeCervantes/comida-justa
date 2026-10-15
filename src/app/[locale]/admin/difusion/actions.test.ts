import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, isAdmin, create, update, remove, redirectKeepingLocale } =
  vi.hoisted(() => ({
    auth: vi.fn(),
    isAdmin: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    redirectKeepingLocale: vi.fn(),
  }));

/* La acción resuelve sus mensajes con el catálogo; aquí basta con que devuelva la clave, porque lo
   que se afirma es qué hace la acción, no cómo está redactado el aviso. */
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "es",
}));
vi.mock("~/infra/auth", () => ({ auth }));
vi.mock("~/infra/auth/isAdmin", () => ({ isAdmin }));
vi.mock("~/i18n/redirectKeepingLocale", () => ({ redirectKeepingLocale }));
vi.mock("~/infra/dataAccess/outreach/factory", () => ({
  createOutreachTextRepository: () => ({ create, update, delete: remove }),
}));

import { deleteOutreachText, saveOutreachText } from "./actions";

const MASA_MADRE = [
  { postId: "pan-natural", label: "Natural", emoji: "🌾" },
  { postId: "pan-semillas", label: "Semillas", emoji: "" },
];

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

function masaMadre(overrides: Record<string, string> = {}): FormData {
  return form({
    name: "Masa madre",
    opening: "Pasa por el tuyo a Hazlo Sano:",
    closing: "",
    items: JSON.stringify(MASA_MADRE),
    ...overrides,
  });
}

describe("saveOutreachText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    create.mockResolvedValue("texto-nuevo");
    update.mockResolvedValue(true);
  });

  it("crea el texto con sus productos en el orden del formulario y lleva a su kit", async () => {
    await saveOutreachText({ errors: {} }, masaMadre());

    expect(create).toHaveBeenCalledWith({
      name: "Masa madre",
      opening: "Pasa por el tuyo a Hazlo Sano:",
      closing: "",
      items: [
        { postId: "pan-natural", label: "Natural", emoji: "🌾" },
        { postId: "pan-semillas", label: "Semillas", emoji: null },
      ],
      versions: [],
      footerId: null,
    });
    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      { pathname: "/admin/difusion/[id]", params: { id: "texto-nuevo" } },
      "es",
    );
  });

  it("guarda las otras versiones en orden, sin las vacías, y el pie elegido", async () => {
    const data = masaMadre({ footerId: "pie-hazlo-sano" });
    for (const version of ["Hecha aquí:", "  ", "Sin levadura industrial:"]) {
      data.append("versions", version);
    }

    await saveOutreachText({ errors: {} }, data);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        versions: ["Hecha aquí:", "Sin levadura industrial:"],
        footerId: "pie-hazlo-sano",
      }),
    );
  });

  it("con identidad reemplaza ese texto en vez de crear otro", async () => {
    await saveOutreachText({ errors: {} }, masaMadre({ id: "texto-1" }));

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      "texto-1",
      expect.objectContaining({ name: "Masa madre" }),
    );
  });

  // Una Server Action se puede invocar directamente: el gate de la página no basta.
  it("quien no es admin no guarda nada", async () => {
    isAdmin.mockReturnValue(false);

    const state = await saveOutreachText({ errors: {} }, masaMadre());

    expect(state.errors.form).toBe("noPermission");
    expect(create).not.toHaveBeenCalled();
  });

  it("dice qué falta y dónde, sin guardar", async () => {
    const state = await saveOutreachText(
      { errors: {} },
      masaMadre({
        name: " ",
        items: JSON.stringify([
          { postId: "pan-natural", label: "Natural", emoji: null },
          { postId: "pan-semillas", label: "", emoji: null },
        ]),
      }),
    );

    expect(state.errors).toEqual({
      name: "nameRequired",
      items: { 1: "labelRequired" },
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("avisa si el texto que se editaba ya no existe", async () => {
    update.mockResolvedValue(false);

    const state = await saveOutreachText(
      { errors: {} },
      masaMadre({ id: "texto-borrado" }),
    );

    expect(state.errors.form).toBe("notFound");
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });

  // Un producto borrado mientras el formulario estaba abierto choca contra su llave foránea.
  it("un error de la base se dice en vez de romper la pantalla", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValue(new Error("violates foreign key constraint"));

    const state = await saveOutreachText({ errors: {} }, masaMadre());

    expect(state.errors.form).toBe("saveFailed");
  });

  // Solo llega así una petición armada a mano.
  it.each([
    ["no es JSON", "{"],
    ["no es una lista", JSON.stringify({ postId: "pan-natural" })],
    ["renglones sin forma", JSON.stringify([42, { label: "sin producto" }])],
  ])("descarta productos que %s", async (_caso, items) => {
    await saveOutreachText({ errors: {} }, masaMadre({ items }));

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ items: [] }));
  });
});

describe("deleteOutreachText", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    remove.mockResolvedValue(true);
  });

  it("borra la publicación y vuelve a la lista", async () => {
    await deleteOutreachText({}, form({ id: "texto-1" }));

    expect(remove).toHaveBeenCalledWith("texto-1");
    expect(redirectKeepingLocale).toHaveBeenCalledWith("/admin/difusion", "es");
  });

  // Una Server Action se puede invocar directamente: el gate de la página no basta.
  it("quien no es admin no borra nada", async () => {
    isAdmin.mockReturnValue(false);

    expect(await deleteOutreachText({}, form({ id: "texto-1" }))).toEqual({
      error: "noPermission",
    });
    expect(remove).not.toHaveBeenCalled();
  });

  // Lo borró otra persona entre que se abrió la pantalla y se confirmó.
  it("si ya no existía, lo dice sin volver a la lista", async () => {
    remove.mockResolvedValue(false);

    expect(await deleteOutreachText({}, form({ id: "texto-1" }))).toEqual({
      error: "notFound",
    });
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });
});
