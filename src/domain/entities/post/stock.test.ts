import { describe, expect, it } from "vitest";
import {
  availabilityForStock,
  canTrackStock,
  carriesInventory,
  isOutOfStock,
  parseStockQuantity,
} from "./stock";

describe("carriesInventory", () => {
  it("solo lleva inventario lo que tiene un número", () => {
    expect(carriesInventory({ stockQuantity: 12 })).toBe(true);
    expect(carriesInventory({ stockQuantity: 0 })).toBe(true);
  });

  /* La distinción que sostiene toda la entrega: las 432 publicaciones del día de la migración
     quedaron nulas, y nulo no puede leerse como "agotado". */
  it("nulo y ausente no son cero: es no llevar inventario", () => {
    expect(carriesInventory({ stockQuantity: null })).toBe(false);
    expect(carriesInventory({})).toBe(false);
  });
});

describe("canTrackStock", () => {
  it.each([
    ["producto", true],
    ["servicio", false],
    ["evento", false],
    ["anuncio", false],
  ])("un %s %s cuenta ejemplares", (kind, expected) => {
    expect(canTrackStock({ kind })).toBe(expected);
  });
});

describe("isOutOfStock", () => {
  it("está agotado el producto que lleva inventario y marca cero", () => {
    expect(isOutOfStock({ kind: "producto", stockQuantity: 0 })).toBe(true);
  });

  it("no lo está el que aún tiene", () => {
    expect(isOutOfStock({ kind: "producto", stockQuantity: 1 })).toBe(false);
  });

  /* Sin inventario la pregunta no aplica: quien decide es el interruptor manual, y contestar que sí
     agotaría el catálogo entero de golpe. */
  it("el que no lleva inventario nunca se agota por esta vía", () => {
    expect(isOutOfStock({ kind: "producto", stockQuantity: null })).toBe(false);
  });

  it("un servicio en cero tampoco: no cuenta ejemplares", () => {
    expect(isOutOfStock({ kind: "servicio", stockQuantity: 0 })).toBe(false);
  });
});

describe("availabilityForStock", () => {
  it.each([
    [0, false],
    [1, true],
    [12, true],
  ])("con %i unidades la disponibilidad derivada es %s", (qty, expected) => {
    expect(availabilityForStock(qty)).toBe(expected);
  });
});

describe("parseStockQuantity", () => {
  it.each([
    ["0", 0],
    ["25", 25],
    [" 7 ", 7],
  ])("acepta %j como %i", (raw, expected) => {
    expect(parseStockQuantity(raw)).toEqual({ quantity: expected });
  });

  it.each([
    ["-1", "no existen unidades negativas"],
    ["2.5", "media dona no es un ejemplar"],
    ["abc", "no es un número"],
    ["", "no dice nada"],
    [null, "no vino en el formulario"],
  ])("rechaza %j porque %s", (raw) => {
    expect(parseStockQuantity(raw)).toEqual({ error: "invalid-stock" });
  });

  /* El `CHECK` de la base tampoco lo aceptaría, pero llegar hasta allí para enterarse convierte un
     mensaje entendible en una violación de constraint. */
  it("rechaza un número que no cabe en un entero", () => {
    expect(parseStockQuantity("9999999999")).toEqual({
      error: "invalid-stock",
    });
  });
});
