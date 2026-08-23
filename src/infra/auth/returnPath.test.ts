import { describe, expect, it } from "vitest";
import { safeReturnPath, safeReturnUrl } from "./returnPath";

describe("safeReturnPath", () => {
  it.each([
    ["/pedidos", "/pedidos"],
    ["/en/orders", "/en/orders"],
    ["/tienda/hazlo-sano?ref=cartel", "/tienda/hazlo-sano?ref=cartel"],
    ["/caminata-a-la-luisa#asistir", "/caminata-a-la-luisa#asistir"],
  ])("acepta la ruta interna %s", (candidate, expected) => {
    expect(safeReturnPath(candidate)).toBe(expected);
  });

  it.each([
    ["https://otro-sitio.com/x", "no es de este sitio"],
    ["//otro-sitio.com", "el navegador lo lee como absoluta"],
    ["/\\otro-sitio.com", "el navegador lo lee como absoluta"],
    ["pedidos", "no es una ruta interna"],
    ["", "no hay destino"],
    [null, "no hay destino"],
    [undefined, "no hay destino"],
  ] as const)("rechaza %s porque %s", (candidate, _razon) => {
    expect(safeReturnPath(candidate)).toBeNull();
  });

  it.each([
    "/auth/signin",
    "/auth/signin?callbackUrl=%2Fpedidos",
    "/en/auth/signin",
  ])("rechaza %s para no volver a la propia puerta", (candidate) => {
    expect(safeReturnPath(candidate)).toBeNull();
  });
});

describe("safeReturnUrl", () => {
  const baseUrl = "https://hazlosano.com";

  it("devuelve absoluto lo que llega relativo", () => {
    expect(safeReturnUrl("/pedidos", baseUrl)).toBe(
      "https://hazlosano.com/pedidos",
    );
  });

  it("acepta lo absoluto del mismo sitio", () => {
    expect(safeReturnUrl("https://hazlosano.com/en/orders", baseUrl)).toBe(
      "https://hazlosano.com/en/orders",
    );
  });

  it.each([
    "https://otro-sitio.com/pedidos",
    "https://hazlosano.com.otro-sitio.com/pedidos",
    "https://hazlosano.com/auth/signin",
  ])("rechaza %s", (candidate) => {
    expect(safeReturnUrl(candidate, baseUrl)).toBeNull();
  });
});
