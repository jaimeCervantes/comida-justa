import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, isAdmin, create, update, redirectKeepingLocale } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    isAdmin: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    redirectKeepingLocale: vi.fn(),
  }),
);

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
  createOutreachChannelRepository: () => ({ create, update }),
}));

import { saveOutreachChannel } from "./actions";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const fields = {
    name: "Compra Venta Orizaba",
    url: "facebook.com/groups/compraventaorizaba",
    format: "listing",
    minDaysBetween: "7",
    notes: "Solo los sábados",
    ...overrides,
  };
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

describe("saveOutreachChannel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    create.mockResolvedValue("grupo-nuevo");
    update.mockResolvedValue(true);
  });

  it("da de alta el grupo con la dirección completa y vuelve a la lista", async () => {
    await saveOutreachChannel({ errors: {} }, form());

    expect(create).toHaveBeenCalledWith({
      name: "Compra Venta Orizaba",
      url: "https://facebook.com/groups/compraventaorizaba",
      format: "listing",
      minDaysBetween: 7,
      notes: "Solo los sábados",
    });
    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      "/admin/difusion/grupos",
      "es",
    );
  });

  it("con identidad corrige ese grupo", async () => {
    await saveOutreachChannel({ errors: {} }, form({ id: "grupo-1" }));

    expect(create).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      "grupo-1",
      expect.objectContaining({ minDaysBetween: 7 }),
    );
  });

  // Una Server Action se puede invocar directamente: el gate de la página no basta.
  it("quien no es admin no guarda nada", async () => {
    isAdmin.mockReturnValue(false);

    const state = await saveOutreachChannel({ errors: {} }, form());

    expect(state.errors.form).toBe("noPermission");
    expect(create).not.toHaveBeenCalled();
  });

  it("dice qué falta en cada campo, sin guardar", async () => {
    const state = await saveOutreachChannel(
      { errors: {} },
      form({
        name: "",
        url: "compra venta",
        format: "x",
        minDaysBetween: "-1",
      }),
    );

    expect(state.errors).toEqual({
      name: "groupNameRequired",
      url: "groupUrlInvalid",
      format: "groupFormatInvalid",
      minDaysBetween: "groupMinDaysInvalid",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("avisa si el grupo que se corregía ya no existe", async () => {
    update.mockResolvedValue(false);

    const state = await saveOutreachChannel(
      { errors: {} },
      form({ id: "grupo-borrado" }),
    );

    expect(state.errors.form).toBe("notFound");
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });
});
