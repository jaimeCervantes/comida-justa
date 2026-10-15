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

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
  getLocale: async () => "es",
}));
vi.mock("~/infra/auth", () => ({ auth }));
vi.mock("~/infra/auth/isAdmin", () => ({ isAdmin }));
vi.mock("~/i18n/redirectKeepingLocale", () => ({ redirectKeepingLocale }));
vi.mock("~/infra/dataAccess/outreach/factory", () => ({
  createOutreachFooterRepository: () => ({ create, update, delete: remove }),
}));

import { deleteOutreachFooter, saveOutreachFooter } from "./actions";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("saveOutreachFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    create.mockResolvedValue("pie-nuevo");
    update.mockResolvedValue(true);
  });

  it("da de alta el pie y vuelve a la lista de pies", async () => {
    await saveOutreachFooter(
      { errors: {} },
      form({ name: "Hazlo Sano", body: "📲 Pedidos WhatsApp\r\n" }),
    );

    expect(create).toHaveBeenCalledWith({
      name: "Hazlo Sano",
      body: "📲 Pedidos WhatsApp",
    });
    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      "/admin/difusion/pies",
      "es",
    );
  });

  it("con identidad corrige ese pie", async () => {
    await saveOutreachFooter(
      { errors: {} },
      form({ id: "pie-1", name: "Hazlo Sano", body: "Nuevo" }),
    );

    expect(update).toHaveBeenCalledWith("pie-1", {
      name: "Hazlo Sano",
      body: "Nuevo",
    });
  });

  // Una Server Action se puede invocar directamente: el gate de la página no basta.
  it("quien no es admin no guarda nada", async () => {
    isAdmin.mockReturnValue(false);

    expect(
      await saveOutreachFooter(
        { errors: {} },
        form({ name: "Hazlo Sano", body: "Algo" }),
      ),
    ).toEqual({ errors: { form: "noPermission" } });
    expect(create).not.toHaveBeenCalled();
  });

  it("avisa si el pie que se corregía ya no existe", async () => {
    update.mockResolvedValue(false);

    const state = await saveOutreachFooter(
      { errors: {} },
      form({ id: "pie-borrado", name: "Hazlo Sano", body: "Nuevo" }),
    );

    expect(state.errors.form).toBe("footerNotFound");
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });

  it("dice qué falta, sin guardar", async () => {
    expect(
      await saveOutreachFooter({ errors: {} }, form({ name: "", body: "" })),
    ).toEqual({
      errors: { name: "footerNameRequired", body: "footerBodyRequired" },
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("deleteOutreachFooter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    remove.mockResolvedValue(true);
  });

  it("borra el pie y vuelve a la lista", async () => {
    await deleteOutreachFooter({}, form({ id: "pie-1" }));

    expect(remove).toHaveBeenCalledWith("pie-1");
    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      "/admin/difusion/pies",
      "es",
    );
  });

  // Una Server Action se puede invocar directamente: el gate de la página no basta.
  it("quien no es admin no borra nada", async () => {
    isAdmin.mockReturnValue(false);

    expect(await deleteOutreachFooter({}, form({ id: "pie-1" }))).toEqual({
      error: "noPermission",
    });
    expect(remove).not.toHaveBeenCalled();
  });

  // Lo borró otra persona entre que se abrió la pantalla y se confirmó.
  it("si ya no existía, lo dice sin volver a la lista", async () => {
    remove.mockResolvedValue(false);

    expect(await deleteOutreachFooter({}, form({ id: "pie-1" }))).toEqual({
      error: "footerNotFound",
    });
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });
});
