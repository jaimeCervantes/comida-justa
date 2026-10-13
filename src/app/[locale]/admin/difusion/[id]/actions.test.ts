import { beforeEach, describe, expect, it, vi } from "vitest";

const { auth, isAdmin, execute, redirectKeepingLocale } = vi.hoisted(() => ({
  auth: vi.fn(),
  isAdmin: vi.fn(),
  execute: vi.fn(),
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
  createOutreachTextRepository: () => ({}),
  createOutreachChannelRepository: () => ({}),
  createOutreachPublicationRepository: () => ({}),
}));
/* Lo que se afirma aquí es la traducción entre el formulario y el caso de uso, que ya tiene sus
   propias pruebas con repositorios en memoria. */
vi.mock("~/use_cases/outreach/recordOutreachPublicationsUseCase", () => ({
  default: class {
    execute = execute;
  },
}));

import { markOutreachPublished } from "./actions";

function form(channelIds: string[], postId = ""): FormData {
  const data = new FormData();
  data.append("outreachTextId", "texto-1");
  data.append("postId", postId);
  for (const id of channelIds) data.append("channelIds", id);
  return data;
}

describe("markOutreachPublished", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.mockResolvedValue({ user: { email: "admin@hazlosano.com" } });
    isAdmin.mockReturnValue(true);
    execute.mockResolvedValue({ status: "recorded", count: 2 });
  });

  it("marca todos los grupos de una vez y vuelve a la misma publicación", async () => {
    await markOutreachPublished({}, form(["mamas", "emprendedores"]));

    expect(execute).toHaveBeenCalledWith({
      outreachTextId: "texto-1",
      channelIds: ["mamas", "emprendedores"],
      postId: null,
      locales: { locale: "es", fallbackLocale: "es" },
    });
    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      { pathname: "/admin/difusion/[id]", params: { id: "texto-1" } },
      "es",
    );
  });

  it("con un pan, lo marca vendido suelto", async () => {
    await markOutreachPublished({}, form(["compraventa"], "pan-chocolate"));

    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ postId: "pan-chocolate" }),
    );
  });

  it("quien no es admin no marca nada", async () => {
    isAdmin.mockReturnValue(false);

    expect(await markOutreachPublished({}, form(["mamas"]))).toEqual({
      error: "noPermission",
    });
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([
    ["nothing-selected", "markNothingSelected"],
    ["not-found", "notFound"],
    ["invalid", "markInvalid"],
  ])("«%s» se dice como «%s», sin salir de la página", async (status, key) => {
    execute.mockResolvedValue({ status });

    expect(await markOutreachPublished({}, form([]))).toEqual({ error: key });
    expect(redirectKeepingLocale).not.toHaveBeenCalled();
  });
});
