import { describe, expect, it } from "vitest";
import { canBeOrdered, isSellable, isSoldOut } from "./availability";

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

/**
 * Desde el slice 3 son **dos** los tipos que se venden.
 *
 * Importa porque `isSellable` decide media docena de comportamientos: el carrito, el botón de
 * WhatsApp, la insignia de agotado y la distancia a la tienda. Si un servicio no fuera vendible,
 * publicarlo sería publicar algo que nadie puede pedir.
 */
describe("isSellable — con servicios", () => {
  it("un servicio se vende, igual que un producto", () => {
    expect(isSellable({ kind: "servicio" })).toBe(true);
    expect(isSellable({ kind: "producto" })).toBe(true);
  });

  /* Un evento NO se vende: apuntarse a una rodada no es comprarla, y meterlo aquí lo metería en el
     carrito. Es otra decisión y otro slice. */
  it("un evento y un anuncio no", () => {
    expect(isSellable({ kind: "evento" })).toBe(false);
    expect(isSellable({ kind: "anuncio" })).toBe(false);
  });

  it("un servicio que ya no se ofrece no se puede pedir", () => {
    expect(canBeOrdered({ kind: "servicio", isAvailable: false })).toBe(false);
    expect(canBeOrdered({ kind: "servicio", isAvailable: true })).toBe(true);
  });
});
