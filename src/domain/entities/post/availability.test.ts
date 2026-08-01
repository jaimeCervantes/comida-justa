import { describe, expect, it } from "vitest";
import { canBeOrdered, isSoldOut } from "./availability";

// Datos reales: "Jugo Verde" es producto; los 10 anuncios de la comunidad no se agotan.
describe("isSoldOut", () => {
  it.each([
    ["producto disponible", { kind: "producto", isAvailable: true }, false],
    ["producto agotado", { kind: "producto", isAvailable: false }, true],
    [
      "anuncio, que no se agota",
      { kind: "anuncio", isAvailable: false },
      false,
    ],
    ["lectura sin la columna", { kind: "producto" }, false],
  ])("%s → %s", (_caso, post, expected) => {
    expect(isSoldOut(post)).toBe(expected);
  });
});

describe("canBeOrdered", () => {
  it.each([
    ["producto disponible", { kind: "producto", isAvailable: true }, true],
    ["producto agotado", { kind: "producto", isAvailable: false }, false],
    [
      "anuncio: no hay nada que pedir",
      { kind: "anuncio", isAvailable: true },
      false,
    ],
  ])("%s → %s", (_caso, post, expected) => {
    expect(canBeOrdered(post)).toBe(expected);
  });
});
