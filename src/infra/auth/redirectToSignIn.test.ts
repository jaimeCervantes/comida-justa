import { beforeEach, describe, expect, it, vi } from "vitest";

/* Se dobla la redirección para poder afirmar **a dónde** manda sin salir del proceso, y las
   cabeceras porque el origen de un server action llega ahí y no en sus argumentos. */
const redirectKeepingLocale = vi.fn();
const requestHeaders = new Map<string, string>();

vi.mock("~/i18n/redirectKeepingLocale", () => ({
  redirectKeepingLocale: (...args: unknown[]) => redirectKeepingLocale(...args),
}));

vi.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (name: string) => requestHeaders.get(name) ?? null,
    }),
}));

import { redirectToSignInFrom, refererPath } from "./redirectToSignIn";

const SIGNIN = "/auth/signin";

beforeEach(() => {
  redirectKeepingLocale.mockClear();
  requestHeaders.clear();
  requestHeaders.set("host", "hazlosano.com");
});

describe("refererPath", () => {
  /* Un server action no sabe en qué página vive: `setAvailability` se dispara desde la ficha y
     desde cualquier tarjeta de listado. El `Referer` sí lo sabe, con prefijo y query incluidos. */
  it("devuelve la ruta completa de la página que envió el formulario", async () => {
    requestHeaders.set(
      "referer",
      "https://hazlosano.com/en/store/hazlo-sano?page=2",
    );

    expect(await refererPath()).toBe("/en/store/hazlo-sano?page=2");
  });

  it.each([
    ["https://otro-sitio.com/cuenta", "viene de otro sitio"],
    ["no-es-una-direccion", "no se puede leer"],
  ] as const)("descarta el referer que %s", async (referer) => {
    requestHeaders.set("referer", referer);

    expect(await refererPath()).toBeNull();
  });

  it("acepta que no haya referer: la vuelta se queda en la portada", async () => {
    expect(await refererPath()).toBeNull();
  });
});

describe("redirectToSignInFrom", () => {
  it("manda a la puerta con la vuelta escrita dentro", () => {
    redirectToSignInFrom("es", "/cuenta");

    expect(redirectKeepingLocale).toHaveBeenCalledWith(
      { pathname: SIGNIN, query: { callbackUrl: "/cuenta" } },
      "es",
    );
  });

  it.each([
    [null, "no hay origen que recordar"],
    ["/auth/signin?callbackUrl=%2Fcuenta", "el origen ya era la propia puerta"],
    ["https://otro-sitio.com/cuenta", "el origen no es de este sitio"],
  ] as const)("manda a la puerta sin vuelta cuando %s", (origen) => {
    redirectToSignInFrom("en", origen);

    expect(redirectKeepingLocale).toHaveBeenCalledWith(SIGNIN, "en");
  });
});
