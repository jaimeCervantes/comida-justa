import { describe, expect, it } from "vitest";
import { SellerHandleUnusableError } from "./errors";
import {
  generateSellerHandle,
  isValidSellerHandle,
  RESERVED_SELLER_HANDLES,
  resolveSellerHandle,
  SELLER_HANDLE_MAX_LENGTH,
} from "./handle";

describe("generateSellerHandle", () => {
  // Corrida de escritorio del escenario @slice-1 @component de sellerStore.feature.
  it.each([
    ["Panadería La Luz", "panaderia-la-luz"],
    ["Hazlo Sano", "hazlo-sano"],
    ['Tortillería  "El Sol"', "tortilleria-el-sol"],
    ["Café  &  Té", "cafe-te"],
    ["  Miel del Monte  ", "miel-del-monte"],
    ["Jugos 100% Naturales", "jugos-100-naturales"],
  ])("%j se convierte en la dirección %j", (name, expected) => {
    expect(generateSellerHandle(name)).toBe(expected);
  });

  it("no deja un guion colgando cuando el nombre se pasa de largo", () => {
    // El corte cae justo en el espacio entre palabras, que ya es un guion.
    const name = `${"a".repeat(SELLER_HANDLE_MAX_LENGTH)} Tezonapa`;

    const handle = generateSellerHandle(name);

    expect(handle).toHaveLength(SELLER_HANDLE_MAX_LENGTH);
    expect(handle.endsWith("-")).toBe(false);
  });

  it.each([null, undefined, ""])("%j no rompe, devuelve vacío", (name) => {
    expect(generateSellerHandle(name)).toBe("");
  });
});

describe("isValidSellerHandle", () => {
  it.each([
    ["panaderia-la-luz", true],
    ["abc", true],
    ["ab", false], // dos caracteres no se distinguen de un error de dedo
    ["", false],
  ])("%j → %s", (handle, expected) => {
    expect(isValidSellerHandle(handle)).toBe(expected);
  });

  it.each(RESERVED_SELLER_HANDLES)(
    "%j está reservado para la propia ruta /tienda",
    (handle) => {
      expect(isValidSellerHandle(handle)).toBe(false);
    },
  );
});

describe("resolveSellerHandle", () => {
  it("devuelve la dirección cuando el nombre sirve", () => {
    expect(resolveSellerHandle("Panadería La Luz")).toBe("panaderia-la-luz");
  });

  it.each(["###", "—", "ab"])(
    "%j no da una dirección utilizable y se rechaza explicándolo",
    (name) => {
      expect(() => resolveSellerHandle(name)).toThrow(
        SellerHandleUnusableError,
      );
    },
  );
});
