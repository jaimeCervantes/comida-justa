import { describe, expect, it } from "vitest";
import { storeHref } from "~/i18n/routes";
import { signInPathFor } from "./signInPath";

describe("signInPathFor", () => {
  it("lleva a la puerta del idioma activo, con la vuelta escrita dentro", () => {
    expect(signInPathFor("es", "/pedidos")).toBe(
      "/auth/signin?callbackUrl=%2Fpedidos",
    );
  });

  /* El prefijo tiene que ir en las **dos** rutas. Sin él en la vuelta, entrar desde una ficha en
     inglés devolvía a una dirección que en español no resuelve: cada idioma tiene su slug. */
  it("prefija tanto la puerta como la vuelta en inglés", () => {
    expect(signInPathFor("en", "/pedidos")).toBe(
      "/en/auth/signin?callbackUrl=%2Fen%2Forders",
    );
  });

  it("traduce el destino con parámetros", () => {
    expect(signInPathFor("en", storeHref("hazlo-sano"))).toBe(
      "/en/auth/signin?callbackUrl=%2Fen%2Fstore%2Fhazlo-sano",
    );
    expect(signInPathFor("es", storeHref("hazlo-sano"))).toBe(
      "/auth/signin?callbackUrl=%2Ftienda%2Fhazlo-sano",
    );
  });
});
